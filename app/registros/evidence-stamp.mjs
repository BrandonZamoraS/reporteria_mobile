function toSafeText(value, fallback) {
  const text = typeof value === "string" ? value.trim() : "";
  return text || fallback;
}

function formatCapturedAt(capturedAt, locale, timeZone) {
  const date = new Date(capturedAt);
  if (Number.isNaN(date.getTime())) {
    return capturedAt;
  }

  return new Intl.DateTimeFormat(locale || "es-CO", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: timeZone || undefined,
  }).format(date);
}

function formatAccuracy(accuracy) {
  if (typeof accuracy !== "number" || !Number.isFinite(accuracy)) {
    return null;
  }

  return Math.max(0, Math.round(accuracy));
}

export const EVIDENCE_TARGET_BYTES = 900 * 1024;
const EVIDENCE_MAX_DIMENSION = 1280;
const EVIDENCE_INITIAL_QUALITY = 0.82;
const EVIDENCE_MIN_QUALITY = 0.5;
const EVIDENCE_QUALITY_STEP = 0.08;

export function chooseEvidenceCompressionAttempt({ size, targetBytes, quality, minQuality }) {
  if (size <= targetBytes) {
    return { status: "ok" };
  }

  if (quality <= minQuality) {
    return { status: "too-large" };
  }

  return {
    status: "retry",
    quality: Math.max(minQuality, Number((quality - EVIDENCE_QUALITY_STEP).toFixed(2))),
  };
}

export function buildEvidenceStampLines(input) {
  const establishment = toSafeText(input.establishmentName, "Sin establecimiento");
  const user = toSafeText(input.userName, "Usuario");
  const dateLabel = formatCapturedAt(input.capturedAt, input.locale, input.timeZone);
  const accuracy = formatAccuracy(input.accuracy);
  const gpsBase = `GPS: ${input.lat.toFixed(6)}, ${input.lng.toFixed(6)}`;

  const lines = [establishment, user, dateLabel];

  lines.push(accuracy === null ? gpsBase : `${gpsBase} (+/-${accuracy}m)`);
  return lines;
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("No se pudo cargar la imagen para estampar."));
    image.src = url;
  });
}

function wrapLine(context, text, maxWidth) {
  const words = text.split(" ").filter(Boolean);
  if (words.length === 0) return [text];

  const wrapped = [];
  let current = words[0];

  for (let i = 1; i < words.length; i++) {
    const next = `${current} ${words[i]}`;
    if (context.measureText(next).width <= maxWidth) {
      current = next;
      continue;
    }

    wrapped.push(current);
    current = words[i];
  }

  wrapped.push(current);
  return wrapped;
}

async function canvasToBlob(canvas, quality) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality);
  });
}

function getContainedDimensions(width, height, maxDimension) {
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height };
  }

  if (width >= height) {
    return {
      width: maxDimension,
      height: Math.max(1, Math.round((height * maxDimension) / width)),
    };
  }

  return {
    width: Math.max(1, Math.round((width * maxDimension) / height)),
    height: maxDimension,
  };
}

async function renderEvidenceBlob({ image, lines, quality }) {
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  const dimensions = getContainedDimensions(sourceWidth, sourceHeight, EVIDENCE_MAX_DIMENSION);
  const canvas = document.createElement("canvas");
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("No se pudo crear el contexto de imagen.");
  }

  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const baseFontSize = Math.max(14, Math.round(canvas.width * 0.028));
  const lineHeight = Math.max(18, Math.round(baseFontSize * 1.25));
  const horizontalPadding = Math.max(12, Math.round(canvas.width * 0.03));
  const verticalPadding = Math.max(10, Math.round(canvas.height * 0.018));
  const maxLineWidth = canvas.width - horizontalPadding * 2;

  context.font = `600 ${baseFontSize}px sans-serif`;
  const wrappedLines = lines.flatMap((line) => wrapLine(context, line, maxLineWidth));
  const blockHeight = wrappedLines.length * lineHeight + verticalPadding * 2;
  const blockTop = Math.max(0, canvas.height - blockHeight);

  context.fillStyle = "rgba(0, 0, 0, 0.62)";
  context.fillRect(0, blockTop, canvas.width, canvas.height - blockTop);

  context.fillStyle = "#FFFFFF";
  context.textBaseline = "top";

  let y = blockTop + verticalPadding;
  for (const line of wrappedLines) {
    context.fillText(line, horizontalPadding, y);
    y += lineHeight;
  }

  return canvasToBlob(canvas, quality);
}

export async function stampEvidenceFile({ file, lines }) {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(objectUrl);
    let quality = EVIDENCE_INITIAL_QUALITY;

    while (true) {
      const stampedBlob = await renderEvidenceBlob({ image, lines, quality });
      if (!stampedBlob) {
        throw new Error("No se pudo generar la imagen estampada.");
      }

      const attempt = chooseEvidenceCompressionAttempt({
        size: stampedBlob.size,
        targetBytes: EVIDENCE_TARGET_BYTES,
        quality,
        minQuality: EVIDENCE_MIN_QUALITY,
      });

      if (attempt.status === "ok") {
        const fileName = file.name.replace(/\.[^/.]+$/, "") || "evidence";
        return new File([stampedBlob], `${fileName}.jpg`, {
          type: "image/jpeg",
          lastModified: Date.now(),
        });
      }

      if (attempt.status === "too-large") {
        throw new Error("La imagen procesada sigue pesando demasiado. Intenta tomarla con menor resolucion.");
      }

      quality = attempt.quality;
    }
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
