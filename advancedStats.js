// ── Advanced Stats Utilities ────────────────────────────────────────────────
function calcAdvancedTotalAdj(homeAdv, awayAdv) {
  if (!homeAdv || !awayAdv) return { total: 0, rz: 0, thirdDown: 0, pace: 0 };

  // 1. Red Zone — TD% vs FG% impact on expected points per trip
  //    Each 10% RZ TD% difference ≈ 0.6 pts/game vs league average (63%)
  const homeRZOff = ((homeAdv.rzTdPct || 63) - 63) / 10 * 0.6;
  const awayRZOff = ((awayAdv.rzTdPct || 63) - 63) / 10 * 0.6;
  const homeRZDef = ((homeAdv.rzAllowedPct || 63) - 63) / 10 * 0.6;
  const awayRZDef = ((awayAdv.rzAllowedPct || 63) - 63) / 10 * 0.6;
  const rzAdj     = parseFloat(((homeRZOff - homeRZDef) + (awayRZOff - awayRZDef)).toFixed(1));

  // 2. Third Down — high conversion = more drives sustained = more points
  //    Each 5% above league avg (39%) ≈ 1.2 pts/game
  const h3Off = ((homeAdv.thirdDownPct || 39) - 39) / 5 * 1.2;
  const a3Off = ((awayAdv.thirdDownPct || 39) - 39) / 5 * 1.2;
  const h3Def = ((homeAdv.thirdDownAllowed || 39) - 39) / 5 * 1.2;
  const a3Def = ((awayAdv.thirdDownAllowed || 39) - 39) / 5 * 1.2;
  const thirdAdj = parseFloat(((h3Off - h3Def) + (a3Off - a3Def)).toFixed(1));

  // 3. Pace — plays per game. League avg ≈ 64. Each play ≈ 0.14 pts
  //    Combined pace: both teams' offensive pace averages
  const homePace   = homeAdv.playsPerGame || 64;
  const awayPace   = awayAdv.playsPerGame || 64;
  const combinedPace = (homePace + awayPace) / 2;
  const paceAdj    = parseFloat(((combinedPace - 64) * 0.14 * 2).toFixed(1));

  const total = parseFloat((rzAdj + thirdAdj + paceAdj).toFixed(1));
  return { total, rz: rzAdj, thirdDown: thirdAdj, pace: paceAdj };
}

// ── Turnover luck assessment ──────────────────────────────────────────────
function calcTurnoverLuck(homeAdv, awayAdv) {
  if (!homeAdv || !awayAdv) return null;
  // Fumble recovery rates regress to 50% over time
  // Expected TO margin ≈ forced fumbles + interceptions thrown
  const homeExpected = (homeAdv.forcedFumbles || 0) + (homeAdv.interceptions || 0);
  const awayExpected = (awayAdv.forcedFumbles || 0) + (awayAdv.interceptions || 0);
  const homeActual   = homeAdv.turnoverDiff || 0;
  const awayActual   = awayAdv.turnoverDiff || 0;
  // Luck = actual - expected. Positive luck regresses back
  const homeLuck = parseFloat((homeActual - homeExpected * 0.5).toFixed(1));
  const awayLuck = parseFloat((awayActual - awayExpected * 0.5).toFixed(1));
  const luckDiff = homeLuck - awayLuck;
  return {
    homeLuck, awayLuck, luckDiff,
    homeRegression: homeLuck > 2 ? "overperforming — expect regression" : homeLuck < -2 ? "underperforming — due for positive swing" : "neutral",
    awayRegression: awayLuck > 2 ? "overperforming — expect regression" : awayLuck < -2 ? "underperforming — due for positive swing" : "neutral",
  };
}

// ── EPA grade ─────────────────────────────────────────────────────────────
function epaGrade(epa) {
  if (epa >= 0.20) return { label: "Elite",      color: "#4ade80" };
  if (epa >= 0.10) return { label: "Above Avg",  color: "#86efac" };
  if (epa >= 0.00) return { label: "Average",    color: "#f59e0b" };
  if (epa >= -0.10)return { label: "Below Avg",  color: "#f87171" };
  return              { label: "Poor",       color: "#ef4444" };
}

// ═══════════════════════════════════════════════════════════════════════════
// ADVANCED STATS PANEL
// ═══════════════════════════════════════════════════════════════════════════
function AdvancedStatsPanel({ advancedData, advancedStatus, homeTeam, awayTeam, lines }) {

export { calcAdvancedTotalAdj, calcTurnoverLuck, epaGrade };
