import { NextResponse } from "next/server";
import { isAllowedAppRole } from "@/lib/auth/roles";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { EvidenceGeoInfo } from "@/app/registros/types";

const EVIDENCE_BUCKET = "check-evidences";
const MAX_EVIDENCE_FILE_BYTES = 8 * 1024 * 1024;
const ALLOWED_EVIDENCE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

function getFileExtension(file: File) {
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

function parseGeoInfo(rawJson: string): EvidenceGeoInfo | null {
  try {
    const parsed = JSON.parse(rawJson);
    if (!parsed || typeof parsed !== "object") return null;

    const lat = Number((parsed as { lat?: unknown }).lat);
    const lng = Number((parsed as { lng?: unknown }).lng);
    const accuracyRaw = (parsed as { accuracy?: unknown }).accuracy;
    const capturedAt = String((parsed as { capturedAt?: unknown }).capturedAt ?? "");

    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !capturedAt.trim()) {
      return null;
    }

    return {
      lat,
      lng,
      accuracy:
        typeof accuracyRaw === "number" && Number.isFinite(accuracyRaw) ? accuracyRaw : null,
      capturedAt,
    };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("user_profile")
    .select("user_id, role")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!profile?.user_id || !isAllowedAppRole(profile.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const formData = await request.formData();
  const recordId = Number(formData.get("recordId"));
  if (!Number.isFinite(recordId)) {
    return NextResponse.json({ error: "ID de registro invalido" }, { status: 400 });
  }

  const { data: recordRow } = await supabase
    .from("check_record")
    .select("record_id, user_id")
    .eq("record_id", recordId)
    .maybeSingle();

  if (!recordRow) {
    return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 });
  }

  if (profile.role !== "admin" && recordRow.user_id !== profile.user_id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Archivo invalido" }, { status: 400 });
  }

  if (!ALLOWED_EVIDENCE_MIME_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Tipo de archivo invalido" }, { status: 400 });
  }

  if (file.size > MAX_EVIDENCE_FILE_BYTES) {
    return NextResponse.json({ error: "El archivo excede el limite de 8MB" }, { status: 413 });
  }

  const geoInfo = parseGeoInfo(String(formData.get("geoJson") ?? "{}"));
  const extension = getFileExtension(file);
  const objectPath = `${user.id}/${recordId}/${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(EVIDENCE_BUCKET)
    .upload(objectPath, file, {
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) {
    return NextResponse.json({ error: "Error al subir a storage" }, { status: 500 });
  }

  const { error: insertError } = await supabase.from("evidence").insert({
    record_id: recordId,
    url: objectPath,
    geo_info: geoInfo ? JSON.stringify(geoInfo) : null,
  });

  if (insertError) {
    await supabase.storage.from(EVIDENCE_BUCKET).remove([objectPath]);
    return NextResponse.json({ error: "Error guardando referencia" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
