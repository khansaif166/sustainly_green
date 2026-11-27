"use client";

import { useId, useState } from "react";
import { Clock3, Copy } from "lucide-react";
import { BUSINESS_DAYS, emptyWeeklyHours, parseBusinessHours, serializeBusinessHours, time12Parts, timeFrom12Parts, type BusinessDay, type DayHours, type Time12Parts } from "@/lib/businessHours";
import styles from "./editor.module.css";

function Time12Field({ day, label, value, onChange }: {
  day: BusinessDay; label: "Opening" | "Closing"; value: string; onChange: (value: string) => void;
}) {
  const parts = time12Parts(value);
  const update = (changes: Partial<Time12Parts>) => onChange(timeFrom12Parts({ ...parts, ...changes }));
  return <div className={styles.hoursTimeField} role="group" aria-label={`${day} ${label.toLowerCase()} time`}>
    <div className={styles.hoursTimeParts}>
      <select required aria-label={`${day} ${label.toLowerCase()} hour`} value={parts.hour}
        onChange={event => update({ hour: event.target.value })}>
        <option value="" disabled>HH</option>
        {Array.from({ length: 12 }, (_, index) => String(index + 1)).map(hour => <option key={hour} value={hour}>{hour.padStart(2, "0")}</option>)}
      </select>
      <span aria-hidden="true">:</span>
      <select required aria-label={`${day} ${label.toLowerCase()} minute`} value={parts.minute}
        onChange={event => update({ minute: event.target.value })}>
        <option value="" disabled>MM</option>
        {Array.from({ length: 60 }, (_, index) => String(index).padStart(2, "0")).map(minute => <option key={minute} value={minute}>{minute}</option>)}
      </select>
      <select required aria-label={`${day} ${label.toLowerCase()} AM or PM`} value={parts.period}
        onChange={event => update({ period: event.target.value as Time12Parts["period"] })}>
        <option value="AM">AM</option><option value="PM">PM</option>
      </select>
    </div>
  </div>;
}

export default function BusinessHoursField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const id = useId();
  const [mode, setMode] = useState<"weekly" | "custom">(() => parseBusinessHours(value) ? "weekly" : "custom");
  const [week, setWeek] = useState(() => parseBusinessHours(value) || emptyWeeklyHours());
  const [notice, setNotice] = useState("");
  const [lastValue, setLastValue] = useState(value);
  const parsed = parseBusinessHours(value);

  if (value !== lastValue) {
    setLastValue(value);
    setWeek(parsed || emptyWeeklyHours());
    setMode(parsed ? "weekly" : "custom");
    setNotice("");
  }

  function emit(next: string) {
    setLastValue(next);
    onChange(next);
  }

  function update(day: BusinessDay, changes: Partial<DayHours>) {
    const next = { ...week, [day]: { ...week[day], ...changes } };
    setWeek(next);
    setNotice("");
    emit(serializeBusinessHours(next));
  }

  return <section className={styles.companySection} aria-labelledby={`${id}-title`}>
    <div className={styles.companySectionHeader}>
      <div>
        <h4 id={`${id}-title`}><Clock3 size={17} aria-hidden="true" />Business hours</h4>
        <p id={`${id}-help`}>Choose opening and closing times using the 12-hour clock and AM/PM, in the business’s local time. Unset days won’t be published.</p>
      </div>
      {(mode === "weekly" || parsed) && <button type="button" className={styles.hoursMode} onClick={() => {
        if (mode === "weekly") setMode("custom");
        else if (parsed) { setWeek(parsed); setMode("weekly"); }
      }}>{mode === "weekly" ? "Use custom text" : "Use weekly schedule"}</button>}
    </div>
    {mode === "custom" ? <div className={styles.stack}>
      <label htmlFor={`${id}-custom`}>Business hours
        <textarea id={`${id}-custom`} rows={4} maxLength={6000} value={value} aria-describedby={`${id}-help ${id}-custom-help`}
          placeholder={"Monday–Friday: 9:00 AM–6:00 PM\nSaturday: 9:00 AM–1:00 PM\nSunday: Closed"}
          onChange={event => emit(event.target.value)} />
      </label>
      <p id={`${id}-custom-help`} className={styles.companyHelp}>Use one day or day range per line. Custom notes and split shifts can be entered here.</p>
    </div> : <>
      <div className={styles.hoursToolbar}>
        <button type="button" className={styles.small} disabled={week.Monday.status === "unset" ||
          (week.Monday.status === "open" && (!week.Monday.opens || !week.Monday.closes))}
          onClick={() => {
            const next = { ...week };
            for (const day of BUSINESS_DAYS.slice(1, 5)) next[day] = { ...week.Monday };
            setWeek(next);
            emit(serializeBusinessHours(next));
            setNotice("Monday’s hours copied to Tuesday–Friday. Weekend hours are unchanged.");
          }}><Copy size={15} aria-hidden="true" />Copy Monday to weekdays</button>
        <span className={styles.companyHelp}>Saturday and Sunday are set separately.</span>
      </div>
      <div className={styles.hoursSchedule} aria-describedby={`${id}-help`}>
        {BUSINESS_DAYS.map(day => <div key={day} className={styles.hoursDay}>
          <span className={styles.hoursDayName}>{day}</span>
          <select aria-label={`${day} availability`} value={week[day].status} onChange={event => {
            const status = event.target.value as DayHours["status"];
            update(day, { status, ...(status === "open" ? { opens: week[day].opens || "09:00", closes: week[day].closes || "18:00" } : {}) });
          }}>
            <option value="unset">Not set</option><option value="open">Open</option><option value="closed">Closed</option><option value="all-day">24 hours</option>
          </select>
          {week[day].status === "open" ? <div className={styles.hoursTimes}>
            <Time12Field day={day} label="Opening" value={week[day].opens} onChange={opens => update(day, { opens })} />
            <span aria-hidden="true">to</span>
            <Time12Field day={day} label="Closing" value={week[day].closes} onChange={closes => update(day, { closes })} />
          </div> : <span className={styles.hoursDayNote}>{week[day].status === "closed" ? "Closed all day" : week[day].status === "all-day" ? "Open all day" : "Not shown on your profile"}</span>}
        </div>)}
      </div>
    </>}
    <p className={styles.hoursNotice} role="status">{notice}</p>
  </section>;
}
