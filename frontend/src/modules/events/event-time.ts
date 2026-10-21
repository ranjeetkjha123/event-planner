export function localDateTimeToIso(date: string, time: string, timeZone: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) throw new RangeError("Enter a valid local date and time.");
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  if (month! < 1 || month! > 12 || hour! > 23 || minute! > 59 || new Date(Date.UTC(year!, month! - 1, day!)).toISOString().slice(0, 10) !== date) throw new RangeError("Enter a valid local date and time.");
  const desired = Date.UTC(year!, month! - 1, day!, hour!, minute!);
  let candidate = desired;
  const format = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  for (let i = 0; i < 3; i += 1) {
    const values = Object.fromEntries(format.formatToParts(new Date(candidate)).map((part) => [part.type, part.value]));
    const represented = Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day), Number(values.hour), Number(values.minute));
    candidate += desired - represented;
  }
  const resolved = new Date(candidate);
  const resolvedParts = Object.fromEntries(format.formatToParts(resolved).map((part) => [part.type, part.value]));
  if (`${resolvedParts.year}-${resolvedParts.month}-${resolvedParts.day}` !== date || `${resolvedParts.hour}:${resolvedParts.minute}` !== time) throw new RangeError("That local time does not exist in the selected time zone.");
  return resolved.toISOString();
}
