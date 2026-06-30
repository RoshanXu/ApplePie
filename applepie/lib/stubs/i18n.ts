/**
 * Stub — ApplePie is zh-CN only, so only zh-CN is valid.
 * infiplot's orchestrator calls this to validate session language.
 */
export function isValidLocale(locale: string): boolean {
  return locale === "zh-CN";
}
