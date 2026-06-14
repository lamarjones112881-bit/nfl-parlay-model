// ── Model Ratings ───────────────────────────────────────────────────────────
function computeModelRatings(backtestHistory) {
  if (!backtestHistory?.length) return {};
  const teamStats = {};

  backtestHistory.forEach(g => {
    [
      { team: g.homeTeam, isHome: true,  won: g.spreadCorrect, margin: g.actualMargin,   predictedWin: g.homeWin  },
      { team: g.awayTeam, isHome: false, won: g.spreadCorrect, margin: -(g.actualMargin||0), predictedWin: g.awayWin },
    ].filter(t => t.team).forEach(({ team, won, margin, predictedWin }) => {
      if (!teamStats[team]) teamStats[team] = { atsW:0, atsL:0, margins:[], predictedWins:[], results:[] };
      const d = teamStats[team];
      if (won) d.atsW++; else d.atsL++;
      if (margin != null) d.margins.push(margin);
      if (predictedWin != null) d.predictedWins.push(predictedWin);
      d.results.push({ won, margin, date: g.date });
    });
  });

  const ratings = {};
  Object.entries(teamStats).forEach(([team, d]) => {
    const total    = d.atsW + d.atsL;
    const atsPct   = total > 0 ? d.atsW / total : 0.5;
    const avgMargin= d.margins.length ? d.margins.reduce((s,v)=>s+v,0)/d.margins.length : 0;
    const avgPredWin=d.predictedWins.length ? d.predictedWins.reduce((s,v)=>s+v,0)/d.predictedWins.length : 50;
    // Recent form: last 3 games
    const recent   = d.results.slice(-3);
    const recentATS= recent.length ? recent.filter(r=>r.won).length/recent.length : 0.5;
    // Composite: 40% ATS, 30% margin, 20% predicted win%, 10% recent form
    const composite = (atsPct*40) + (Math.min(Math.max(avgMargin/14+0.5,0),1)*30) + ((avgPredWin/100)*20) + (recentATS*10);
    ratings[team] = {
      composite: parseFloat(composite.toFixed(1)),
      atsPct:   Math.round(atsPct*100),
      atsW: d.atsW, atsL: d.atsL,
      avgMargin: parseFloat(avgMargin.toFixed(1)),
      avgPredWin: Math.round(avgPredWin),
      recentATS: Math.round(recentATS*100),
      games: total,
      trend: recentATS > atsPct + 0.1 ? "hot" : recentATS < atsPct - 0.1 ? "cold" : "neutral",
    };
  });
  return ratings;
}

// ── Power Rankings Panel ──────────────────────────────────────────────────
function PowerRankingsPanel({ backtestHistory, onLoadMatchup }) {

export { computeModelRatings };
