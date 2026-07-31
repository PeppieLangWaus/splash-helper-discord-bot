const UNITS = [
  { suffix: "b", mult: 1_000_000_000 },
  { suffix: "m", mult: 1_000_000 },
  { suffix: "k", mult: 1_000 },
];

/** Parses "100k", "10m", "1b", "1.5m", or a plain number (with optional commas) into a rounded
 *  GP integer. Returns null for anything invalid, non-positive, or unparseable. */
function parseGpAmount(raw) {
  if (typeof raw !== "string") return null;

  const trimmed = raw.trim().toLowerCase().replace(/,/g, "");
  const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*([kmb])?$/);
  if (!match) return null;

  const [, numStr, suffix] = match;
  const num = Number.parseFloat(numStr);
  if (!Number.isFinite(num) || num <= 0) return null;

  const unit = suffix ? UNITS.find((u) => u.suffix === suffix) : null;
  return Math.round(num * (unit ? unit.mult : 1));
}

/** Formats a GP amount back into the same compact style (10000000 -> "10M"), stripping
 *  trailing zeroes after rounding to 2 decimal places. Amounts under 1000 are left as-is. */
function formatGp(amount) {
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(amount);

  for (const { suffix, mult } of UNITS) {
    if (abs >= mult) {
      const value = Math.round((abs / mult) * 100) / 100;
      return `${sign}${value}${suffix.toUpperCase()}`;
    }
  }
  return `${sign}${abs}`;
}

module.exports = { parseGpAmount, formatGp };
