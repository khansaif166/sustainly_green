/**
 * Picks the first title that fits Google's ~60-character display width.
 * Pass candidates from most to least complete, e.g.
 * ["Post title | Sustainly Green", "Post title"]. When none fit, the last
 * (shortest) one is cut at a word boundary — never mid-word, and never
 * leaving a dangling "|" or "-" before the ellipsis.
 */
export function fitTitle(candidates: string[], maxLength = 60): string {
  const options = candidates.map((value) => value.trim()).filter(Boolean);
  const fitting = options.find((value) => value.length <= maxLength);
  if (fitting) return fitting;

  const last = options[options.length - 1] || "";
  const cut = last.slice(0, maxLength - 1);
  const wordEnd = cut.lastIndexOf(" ");
  const base = wordEnd > maxLength / 2 ? cut.slice(0, wordEnd) : cut;
  return `${base.replace(/[\s|:,;–—-]+$/, "")}…`;
}
