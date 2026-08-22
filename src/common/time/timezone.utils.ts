function getTimeZoneOffsetMinutes(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'shortOffset',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).formatToParts(date);

  const token = parts.find((part) => part.type === 'timeZoneName')?.value ?? 'GMT';
  if (token === 'GMT' || token === 'UTC') {
    return 0;
  }

  const match = token.match(/^GMT([+-])(\d{1,2})(?::?(\d{2}))?$/);
  if (!match) {
    return 0;
  }

  const sign = match[1] === '+' ? 1 : -1;
  const hours = Number(match[2] ?? 0);
  const minutes = Number(match[3] ?? 0);
  return sign * (hours * 60 + minutes);
}

function getTimeZoneParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date);

  const map = new Map(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(map.get('year') ?? 1970),
    month: Number(map.get('month') ?? 1),
    day: Number(map.get('day') ?? 1),
    hour: Number(map.get('hour') ?? 0),
    minute: Number(map.get('minute') ?? 0),
    second: Number(map.get('second') ?? 0)
  };
}

function formatOffset(minutes: number) {
  const sign = minutes >= 0 ? '+' : '-';
  const absolute = Math.abs(minutes);
  const hours = String(Math.floor(absolute / 60)).padStart(2, '0');
  const mins = String(absolute % 60).padStart(2, '0');
  return `${sign}${hours}:${mins}`;
}

export function addDaysInDateString(value: string, days: number) {
  const date = new Date(`${value}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function getTimeZoneDateString(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

export function getTimeZoneTimeString(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(date);
}

export function getTimeZoneDayBounds(value: Date, timeZone: string) {
  const dateString = getTimeZoneDateString(value, timeZone);
  const start = parseTimeZoneDateTime(`${dateString}T00:00:00`, timeZone);
  const end = parseTimeZoneDateTime(`${addDaysInDateString(dateString, 1)}T00:00:00`, timeZone);
  return { dateString, start, end };
}

export function parseTimeZoneDateTime(value: string, timeZone: string) {
  const [datePart, timePart] = value.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes, seconds = 0] = timePart.split(':').map(Number);
  const utcGuess = Date.UTC(year, month - 1, day, hours, minutes, seconds);
  const firstOffset = getTimeZoneOffsetMinutes(new Date(utcGuess), timeZone);
  let adjusted = utcGuess - firstOffset * 60_000;
  const secondOffset = getTimeZoneOffsetMinutes(new Date(adjusted), timeZone);
  if (secondOffset !== firstOffset) {
    adjusted = utcGuess - secondOffset * 60_000;
  }
  return new Date(adjusted);
}

export function formatTimeZoneDateTime(value: Date, timeZone: string) {
  const parts = getTimeZoneParts(value, timeZone);
  const offsetMinutes = getTimeZoneOffsetMinutes(value, timeZone);
  return `${String(parts.year).padStart(4, '0')}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}T${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}:${String(parts.second).padStart(2, '0')}${formatOffset(offsetMinutes)}`;
}

export function addMinutesToTimeZoneDate(value: Date, minutes: number) {
  return new Date(value.getTime() + minutes * 60_000);
}
