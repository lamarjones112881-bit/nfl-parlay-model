// ── Monte Carlo Simulation ──────────────────────────────────────────────────
function randn() {
  let u=0,v=0;
  while(u===0)u=Math.random();
  while(v===0)v=Math.random();
  return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. MONTE CARLO SIMULATION ENGINE
// Runs 10,000 game simulations and returns full probability distributions.
// Uses the model's win probability + historical NFL score variance.
// ═══════════════════════════════════════════════════════════════════════════
function runMonteCarlo({ homeWinProb=50, vegasSpread=3, modelSpread=3,
                         vegasTotal=44, homeTeam="", weather="dome" }) {
  const isIndoor = STADIUM_CTX[homeTeam]?.indoor || weather==="dome";
  const highAlt   = (STADIUM_CTX[homeTeam]?.altitude||0) > 4000;

  // Calibrated NFL score parameters
  const expectedMargin = (homeWinProb/100 - 0.5) * 16.5;
  const marginSD = isIndoor ? 12.8 : weather==="wind" ? 10.2 : weather==="rain" ? 9.6 : 13.5;
  const totalMean = parseFloat(vegasTotal)||44;
  const totalSD   = isIndoor ? 6.1 : weather==="wind" ? 4.8 : weather==="rain" ? 5.2 : highAlt ? 7.4 : 6.8;
  const cover_line = parseFloat(modelSpread||vegasSpread)||0;

  let coverCount=0, overCount=0, pushCount=0, blowoutCount=0, oneScoreCount=0;
  const margins=[], totals=[];
  const buckets={};

  for(let i=0; i<MC_ITERATIONS; i++){
    const margin = expectedMargin + randn()*marginSD;
    const total  = totalMean + randn()*totalSD;
    margins.push(margin);
    totals.push(total);
    const atsResult = margin + cover_line;
    if(atsResult > 0.5)  coverCount++;
    else if(atsResult < -0.5) { /* no cover */ }
    else pushCount++;
    if(total > totalMean) overCount++;
    if(Math.abs(margin) > 21) blowoutCount++;
    if(Math.abs(margin) <= 8)  oneScoreCount++;
    const b = Math.round(total/7)*7;
    buckets[b]=(buckets[b]||0)+1;
  }
  margins.sort((a,b)=>a-b);
  totals.sort((a,b)=>a-b);
  const p = pct => margins[Math.floor(MC_ITERATIONS*pct)];
  const tp= pct => totals[Math.floor(MC_ITERATIONS*pct)];

  const dist = Object.entries(buckets)
    .sort((a,b)=>+a[0]-+b[0])
    .map(([range,count])=>({range:+range, pct:Math.round(count/MC_ITERATIONS*100)}));

  return {
    coverProb:     Math.round(coverCount/MC_ITERATIONS*100),
    pushProb:      Math.round(pushCount/MC_ITERATIONS*100),
    overProb:      Math.round(overCount/MC_ITERATIONS*100),
    blowoutProb:   Math.round(blowoutCount/MC_ITERATIONS*100),
    oneScoreProb:  Math.round(oneScoreCount/MC_ITERATIONS*100),
    medianMargin:  p(0.50).toFixed(1),
    marginP10:     p(0.10).toFixed(1),
    marginP25:     p(0.25).toFixed(1),
    marginP75:     p(0.75).toFixed(1),
    marginP90:     p(0.90).toFixed(1),
    totalP10:      tp(0.10).toFixed(1),
    totalP25:      tp(0.25).toFixed(1),
    totalMedian:   tp(0.50).toFixed(1),
    totalP75:      tp(0.75).toFixed(1),
    totalP90:      tp(0.90).toFixed(1),
    scoreDistribution: dist,
    iterations:    MC_ITERATIONS,
    params:        { homeWinProb, expectedMargin:expectedMargin.toFixed(1), marginSD:marginSD.toFixed(1), totalMean, totalSD:totalSD.toFixed(1) }
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. CONCEPT DRIFT DETECTOR
// Compares rolling accuracy to baseline. Triggers alert if recent window
// drops 15%+ below historical. Protects against stale learned weights.
// ═══════════════════════════════════════════════════════════════════════════
function detectConceptDrift(history, windowSize=DRIFT_WINDOW) {

export { randn, runMonteCarlo };
