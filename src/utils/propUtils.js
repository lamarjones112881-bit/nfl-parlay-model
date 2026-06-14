// ── Player Prop Utilities ───────────────────────────────────────────────────
function derivePlayerProjections({ gameResult, lines, weather, pressureData,
  olData, cpoeData, garbageData, homeTeam, awayTeam }) {

  if (!gameResult) return null;

  const homeWin   = gameResult.homeWin  || 50;
  const awayWin   = gameResult.awayWin  || 50;
  const total     = parseFloat(gameResult.total || lines?.total || 44);
  const spread    = parseFloat(lines?.spread || 3);
  const isBlowout = spread >= 9;
  const isClose   = spread <= 3;

  // Weather modifiers
  const w = weatherAdjust(weather);
  const passYdsMod  = total > 0 ? (total / 44) : 1;   // normalise to league avg
  const badWeather  = weather === "wind" || weather === "rain";
  const wPassAdj    = badWeather ? 0.88 : weather === "cold" ? 0.93 : 1.0;

  // Pressure modifier: high pressure allowed → fewer pass yards
  const homePressureAllowed = pressureData?.home?.pressureAllowed || 28;
  const awayPressureAllowed = pressureData?.away?.pressureAllowed || 28;
  const homePressAdj = homePressureAllowed > 35 ? 0.90 : homePressureAllowed > 31 ? 0.95 : 1.0;
  const awayPressAdj = awayPressureAllowed > 35 ? 0.90 : awayPressureAllowed > 31 ? 0.95 : 1.0;

  // OL modifier: degraded OL → fewer rush yards for that team
  const homeOLHealth = olData?.home?.healthScore || 80;
  const awayOLHealth = olData?.away?.healthScore || 80;
  const homeRushAdj  = homeOLHealth >= 75 ? 1.0 : homeOLHealth >= 55 ? 0.88 : 0.78;
  const awayRushAdj  = awayOLHealth >= 75 ? 1.0 : awayOLHealth >= 55 ? 0.88 : 0.78;

  // CPOE modifier: elite CPOE QB → more passing yards + more to receivers
  const homeCPOE = cpoeData?.home?.cpoe || 0;
  const awayCPOE = cpoeData?.away?.cpoe || 0;
  const homeCPOEAdj = 1 + (homeCPOE / 100);  // +5 CPOE → +5% pass yards
  const awayCPOEAdj = 1 + (awayCPOE / 100);

  // Game script: blowout → winning RB gets extra carries, losing QB throws more
  const homeGameScript = homeWin >= 65 ? "winning"  : homeWin <= 35 ? "losing"  : "neutral";
  const awayGameScript = awayWin >= 65 ? "winning"  : awayWin <= 35 ? "losing"  : "neutral";
  const homeRBScriptAdj = homeGameScript === "winning" ? 1.12 : homeGameScript === "losing" ? 0.82 : 1.0;
  const awayRBScriptAdj = awayGameScript === "winning" ? 1.12 : awayGameScript === "losing" ? 0.82 : 1.0;
  const homeQBScriptAdj = homeGameScript === "losing"  ? 1.10 : homeGameScript === "winning" && isBlowout ? 0.85 : 1.0;
  const awayQBScriptAdj = awayGameScript === "losing"  ? 1.10 : awayGameScript === "winning" && isBlowout ? 0.85 : 1.0;

  // League baseline stats (2024-25 season averages)
  const BASE = {
    QB_PASS_YDS:  240, QB_PASS_TDS: 1.6,  QB_COMPS:   22,
    QB_INTS:      0.8, QB_RUSH_YDS: 18,
    RB1_RUSH_YDS: 72,  RB1_RUSH_TDS: 0.55, RB1_REC_YDS: 28, RB1_RECS: 3.2,
    WR1_REC_YDS:  72,  WR1_RECS: 5.2,  WR1_TDS: 0.45,
    WR2_REC_YDS:  48,  WR2_RECS: 3.8,
    TE1_REC_YDS:  42,  TE1_RECS: 3.5,
  };

  function proj(base, ...mods) {
    return Math.round(mods.reduce((v, m) => v * m, base) * 10) / 10;
  }

  return {
    home: {
      team: homeTeam,
      QB_PASS_YDS: proj(BASE.QB_PASS_YDS, passYdsMod, wPassAdj, homePressAdj, homeCPOEAdj, homeQBScriptAdj),
      QB_PASS_TDS: proj(BASE.QB_PASS_TDS, passYdsMod, wPassAdj, homeCPOEAdj),
      QB_COMPS:    proj(BASE.QB_COMPS,    passYdsMod, wPassAdj, homePressAdj, homeCPOEAdj),
      QB_INTS:     proj(BASE.QB_INTS,     homeCPOE < -3 ? 1.2 : homeCPOE > 4 ? 0.8 : 1.0),
      QB_RUSH_YDS: proj(BASE.QB_RUSH_YDS, 1.0),
      RB1_RUSH_YDS:proj(BASE.RB1_RUSH_YDS,homeRushAdj, homeRBScriptAdj, badWeather ? 1.08 : 1.0),
      RB1_RUSH_TDS:proj(BASE.RB1_RUSH_TDS,homeRBScriptAdj),
      RB1_REC_YDS: proj(BASE.RB1_REC_YDS, passYdsMod, wPassAdj),
      RB1_RECS:    proj(BASE.RB1_RECS,    passYdsMod, wPassAdj),
      WR1_REC_YDS: proj(BASE.WR1_REC_YDS, passYdsMod, wPassAdj, homeCPOEAdj),
      WR1_RECS:    proj(BASE.WR1_RECS,    passYdsMod, wPassAdj),
      WR1_TDS:     proj(BASE.WR1_TDS,     passYdsMod),
      WR2_REC_YDS: proj(BASE.WR2_REC_YDS, passYdsMod, wPassAdj),
      TE1_REC_YDS: proj(BASE.TE1_REC_YDS, passYdsMod, wPassAdj),
      TE1_RECS:    proj(BASE.TE1_RECS,    passYdsMod, wPassAdj),
      gameScript:  homeGameScript,
      pressAdj:    homePressAdj,
      olAdj:       homeRushAdj,
      cpoeAdj:     homeCPOEAdj,
    },
    away: {
      team: awayTeam,
      QB_PASS_YDS: proj(BASE.QB_PASS_YDS, passYdsMod, wPassAdj, awayPressAdj, awayCPOEAdj, awayQBScriptAdj),
      QB_PASS_TDS: proj(BASE.QB_PASS_TDS, passYdsMod, wPassAdj, awayCPOEAdj),
      QB_COMPS:    proj(BASE.QB_COMPS,    passYdsMod, wPassAdj, awayPressAdj, awayCPOEAdj),
      QB_INTS:     proj(BASE.QB_INTS,     awayCPOE < -3 ? 1.2 : awayCPOE > 4 ? 0.8 : 1.0),
      QB_RUSH_YDS: proj(BASE.QB_RUSH_YDS, 1.0),
      RB1_RUSH_YDS:proj(BASE.RB1_RUSH_YDS,awayRushAdj, awayRBScriptAdj, badWeather ? 1.08 : 1.0),
      RB1_RUSH_TDS:proj(BASE.RB1_RUSH_TDS,awayRBScriptAdj),
      RB1_REC_YDS: proj(BASE.RB1_REC_YDS, passYdsMod, wPassAdj),
      RB1_RECS:    proj(BASE.RB1_RECS,    passYdsMod, wPassAdj),
      WR1_REC_YDS: proj(BASE.WR1_REC_YDS, passYdsMod, wPassAdj, awayCPOEAdj),
      WR1_RECS:    proj(BASE.WR1_RECS,    passYdsMod, wPassAdj),
      WR1_TDS:     proj(BASE.WR1_TDS,     passYdsMod),
      WR2_REC_YDS: proj(BASE.WR2_REC_YDS, passYdsMod, wPassAdj),
      TE1_REC_YDS: proj(BASE.TE1_REC_YDS, passYdsMod, wPassAdj),
      TE1_RECS:    proj(BASE.TE1_RECS,    passYdsMod, wPassAdj),
      gameScript:  awayGameScript,
      pressAdj:    awayPressAdj,
      olAdj:       awayRushAdj,
      cpoeAdj:     awayCPOEAdj,
    },
    modifiers: { passYdsMod, wPassAdj, badWeather, isBlowout, isClose, total, spread }
  };
}

// ── Prop edge calculator ──────────────────────────────────────────────────
function calcPropEdge(modelProjection, bookLine) {
  if (!modelProjection || !bookLine) return null;
  const edge = ((modelProjection - bookLine) / bookLine) * 100;
  return {
    edge:      parseFloat(edge.toFixed(1)),
    lean:      edge >= 3 ? "OVER" : edge <= -3 ? "UNDER" : "PUSH",
    strength:  Math.abs(edge) >= 12 ? "STRONG" : Math.abs(edge) >= 6 ? "MODERATE" : "SLIGHT",
    hasEdge:   Math.abs(edge) >= 5,
  };
}

// ── Player Prop Modeler Panel ─────────────────────────────────────────────
function PropModelerPanel({ homeTeam, awayTeam, gameResult, lines, weather,

export { derivePlayerProjections, calcPropEdge };
