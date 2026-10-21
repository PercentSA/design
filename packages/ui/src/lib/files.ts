/** Same rules as the input `accept` attribute: ".pdf", "image/*", "application/pdf". */
export function acceptsFile(file: File, accept?: string) {
  if (!accept) return true;
  const name = file.name.toLowerCase();
  return accept.split(",").some((raw) => {
    const t = raw.trim().toLowerCase();
    if (t.startsWith(".")) return name.endsWith(t);
    if (t.endsWith("/*")) return file.type.startsWith(t.slice(0, -1));
    return file.type === t;
  });
}

export function formatFileSize(bytes: number) {
  if (bytes < 1000) return `${bytes} B`;
  if (bytes < 1_000_000) return `${(bytes / 1000).toFixed(0)} KB`;
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}
