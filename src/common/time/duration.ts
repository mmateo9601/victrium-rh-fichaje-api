const durationPattern = /^(?<value>\d+)(?<unit>ms|s|m|h|d|w)$/i;

export function parseDurationToMilliseconds(duration: string) {
  const match = durationPattern.exec(duration.trim());
  if (!match?.groups) {
    throw new Error(`Invalid duration format: ${duration}`);
  }

  const value = Number(match.groups.value);
  const unit = match.groups.unit.toLowerCase();

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Invalid duration value: ${duration}`);
  }

  const multipliers: Record<string, number> = {
    ms: 1,
    s: 1_000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
    w: 604_800_000
  };

  const multiplier = multipliers[unit];
  if (!multiplier) {
    throw new Error(`Invalid duration unit: ${duration}`);
  }

  return value * multiplier;
}
