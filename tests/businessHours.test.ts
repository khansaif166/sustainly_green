import assert from "node:assert/strict";
import test from "node:test";
import { BUSINESS_DAYS, emptyWeeklyHours, formatBusinessHoursForDisplay, parseBusinessHours, serializeBusinessHours, time12Parts, timeFrom12Parts } from "../lib/businessHours";

test("12-hour controls preserve noon, midnight, AM/PM changes and exact minutes", () => {
  for (const time of ["00:00", "00:05", "09:15", "12:00", "12:30", "18:45", "23:59"]) {
    assert.equal(timeFrom12Parts(time12Parts(time)), time);
  }
  assert.deepEqual(time12Parts("00:00"), { hour: "12", minute: "00", period: "AM" });
  assert.deepEqual(time12Parts("12:00"), { hour: "12", minute: "00", period: "PM" });
  assert.equal(timeFrom12Parts({ hour: "9", minute: "10", period: "PM" }), "21:10");
  assert.equal(timeFrom12Parts({ hour: "12", minute: "05", period: "AM" }), "00:05");
  assert.equal(timeFrom12Parts({ hour: "", minute: "00", period: "AM" }), "");
  assert.equal(timeFrom12Parts({ hour: "13", minute: "00", period: "PM" }), "");
});

test("blank schedules do not invent opening times or publish unset days", () => {
  const week = parseBusinessHours("");
  assert.deepEqual(week, emptyWeeklyHours());
  assert.equal(serializeBusinessHours(week!), "");
  assert(BUSINESS_DAYS.every(day => week![day].status === "unset"));
});

test("existing day-by-day schedules keep their hours and unspecified days", () => {
  const value = "Monday: 9:00 AM–6:00 PM\nTuesday: 9:00 AM–1:00 PM\nSunday: Closed";
  const week = parseBusinessHours(value)!;
  assert.deepEqual(week.Monday, { status: "open", opens: "09:00", closes: "18:00" });
  assert.deepEqual(week.Tuesday, { status: "open", opens: "09:00", closes: "13:00" });
  assert.equal(week.Wednesday.status, "unset");
  assert.equal(week.Sunday.status, "closed");
  assert.equal(serializeBusinessHours(week), "Monday: 09:00 AM–06:00 PM\nTuesday: 09:00 AM–01:00 PM\nSunday: Closed");
});

test("weekday ranges, abbreviations, 24-hour times and all-day schedules are supported", () => {
  const week = parseBusinessHours("Mon-Fri: 09:15 to 18:45\nSat: Open 24 hours\nSun: Closed")!;
  for (const day of BUSINESS_DAYS.slice(0, 5)) assert.deepEqual(week[day], { status: "open", opens: "09:15", closes: "18:45" });
  assert.equal(week.Saturday.status, "all-day");
  assert.equal(week.Sunday.status, "closed");
  assert.deepEqual(parseBusinessHours(serializeBusinessHours(week)), week);
  assert.notEqual(week.Monday, week.Tuesday);
});

test("noon, midnight, overnight schedules and minute precision round-trip correctly", () => {
  const week = parseBusinessHours("Monday: 12:00 AM–12:00 PM\nTuesday: 10:10 PM–6:05 AM")!;
  assert.equal(week.Monday.opens, "00:00");
  assert.equal(week.Monday.closes, "12:00");
  assert.equal(week.Tuesday.opens, "22:10");
  assert.equal(week.Tuesday.closes, "06:05");
  assert.deepEqual(parseBusinessHours(serializeBusinessHours(week)), week);
});

test("custom notes, split shifts and malformed schedules stay in the custom editor", () => {
  for (const value of [
    "By appointment only", "Monday: 9:00 AM–12:00 PM, 2:00 PM–6:00 PM",
    "Monday: 9:00 AM–6:00 PM\nEvening visits by appointment", "Monday: 25:00–18:00",
    "Monday: 13:00 AM–6:00 PM", "Monday: 9:60 AM–6:00 PM", "Unknown: Closed",
    "Friday-Monday: Closed", "Monday: Closed\nMonday: Open 24 hours", "Mon-Fri: Closed\nWed: 09:00–18:00",
  ]) assert.equal(parseBusinessHours(value), null, value);
});

test("clearing a time does not silently replace it with a default", () => {
  const week = emptyWeeklyHours();
  week.Monday = { status: "open", opens: "", closes: "18:00" };
  assert.equal(serializeBusinessHours(week), "Monday: –06:00 PM");
  assert.equal(parseBusinessHours(serializeBusinessHours(week)), null);
});

test("public hours pad existing saved times while preserving custom schedules and notes", () => {
  const saved = "Monday: 9:00 AM–6:00 PM\nFriday: 9:00 AM–12:00 PM\nSunday: Closed";
  const formatted = "Monday: 09:00 AM–06:00 PM\nFriday: 09:00 AM–12:00 PM\nSunday: Closed";
  assert.equal(formatBusinessHoursForDisplay(saved), formatted);
  assert.equal(formatBusinessHoursForDisplay(formatted), formatted);
  assert.equal(formatBusinessHoursForDisplay("Monday: 9:15 am–12:00 PM, 2:30 PM–6:05 pm\nBy appointment only"),
    "Monday: 09:15 am–12:00 PM, 02:30 PM–06:05 pm\nBy appointment only");
  assert.equal(formatBusinessHoursForDisplay("Saturday: Open 24 hours\nCall 9:00–18:00 for help"),
    "Saturday: Open 24 hours\nCall 9:00–18:00 for help");
});
