// ── Correlation & Divergence Utilities ─────────────────────────────────────
function buildCorrelationMatrix(legs, weather) {
  if (!legs || legs.length < 2) return null;
  const matrix = [];
  for (let i = 0; i < legs.length; i++) {
    for (let j = i + 1; j < legs.length; j++) {
      const a = legs[i], b = legs[j];
      let corr = 0, reason = "";
      const aOutdoor = !STADIUM_CTX[a.homeTeam]?.indoor;
      const bOutdoor = !STADIUM_CTX[b.homeTeam]?.indoor;
      if (aOutdoor && bOutdoor && (weather === "wind" || weather === "rain" || weather === "cold")) {
        if ((a.betType==="Under"||a.betType==="Over") && (b.betType==="Under"||b.betType==="Over")) {
          const sameDir = a.betType === b.betType;
          corr += sameDir ? 0.18 : -0.12;
          reason += sameDir ? "Both outdoor totals in bad weather — positively correlated. " : "Outdoor totals leaning opposite in same weather — negatively correlated. ";
        }
      }
      if (isDivisional(a.homeTeam,a.awayTeam) && isDivisional(b.homeTeam,b.awayTeam) && getDivision(a.homeTeam)===getDivision(b.homeTeam)) {
        corr += 0.08; reason += "Same division games — slight scoring correlation. ";
      }
      const aIsDog = a.homedog || (a.betType==="Moneyline" && a.pick?.includes("+"));
      const bIsDog = b.homedog || (b.betType==="Moneyline" && b.pick?.includes("+"));
      if (aIsDog && bIsDog) { corr -= 0.05; reason += "Both dog picks — slight negative correlation. "; }
      if (STADIUM_CTX[a.homeTeam]?.indoor && STADIUM_CTX[b.homeTeam]?.indoor && a.betType===b.betType && (a.betType==="Over"||a.betType==="Under")) {
        corr += 0.04; reason += "Both dome totals — minimal positive correlation. ";
      }
      if (a.rlm && b.rlm) { corr += 0.09; reason += "Both legs have RLM — sharp money week tends to hit multiple games. "; }
      if (!reason) reason = "Largely independent — minimal cross-leg correlation.";
      matrix.push({ legA:i, legB:j, labelA:`${abb(a.awayTeam)}@${abb(a.homeTeam)} ${a.betType}`, labelB:`${abb(b.awayTeam)}@${abb(b.homeTeam)} ${b.betType}`, correlation:parseFloat(corr.toFixed(3)), direction:corr>0.05?"positive":corr<-0.05?"negative":"neutral", strength:Math.abs(corr)>0.15?"STRONG":Math.abs(corr)>0.08?"MODERATE":"WEAK", reason:reason.trim() });
    }
  }
  const baseProb = legs.reduce((p,l)=>p*(l.winProb||55)/100,1)*100;
  const totalCorr = matrix.reduce((s,m)=>s+m.correlation,0);
  const adjustedProb = Math.max(1,Math.min(99,baseProb*(1+totalCorr)));
  return { matrix, baseProb:baseProb.toFixed(1), adjustedProb:adjustedProb.toFixed(1), totalCorr:totalCorr.toFixed(3) };
}

// ── Model vs Vegas Divergence ─────────────────────────────────────────────────
function calcDivergence(modelSpread, vegasSpread, modelFav, vegasFav) {
  if (!modelSpread || !vegasSpread) return null;
  const mS = parseFloat(modelSpread), vS = parseFloat(vegasSpread);
  if (isNaN(mS) || isNaN(vS)) return null;
  const sameFav = modelFav && vegasFav && (modelFav===vegasFav || abb(modelFav||"")===abb(vegasFav||""));
  const diff = sameFav ? mS - vS : mS + vS;
  const absDiff = Math.abs(diff);
  return { diff:diff.toFixed(1), absDiff, direction:diff>0?"model_heavier_fav":"model_lighter_fav", isSignificant:absDiff>=2.0, isExtreme:absDiff>=3.5, grade:absDiff>=3.5?"EXTREME":absDiff>=2.5?"STRONG":absDiff>=1.5?"MODERATE":"MINOR" };
}
const KEY_NUMBERS     = [3,7,10,14,6,1];

// ── Signal weight defaults (sum = 100) ───────────────────────────────────────
const DEFAULT_WEIGHTS = { cpoe:18, pressure:15, olDegradation:14, garbageFilter:12, luckRegression:11, marketEnsemble:10, coaching:8, microContext:7, weather:5, advanced:5, elo:4, scheduleSpot:4, publicPct:4 };

// ── Session cache ─────────────────────────────────────────────────────────────
const SESSION_CACHE = new Map();
const CACHE_TTL = 30*60*1000;
function cacheKey(h,a,t){return `${h}|${a}|${t}`;}
function cacheGet(h,a,t){const k=cacheKey(h,a,t),e=SESSION_CACHE.get(k);if(!e)return null;if(Date.now()-e.ts>CACHE_TTL){SESSION_CACHE.delete(k);return null;}return e.data;}

export { buildCorrelationMatrix, calcDivergence };
