export const DUPLICATE_REGISTRO_ERROR =
  "Ya existe un registro para este producto en este establecimiento durante el lapso activo. Puedes editar el registro existente.";

export function isDuplicateCheckRecordInsertError(error) {
  if (!error || typeof error !== "object") return false;

  const maybeError = /** @type {{ code?: unknown; message?: unknown }} */ (error);
  const code = typeof maybeError.code === "string" ? maybeError.code : "";
  const message = typeof maybeError.message === "string" ? maybeError.message.trim() : "";

  return code === "23505" && message === DUPLICATE_REGISTRO_ERROR;
}
