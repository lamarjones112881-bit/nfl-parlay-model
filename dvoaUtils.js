// ── DVOA Utilities ──────────────────────────────────────────────────────────
function normalizeDVOA(dvoa, invert = false) {
  const clamped = Math.max(-50, Math.min(50, dvoa || 0));
  const norm    = (clamped + 50) / 100;
  return invert ? 1 - norm : norm;
}

// ── Spread impact from DVOA differential ──────────────────────────────────
// Research: each 10% DVOA differential ≈ 2 pts of spread
function dvoaToSpreadAdj(homeOffDVOA, homeDefDVOA, awayOffDVOA, awayDefDVOA) {
  // Net offensive efficiency: home off vs away def, away off vs home def
  const homeOff = (homeOffDVOA || 0) - (awayDefDVOA || 0); // positive = home advantage
  const awayOff = (awayOffDVOA || 0) - (homeDefDVOA || 0); // positive = away advantage
  const net     = (homeOff - awayOff) / 10 * 2; // per 10% DVOA = 2pts
  return parseFloat(Math.min(6, Math.max(-6, net)).toFixed(1));
}

// ── DVOA grade label ──────────────────────────────────────────────────────
function dvoaGrade(dvoa, isDefense = false) {
  const v = isDefense ? -dvoa : dvoa; // invert for defense
  if (v >= 20)  return { label: "Elite",      color: "#4ade80" };
  if (v >= 10)  return { label: "Above Avg",  color: "#86efac" };
  if (v >= -5)  return { label: "Average",    color: "#f59e0b" };
  if (v >= -15) return { label: "Below Avg",  color: "#f87171" };
  return         { label: "Poor",       color: "#ef4444" };
}

// ═══════════════════════════════════════════════════════════════════════════
// DVOA PANEL
// ═══════════════════════════════════════════════════════════════════════════
function DVOAPanel({ dvoaData, loading, homeTeam, awayTeam }) {
  const [open, setOpen] = useState(false);

export { normalizeDVOA, dvoaToSpreadAdj, dvoaGrade };
