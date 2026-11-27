export const BUSINESS_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
export type BusinessDay = (typeof BUSINESS_DAYS)[number];
export type DayHours = { status: "unset" | "open" | "closed" | "all-day"; opens: string; closes: string };
export type WeeklyHours = Record<BusinessDay, DayHours>;
export type Time12Parts = { hour: string; minute: string; period: "AM" | "PM" };

export function time12Parts(value: string): Time12Parts {
  const match = value.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!match) return { hour: "", minute: "", period: "AM" };
  const hour = Number(match[1]);
  return { hour: String(hour % 12 || 12), minute: match[2], period: hour < 12 ? "AM" : "PM" };
}

export function timeFrom12Parts({ hour, minute, period }: Time12Parts): string {
  return parseTime(`${hour}:${minute} ${period}`) || "";
}

export function emptyWeeklyHours(): WeeklyHours {
  return Object.fromEntries(BUSINESS_DAYS.map(day => [day, { status: "unset", opens: "", closes: "" }])) as WeeklyHours;
}

function parseTime(value: string): string | null {
  const match = value.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2] || 0);
  if (minute > 59 || (match[3] ? hour < 1 || hour > 12 : hour > 23)) return null;
  if (match[3]) hour = hour % 12 + (match[3].toUpperCase() === "PM" ? 12 : 0);
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function formatTime(value: string): string {
  if (!value) return "";
  const [hour, minute] = value.split(":").map(Number);
  return `${String(hour % 12 || 12).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${hour < 12 ? "AM" : "PM"}`;
}

// Format saved hours without changing day labels, custom notes, or split shifts.
export function formatBusinessHoursForDisplay(value: string): string {
  return value.replace(/\b([1-9]):([0-5]\d)(?=\s*[AP]M\b)/gi, "0$1:$2");
}

export function parseBusinessHours(value: string): WeeklyHours | null {
  const hours = emptyWeeklyHours();
  const assigned = new Set<BusinessDay>();
  const dayFor = (name: string) => BUSINESS_DAYS.find(day => day.toLowerCase() === name.toLowerCase() || day.slice(0, 3).toLowerCase() === name.toLowerCase());
  for (const line of value.split(/\r?\n/).map(line => line.trim()).filter(Boolean)) {
    const match = line.match(/^([a-z]+)(?:\s*[-–—]\s*([a-z]+))?\s*[:,]\s*(.+)$/i);
    if (!match) return null;
    const first = dayFor(match[1]);
    const last = match[2] ? dayFor(match[2]) : first;
    if (!first || !last) return null;
    const from = BUSINESS_DAYS.indexOf(first);
    const to = BUSINESS_DAYS.indexOf(last);
    if (from > to) return null;
    let entry: DayHours;
    if (/^closed$/i.test(match[3])) entry = { status: "closed", opens: "", closes: "" };
    else if (/^(?:open\s*)?24\s*(?:hours?|hrs?)$/i.test(match[3])) entry = { status: "all-day", opens: "", closes: "" };
    else {
      const range = match[3].split(/\s*[-–—]\s*|\s+to\s+/i);
      if (range.length !== 2) return null;
      const opens = parseTime(range[0]);
      const closes = parseTime(range[1]);
      if (!opens || !closes) return null;
      entry = { status: "open", opens, closes };
    }
    for (const day of BUSINESS_DAYS.slice(from, to + 1)) {
      if (assigned.has(day)) return null;
      assigned.add(day);
      hours[day] = { ...entry };
    }
  }
  return hours;
}

// An incomplete time remains in the form draft; required time inputs prevent
// saving until it is complete. Storage stays compatible with custom text.
export function serializeBusinessHours(hours: WeeklyHours): string {
  return BUSINESS_DAYS.flatMap(day => {
    const entry = hours[day];
    if (entry.status === "unset") return [];
    const value = entry.status === "closed" ? "Closed" : entry.status === "all-day" ? "Open 24 hours"
      : `${formatTime(entry.opens)}–${formatTime(entry.closes)}`;
    return [`${day}: ${value}`];
  }).join("\n");
}
