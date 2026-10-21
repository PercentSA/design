/** The source of one exported example function, from the raw text of its file. */
export function exampleSource(file: string, name: string) {
  const start = file.indexOf(`export function ${name}(`);
  if (start < 0) return "";
  const end = file.indexOf("\nexport function ", start + 1);
  return file.slice(start, end < 0 ? undefined : end).trim();
}
