// ── Execution Schedule Utilities ────────────────────────────────────────────
// ── ET timezone utilities ─────────────────────────────────────────────────
function getETNow() {
  const etStr = new Date().toLocaleString("en-US", { timeZone: "America/New_York", hour12: false,
    weekday:"numeric", year:"numeric", month:"numeric", day:"numeric", hour:"numeric", minute:"numeric" });
  // Parse: "N, M/D/YYYY, HH:MM"  — day of week 0=Sun
  const d = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
  return { dow: d.getDay(), hour: d.getHours(), min: d.getMinutes(), date: d };
}

function getWeekKey() {
  // Key = the Sunday of the current NFL week (nearest future Sunday or today if Sunday)
  const et = getETNow();
  const d  = new Date(et.date);
  const daysUntilSunday = (7 - d.getDay()) % 7;
  d.setDate(d.getDate() + daysUntilSunday);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function getPhaseStatus(phase, completedPhases) {
  const et = getETNow();
  const wk = getWeekKey();
  const isCompleted = completedPhases?.[wk]?.[phase.id];

  // Determine if this phase is "due" — past its start time this week
  let isDue = false;
  const phaseDay = phase.day; // 0=Sun, 2=Tue, 4=Thu, 5=Fri
  const curDay   = et.dow;

  // Sunday is both "start of NFL schedule week" and "Phase 4 day"
  // Tue(2) < Thu(4) < Fri(5) < Sun(0) — handle the wrap
  const ordered = [2, 4, 5, 0]; // order within NFL week
  const phaseIdx = ordered.indexOf(phaseDay);
  const curIdx   = ordered.indexOf(curDay);

  if (curIdx === phaseIdx) {
    isDue = et.hour > phase.hour || (et.hour === phase.hour && et.min >= phase.min);
  } else if (curIdx > phaseIdx) {
    isDue = true; // past the phase day
  }
  // For Sunday wrap: if today is Sat or Sun and phase is Sun, handle separately
  if (phaseDay === 0 && curDay === 0) {
    isDue = et.hour > phase.hour || (et.hour === phase.hour && et.min >= phase.min);
  }

  // Countdown to next occurrence
  function minsUntil() {
    const now = new Date();
    const target = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
    const daysAhead = ((phaseDay - target.getDay() + 7) % 7) || (
      (et.hour > phase.hour || (et.hour === phase.hour && et.min >= phase.min)) ? 7 : 0
    );
    target.setDate(target.getDate() + daysAhead);
    target.setHours(phase.hour, phase.min, 0, 0);
    return Math.round((target - now) / 60000);
  }

  const mins = minsUntil();
  const hrs  = Math.floor(mins / 60);
  const d2   = Math.floor(hrs / 24);
  const countdown = d2 > 0 ? `${d2}d ${hrs%24}h` : hrs > 0 ? `${hrs}h ${mins%60}m` : `${mins}m`;

  return { isDue, isCompleted, countdown, isActive: isDue && !isCompleted };
}

// ── Execution Timeline Component ──────────────────────────────────────────
function WeeklyExecutionDashboard({

export { getETNow, getWeekKey, getPhaseStatus };
