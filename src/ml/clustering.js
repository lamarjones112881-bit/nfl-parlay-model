// ── K-Means Clustering Engine ───────────────────────────────────────────────
// ── K-Means++ initialisation ──────────────────────────────────────────────
function kmeansInit(points, k) {
  const centroids = [points[Math.floor(Math.random()*points.length)]];
  while(centroids.length < k) {
    const dists = points.map(p => Math.min(...centroids.map(c => euclideanSq(p, c))));
    const total  = dists.reduce((s,d)=>s+d, 0);
    let r = Math.random() * total, cumul = 0;
    for(let i=0; i<points.length; i++) { cumul+=dists[i]; if(cumul>=r){centroids.push(points[i]);break;} }
  }
  return centroids;
}
function euclideanSq(a,b){ return a.reduce((s,ai,i)=>s+(ai-(b[i]||0))**2, 0); }
function euclidean(a,b)  { return Math.sqrt(euclideanSq(a,b)); }

// ── K-Means core ──────────────────────────────────────────────────────────
function kMeans(points, k=K_CLUSTERS, maxIter=MAX_ITER) {
  if(points.length < k) return null;
  let centroids    = kmeansInit(points, k);
  let assignments  = new Array(points.length).fill(0);
  let converged    = false;

  for(let iter=0; iter<maxIter && !converged; iter++) {
    converged = true;
    // Assignment step
    points.forEach((p, i) => {
      let best=0, bestDist=Infinity;
      centroids.forEach((c,ci) => { const d=euclideanSq(p,c); if(d<bestDist){bestDist=d;best=ci;} });
      if(best !== assignments[i]){ assignments[i]=best; converged=false; }
    });
    // Update step — recompute centroids
    centroids = centroids.map((_,ci) => {
      const cluster = points.filter((_,i)=>assignments[i]===ci);
      if(!cluster.length) return centroids[ci];
      return cluster[0].map((_,fi)=>cluster.reduce((s,p)=>s+(p[fi]||0),0)/cluster.length);
    });
  }

  // Silhouette score (quality metric, -1 to +1)
  const silhouette = computeSilhouette(points, assignments, centroids);

  return { centroids, assignments, silhouette, iterations: maxIter };
}

// ── Silhouette score ──────────────────────────────────────────────────────
function computeSilhouette(points, assignments, centroids) {
  if(points.length < 4) return 0;
  const scores = points.map((p, i) => {
    const myCluster = assignments[i];
    const a = (() => { // mean dist to same cluster
      const same = points.filter((_,j)=>j!==i&&assignments[j]===myCluster);
      return same.length ? same.reduce((s,q)=>s+euclidean(p,q),0)/same.length : 0;
    })();
    const b = (() => { // min mean dist to other clusters
      const otherClusters = [...new Set(assignments)].filter(c=>c!==myCluster);
      if(!otherClusters.length) return a;
      return Math.min(...otherClusters.map(c => {
        const other = points.filter((_,j)=>assignments[j]===c);
        return other.length ? other.reduce((s,q)=>s+euclidean(p,q),0)/other.length : Infinity;
      }));
    })();
    return a===0 && b===0 ? 0 : (b-a)/Math.max(a,b);
  });
  return parseFloat((scores.reduce((s,v)=>s+v,0)/scores.length).toFixed(3));
}

// ── Feature normalisation ─────────────────────────────────────────────────
function normalise(values) {
  const min=Math.min(...values), max=Math.max(...values);
  if(max===min) return values.map(()=>0.5);
  return values.map(v=>(v-min)/(max-min));
}

// ── Extract feature vectors from accumulated model data ───────────────────
function buildFeatureVectors(teamSignalMap, backtestHistory) {
  // teamSignalMap: { teamName: { passYds, rushYds, ppg, papg, pressureAllowed,
  //                              pressureGenerated, cpoe, olHealth, avgTotal } }
  const teams  = Object.keys(teamSignalMap);
  if(teams.length < K_CLUSTERS) return null;

  const raw = teams.map(team => {
    const d = teamSignalMap[team];
    // ATS% from backtest
    const btGames = backtestHistory?.filter(g=>g.homeTeam===team||g.awayTeam===team)||[];
    const atsPct  = btGames.length ? btGames.filter(g=>g.spreadCorrect).length/btGames.length : 0.5;
    return {
      team,
      features: [
        d.passYds / Math.max(d.passYds+(d.rushYds||1), 1),  // [0] passVolumeRatio
        (d.rushYds||60) / 130,                                // [1] rushStrength (normalised to 130 max)
        normalizeDVOA(d.offDVOA||0, false),                   // [2] offDVOA (replaces raw PPG)
        normalizeDVOA(d.defDVOA||0, true),                    // [3] defDVOA inverted (better D = higher score)
        1 - (d.pressureAllowed||28) / 50,                     // [4] pressureAllowed (inverted)
        (d.pressureGenerated||45) / 70,                       // [5] pressureGenerated
        ((d.cpoe||0) + 10) / 20,                              // [6] cpoeScore (−10 to +10 range)
        (d.olHealth||75) / 100,                               // [7] olHealth
        (d.avgTotal||44) / 60,                                // [8] totalEnvironment
        atsPct,                                               // [9] coverTendency
      ]
    };
  });

  // Per-feature normalisation across all teams
  const matrix       = raw.map(r=>r.features);
  const normalised   = matrix[0].map((_,fi)=>normalise(matrix.map(r=>r[fi])));
  const normVectors  = matrix.map((_,ti)=>normalised.map(col=>col[ti]));

  return { teams, rawFeatures: raw, normVectors };
}

