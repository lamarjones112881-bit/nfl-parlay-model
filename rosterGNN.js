// ── Roster GNN Engine ───────────────────────────────────────────────────────
function messagePass(nodes, rounds = 2) {
  let hidden = JSON.parse(JSON.stringify(nodes)); // deep clone
  for (let r = 0; r < rounds; r++) {
    const next = {};
    Object.keys(hidden).forEach(node => {
      const edges    = POSITION_EDGES[node] || {};
      const nbKeys   = Object.keys(edges);
      if (!nbKeys.length) { next[node] = hidden[node]; return; }
      // Mean aggregation: h_v' = (h_v + Σ w_ij*h_j / Σ w_ij) / 2
      const wSum     = nbKeys.reduce((s, nb) => s + (edges[nb] || 0), 0);
      const nbSignal = nbKeys.reduce((s, nb) => {
        const nbScore = hidden[nb]?.score ?? 1.0;
        return s + (edges[nb] || 0) * nbScore;
      }, 0);
      const aggregated = (hidden[node].score + (wSum > 0 ? nbSignal / wSum : hidden[node].score)) / 2;
      next[node] = { ...hidden[node], score: parseFloat(Math.min(1, Math.max(0, aggregated)).toFixed(4)) };
    });
    hidden = next;
  }
  return hidden;
}

// ── Build node features from injury + signal data ─────────────────────────
function buildRosterNodes(injuryData, pressureData, olData, cpoeData) {
  const nodes = {};
  // Default all positions to healthy
  Object.keys(POSITION_EDGES).forEach(pos => { nodes[pos] = { score: 1.0, pos }; });

  // Apply injury data (if parseable)
  if (injuryData) {
    const text = injuryData.toLowerCase();
    const hits = [
      { key:"QB",  terms:["qb","quarterback"] },
      { key:"LT",  terms:["lt ","left tackle"] },
      { key:"LG",  terms:["lg ","left guard"] },
      { key:"C",   terms:[" c ","center"] },
      { key:"RG",  terms:["rg ","right guard"] },
      { key:"RT",  terms:["rt ","right tackle"] },
      { key:"WR1", terms:["wr1","wr 1","#1 wr","top wr"] },
      { key:"WR2", terms:["wr2","wr 2","#2 wr"] },
      { key:"TE",  terms:["te ","tight end"] },
      { key:"RB",  terms:["rb ","running back"] },
    ];
    hits.forEach(({ key, terms }) => {
      if (terms.some(t => text.includes(t))) {
        if (text.match(new RegExp(`(${terms.join("|")}).{0,40}out`))) nodes[key] = { score: 0.0, pos: key, status: "out" };
        else if (text.match(new RegExp(`(${terms.join("|")}).{0,40}doubtful`))) nodes[key] = { score: 0.35, pos: key, status: "doubtful" };
        else if (text.match(new RegExp(`(${terms.join("|")}).{0,40}questionable`))) nodes[key] = { score: 0.72, pos: key, status: "questionable" };
      }
    });
  }

  // Opposing pass rush as EDGE_OPP node
  const pressureRate = pressureData?.home?.pressureAllowed || 28;
  nodes["EDGE_OPP"] = { score: Math.min(1, pressureRate / 50), pos: "EDGE_OPP" };

  // OL health affects individual OL nodes
  const olHealth = olData?.home?.healthScore || 80;
  if (olHealth < 75) {
    ["LT","LG","C","RG","RT"].forEach(pos => {
      nodes[pos] = { ...nodes[pos], score: Math.min(nodes[pos]?.score ?? 1, olHealth / 100) };
    });
  }

  // CPOE boosts QB node (elite QB masks OL deficiencies somewhat)
  const cpoe = cpoeData?.home?.cpoe || 0;
  if (cpoe > 3) nodes["QB"] = { ...nodes["QB"], score: Math.min(1, (nodes["QB"]?.score ?? 1) + cpoe / 50) };

  return nodes;
}

// ── Roster integrity score from GNN output ────────────────────────────────
function aggregateRosterScore(gnnOutput) {
  let score = 0;
  Object.entries(POSITION_IMPORTANCE).forEach(([pos, w]) => {
    score += (gnnOutput[pos]?.score ?? 1.0) * w;
  });
  return parseFloat((score * 100).toFixed(1));
}

// ── Spread adjustment from roster integrity ───────────────────────────────
// Calibrated: 100→50 roster score = ~2.5 pts spread impact
function rosterToSpreadAdj(homeScore, awayScore) {
  const homeDelta  = (homeScore - 80) / 100;  // vs 80 baseline
  const awayDelta  = (awayScore - 80) / 100;
  const netAdj     = (homeDelta - awayDelta) * 5; // 20-pt delta ≈ 1 pt spread
  return parseFloat(netAdj.toFixed(2));
}

