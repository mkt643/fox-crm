// Escolhe preto ou branco para texto, de acordo com a luminância da cor de
// fundo — evita texto ilegível quando o cliente escolhe uma cor clara.
export function getContrastColor(hex: string | null | undefined): string {
  if (!hex || !/^#([0-9a-fA-F]{6})$/.test(hex)) return "#ffffff";

  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.6 ? "#171717" : "#ffffff";
}