// ── Post-hoc archetype labelling from centroid ────────────────────────────
function labelArchetype(centroid) {
  // [0]passVol [1]rushStr [2]offOut [3]defStr [4]pressAllowed(inv) [5]pressGen [6]cpoe [7]olHealth [8]total [9]ats
  const [passVol, rushStr, offOut, defStr, pressureOK, pressureGen, cpoeScore, olHealth, totalEnv, ats] = centroid;

  const passHeavy  = passVol  > 0.55;
  const runHeavy   = rushStr  > 0.60;
  const highScoring= offOut   > 0.60;
  const eliteDef   = defStr   > 0.65;
  const elitePress = pressureGen > 0.62;
  const highCPOE   = cpoeScore > 0.58;
  const highTotal  = totalEnv > 0.65;
  const lowTotal   = totalEnv < 0.40;
  const healthyOL  = olHealth > 0.72;

  if(eliteDef && elitePress && !highScoring)   return "ELITE_DEFENSE";
  if(runHeavy && healthyOL && lowTotal)         return "POWER_RUN";
  if(runHeavy && !highScoring && lowTotal)      return "BALL_CONTROL";
  if(passHeavy && highCPOE && highTotal)        return "AIR_RAID";
  if(passHeavy && highScoring && highTotal)     return "SPREAD_SHOOT";
  return "WEST_COAST"; // balanced default
}

// ── Matchup tendency lookup ───────────────────────────────────────────────
function getMatchupTendency(homeArchetype, awayArchetype) {
  if(!homeArchetype || !awayArchetype) return null;
  // Home team defends against away team's offense
  const tend = MATCHUP_TENDENCIES[awayArchetype]?.[homeArchetype];
  if(!tend) return null;
  return { ...tend, homeArchetype, awayArchetype,
    label:`${ARCHETYPES[awayArchetype]?.label} offense vs ${ARCHETYPES[homeArchetype]?.label} defense` };
}

// ── Run full clustering pipeline ──────────────────────────────────────────
function runClusteringPipeline(teamSignalMap, backtestHistory) {
  const extracted = buildFeatureVectors(teamSignalMap, backtestHistory);
  if(!extracted) return null;
  const { teams, rawFeatures, normVectors } = extracted;

  // Run K-Means 3 times with different seeds, keep best silhouette
  let best = null;
  for(let run=0; run<3; run++) {
    const result = kMeans(normVectors, K_CLUSTERS);
    if(result && (!best || result.silhouette > best.silhouette)) best = result;
  }
  if(!best) return null;

  // Build cluster map: clusterIndex → { archetype, teams, centroid }
  const clusters = {};
  best.assignments.forEach((ci, ti) => {
    if(!clusters[ci]) clusters[ci] = { centroid: best.centroids[ci], teamList:[], archetype: null };
    clusters[ci].teamList.push(teams[ti]);
  });
  Object.keys(clusters).forEach(ci => {
    clusters[ci].archetype = labelArchetype(clusters[ci].centroid);
  });

  // Team → archetype map
  const teamArchetypes = {};
  best.assignments.forEach((ci, ti) => {
    teamArchetypes[teams[ti]] = clusters[ci].archetype;
  });

  return { clusters, teamArchetypes, silhouette: best.silhouette,
           teamsAnalyzed: teams.length, features: rawFeatures };
}

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMATIC CLUSTER PANEL
// ═══════════════════════════════════════════════════════════════════════════
function SchematicClusterPanel({ clusterResult, homeTeam, awayTeam,

export { kmeansInit, euclideanSq, euclidean, kMeans, computeSilhouette, normalise, buildFeatureVectors, labelArchetype, getMatchupTendency, runClusteringPipeline };
