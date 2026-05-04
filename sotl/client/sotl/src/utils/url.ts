export function isValidHttpUrl(s: string) {
  return /^https?:\/\/\S+/i.test((s || '').trim());
}