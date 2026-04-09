export function buildFileFormData(
  fields: Record<string, string | number | null | undefined>,
  file: File,
  fileField = "dokument",
): FormData {
  const fd = new FormData();
  Object.entries(fields).forEach(([k, v]) => {
    if (v !== undefined && v !== null) fd.append(k, String(v));
  });
  fd.append(fileField, file);
  return fd;
}
