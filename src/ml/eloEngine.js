// ── Elo Rating Engine ───────────────────────────────────────────────────────
// ── Elo rating engine ─────────────────────────────────────────────────────
// Standard Elo with NFL-calibrated K-factor and home field adjustment
const ELO_K         = 20;    // K-factor — how fast ratings move
const ELO_HOME_ADJ  = 65;    // home field advantage in Elo points (~3 pts)
const ELO_DEFAULT   = 1500;  // starting rating for all teams
const ELO_MEAN_REG  = 0.33;  // offseason regression toward mean

function expectedEloWin(ratingA, ratingB) {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

function updateElo(winnerRating, loserRating, marginOfVictory) {
  // Margin of victory multiplier (FiveThirtyEight method)
  const movMult = Math.log(Math.abs(marginOfVictory) + 1) *
    (2.2 / ((winnerRating - loserRating) * 0.001 + 2.2));
  const expected = expectedEloWin(winnerRating, loserRating);
  const newWinner = winnerRating + ELO_K * movMult * (1 - expected);
  const newLoser  = loserRating  + ELO_K * movMult * (0 - (1 - expected));
  return {
    newWinner: Math.round(newWinner),
    newLoser:  Math.round(newLoser),
  };
}

function eloToSpreadAdj(homeElo, awayElo) {
  // Each 25 Elo points ≈ 1 point on the spread
  const diff = (homeElo + ELO_HOME_ADJ) - awayElo;
  return parseFloat((diff / 25).toFixed(1));
}

function eloWinProb(homeElo, awayElo) {
  return Math.round(expectedEloWin(homeElo + ELO_HOME_ADJ, awayElo) * 100);
}

function eloGrade(rating) {
  if (rating >= 1650) return { label: "Elite",      color: "#4ade80" };
  if (rating >= 1575) return { label: "Contender",  color: "#86efac" };
  if (rating >= 1500) return { label: "Average",    color: "#f59e0b" };
  if (rating >= 1425) return { label: "Below Avg",  color: "#f87171" };
  return                     { label: "Weak",        color: "#ef4444" };
}

// ── Schedule spot flags ────────────────────────────────────────────────────
const SPOT_FLAGS = {
  SHORT_WEEK:    { label: "Short Week",      icon: "⚠️", color: "#f87171", spreadAdj: -1.5, desc: "Playing on 6 days rest or less (TNF). Historically -1.5 pts ATS vs well-rested opponent." },
  LONG_REST:     { label: "Long Rest",       icon: "✅", color: "#4ade80", spreadAdj: +1.2, desc: "10+ days rest (bye week advantage). Teams coming off bye are 58% ATS historically." },
  ROAD_TRIP:     { label: "Cross-Country",   icon: "✈️", color: "#f59e0b", spreadAdj: -0.8, desc: "East coast team traveling to west coast or vice versa. Circadian rhythm disruption." },
  BACK_TO_BACK:  { label: "Back-to-Back Road",icon:"🚌", color: "#f87171", spreadAdj: -1.0, desc: "Second consecutive road game. Travel fatigue compounds." },
  TRAP_GAME:     { label: "Trap Game",       icon: "🪤", color: "#f59e0b", spreadAdj: -1.2, desc: "Big favorite sandwiched between two marquee matchups. Public overvalues the favorite." },
  DIVISIONAL:    { label: "Divisional",      icon: "⚔️", color: "#a78bfa", spreadAdj: -0.7, desc: "Division games are closer — dogs cover at 54% historically. Familiarity neutralizes talent gap." },
  PRIMETIME:     { label: "Prime Time",      icon: "🌙", color: "#38bdf8", spreadAdj: 0,    desc: "National spotlight. Better teams generally perform, but public favorites get inflated lines." },
  REVENGE:       { label: "Revenge Game",    icon: "🔥", color: "#fb923c", spreadAdj: +0.8, desc: "Team facing opponent that beat them last meeting. Slight motivational edge." },
};

// ─────────────────────────────────────────────────────────────────────────
// ELO RATINGS PANEL
// ─────────────────────────────────────────────────────────────────────────
function EloPowerPanel({ eloRatings, homeTeam, awayTeam, backtestHistory, onUpdateElo }) {

export { expectedEloWin, updateElo, eloToSpreadAdj, eloWinProb, eloGrade };