// ── Full GNN pipeline for one team ────────────────────────────────────────
function runRosterGNN(injuryText, pressureData, olData, cpoeData, side = "home") {
  // Adjust to home/away perspective
  const pData = side === "home" ? pressureData : { home: pressureData?.away };
  const oData = side === "home" ? olData       : { home: olData?.away };
  const cData = side === "home" ? cpoeData     : { home: cpoeData?.away };

  const rawNodes    = buildRosterNodes(injuryText, pData, oData, cData);
  const gnnOutput   = messagePass(rawNodes, 2);
  const integrityScore = aggregateRosterScore(gnnOutput);

  // Identify cascade effects (nodes whose score dropped significantly post-GNN)
  const cascades = Object.entries(gnnOutput)
    .filter(([pos]) => POSITION_IMPORTANCE[pos])
    .map(([pos, n]) => {
      const rawScore = rawNodes[pos]?.score ?? 1;
      const drop     = rawScore - n.score;
      return { pos, rawScore, gnnScore: n.score, drop: parseFloat(drop.toFixed(3)), status: rawNodes[pos]?.status };
    })
    .filter(c => c.drop > 0.03 || c.status)
    .sort((a, b) => b.drop - a.drop);

  return { gnnOutput, integrityScore, cascades, rawNodes };
}

// ═══════════════════════════════════════════════════════════════════════════
// COVERAGE SCHEME DETECTOR
// ═══════════════════════════════════════════════════════════════════════════
const COVERAGE_SCHEMES = {
  MAN_HEAVY:   { label:"Man Coverage",    icon:"🔒", color:"#f87171", passAdj:-0.08, rushAdj:+0.04, wr1Adj:+0.06, desc:"Press man — elite WR1 can exploit, but timing routes suffer. RBs get more attempts." },
  COVER_2:     { label:"Cover 2",         icon:"2️⃣",  color:"#f59e0b", passAdj:+0.04, rushAdj:-0.02, wr1Adj:-0.05, desc:"Soft zones — shorter targets, high completion%, seams open for TE. Sideline routes limited." },
  COVER_3:     { label:"Cover 3",         icon:"3️⃣",  color:"#38bdf8", passAdj:+0.02, rushAdj:+0.00, wr1Adj:0,     desc:"Balanced zone. Intermediate routes open. Hard to attack vertically." },
  COVER_4:     { label:"Cover 4/Quarters",icon:"4️⃣",  color:"#a78bfa", passAdj:+0.06, rushAdj:-0.04, wr1Adj:+0.04, desc:"Deep protection — quick passes thrive, verticals capped. Run game pressured." },
  BLITZ_HEAVY: { label:"Blitz-Heavy",     icon:"💥", color:"#ef4444", passAdj:+0.10, rushAdj:-0.08, wr1Adj:+0.12, desc:"High-risk/reward. Elite QB beats blitz for big plays; mediocre QB gets killed. Totals spike or crater." },
  HYBRID:      { label:"Hybrid/Multiple", icon:"🔄", color:"#4ade80", passAdj:0,     rushAdj:0,     wr1Adj:0,     desc:"Multiple looks — hard to prepare for. Keeps offense off-balance. Good for elite defensive coaches." },
};

function detectCoverageScheme(pressureData, cpoeData, ensembleData) {
  if (!pressureData) return "COVER_3";
  const blitzRate  = pressureData.home?.pressureAllowed || 28;
  const passRushW  = pressureData.home?.passRushWin    || 45;
  const cpoe       = cpoeData?.home?.cpoe              || 0;
  if (blitzRate > 38) return "BLITZ_HEAVY";
  if (passRushW > 60) return "MAN_HEAVY";
  if (blitzRate < 22 && passRushW < 38) return "COVER_4";
  if (blitzRate < 26) return "COVER_2";
  return "COVER_3";
}

// ═══════════════════════════════════════════════════════════════════════════
// SNAP COUNT / DEPTH CHART TRACKER
// ═══════════════════════════════════════════════════════════════════════════
const SNAP_BASELINE = {
  QB:80, WR1:73, WR2:62, TE:58, RB:55, LT:98, LG:95, C:98, RG:95, RT:96,
};

function estimateSnapCounts(injuryData, gnnResult) {
  const snaps = {};
  Object.entries(SNAP_BASELINE).forEach(([pos, base]) => {
    const gnnScore  = gnnResult?.gnnOutput?.[pos]?.score ?? 1.0;
    const status    = gnnResult?.rawNodes?.[pos]?.status;
    const adjusted  = status === "out" ? 0 : Math.round(base * gnnScore);
    snaps[pos]      = { base, adjusted, gnnScore, pctChange: Math.round((adjusted - base) / base * 100) };
  });
  return snaps;
}

// ═══════════════════════════════════════════════════════════════════════════
// UI — GNN ROSTER PANEL
// ═══════════════════════════════════════════════════════════════════════════
function GNNRosterPanel({ homeTeam, awayTeam, injuries, pressureData, olData, cpoeData, ensembleData, lines }) {

export { messagePass, buildRosterNodes, aggregateRosterScore, rosterToSpreadAdj, runRosterGNN, detectCoverageScheme, estimateSnapCounts };
