import { useState, useEffect, useRef } from "react";

// ── Constants
import { NFL_TEAMS, DIVISIONS, TEAM_ABBR, TEAM_COLORS, STADIUM_CTX, EMPTY_STATS, abb, tc, BET_TYPES, RISK_COLORS, HIST_KEY, PRESETS_KEY, BACKTEST_KEY, CLV_KEY, CALIBRATION_KEY, WEIGHTS_KEY, SEASON_KEY, POWER_KEY, PENDING_KEY, PROPS_KEY, CLUSTER_KEY, GNN_KEY, SCHEDULE_KEY } from "./constants/teams.js";

// ── Utils
import { americanToDecimal, decimalToImplied, calcEV, calcKelly, parseInjuryImpact } from "./utils/mathUtils.js";
import { calcWeatherSeverity, weatherAdjustWithSeverity } from "./utils/weatherUtils.js";
import { cacheGet, cacheSet, detectContradictions, calcCLV, calcCompScore, detectSteamMove } from "./utils/signalUtils.js";
import { calcAdvancedTotalAdj, calcTurnoverLuck, epaGrade } from "./utils/advancedStats.js";
import { normalizeDVOA, dvoaToSpreadAdj, dvoaGrade } from "./utils/dvoaUtils.js";
import { bookWeight, calcTrueMarketPrice, detectSharpLineGaps, detectMiddles } from "./utils/sportsbookUtils.js";
import { derivePlayerProjections, calcPropEdge } from "./utils/propUtils.js";
import { buildCorrelationMatrix, calcDivergence } from "./utils/correlationUtils.js";
import { getETNow, getWeekKey, getPhaseStatus } from "./utils/scheduleUtils.js";
import { computeModelRatings } from "./utils/modelRatings.js";

// ── ML
import { runRosterGNN, detectCoverageScheme, estimateSnapCounts } from "./ml/rosterGNN.js";
import { randn, runMonteCarlo } from "./ml/monteCarlo.js";
import { detectConceptDrift, computeFeatureImportance, autoCalibrate, classifyMistake, computePipelineHealth, attributeSignals, updateWeightsOnline, fingerprintGame, computeTeamBias, lookupPatterns, buildLearningContext } from "./ml/learningEngine.js";
import { expectedEloWin, updateElo, eloToSpreadAdj, eloWinProb, eloGrade } from "./ml/eloEngine.js";
import { runClusteringPipeline } from "./ml/clustering.js";

// ── UI Components
import { Spinner, Tag, Panel, PanelTitle, Skel, WinBar, StatFld } from "./components/UIKit.jsx";
import { WeekSchedule, SavedPresets, KeyNumBadge, QBPanel, ParlayBuilder, HistoryTracker, ParlayAutoSuggester } from "./components/ScheduleComponents.jsx";
import { GameCard, CorrelationMatrixPanel, DivergenceAlert } from "./components/GameCard.jsx";

// ── Panels
import EVKellyPanel from "./panels/EVKellyPanel.jsx";
import BankrollPanel from "./panels/BankrollPanel.jsx";
import WeatherForecastPanel from "./panels/WeatherForecastPanel.jsx";
import GNNRosterPanel from "./panels/GNNRosterPanel.jsx";
import PropModelerPanel from "./panels/PropModelerPanel.jsx";
import SportsbookProfilePanel from "./panels/SportsbookProfilePanel.jsx";
import SharpLineArbitragePanel from "./panels/SharpLineArbitragePanel.jsx";
import EloPowerPanel from "./panels/EloPowerPanel.jsx";
import ScheduleSpotPanel from "./panels/ScheduleSpotPanel.jsx";
import PublicBettingPanel from "./panels/PublicBettingPanel.jsx";
import AdvancedStatsPanel from "./panels/AdvancedStatsPanel.jsx";
import LineShoppingPanel from "./panels/LineShoppingPanel.jsx";
import InjuryImpactPanel from "./panels/InjuryImpactPanel.jsx";
import MonteCarloPanel from "./panels/MonteCarloPanel.jsx";
import { DriftDetectorPanel, FeatureImportancePanel, MistakeDigestPanel, PipelineStatusPanel } from "./panels/MLAnalysisPanels.jsx";
import { SelfLearningPanel, PatternMatchAlert } from "./panels/SelfLearningPanel.jsx";
import { WeatherSeverityBar, H2HPanel } from "./panels/WeatherH2HPanels.jsx";
import DVOAPanel from "./panels/DVOAPanel.jsx";
import { LogitPanel, GarbageTimePanel, LeveragePanel } from "./panels/SignalPanels.jsx";
import { CoachingPanel, CPOEPanel, PressurePanel, MarketEnsemblePanel, OLPanel, MicroContextPanel } from "./panels/AnalysisPanels.jsx";
import AutoResultsPanel from "./panels/AutoResultsPanel.jsx";
import SchematicClusterPanel from "./panels/SchematicClusterPanel.jsx";
import MLEngineDashboard from "./panels/MLEngineDashboard.jsx";
import WeeklyExecutionDashboard from "./panels/WeeklyExecutionDashboard.jsx";
import PowerRankingsPanel from "./panels/PowerRankingsPanel.jsx";
import WeeklyPick from "./panels/WeeklyPick.jsx";
import { SplitsPanel, RefPanel, PrimeTimePanel, MultiSeasonPanel, SituationalATSPanel } from "./panels/ContextPanels.jsx";
import SeasonDashboard from "./panels/SeasonDashboard.jsx";
import { SteamMoveAlert, ContradictionPanel, SignalWeightPanel, CalibrationPanel, CLVPanel, BacktestPanel } from "./panels/TrackingPanels.jsx";

export default function NFLParlayModel(){
  const [homeTeam,setHomeTeam]=useState("");const [awayTeam,setAwayTeam]=useState("");
  const [venue,setVenue]=useState("home");const [weather,setWeather]=useState("dome");
  const [homeStats,setHomeStats]=useState(EMPTY_STATS);const [awayStats,setAwayStats]=useState(EMPTY_STATS);
  const [homeHL,setHomeHL]=useState(false);const [awayHL,setAwayHL]=useState(false);
  const [statsStatus,setStatsStatus]=useState("noTeams");
  const [injuries,setInjuries]=useState("");const [injuryStatus,setInjuryStatus]=useState("noTeams");
  const [lines,setLines]=useState(null);const [linesStatus,setLinesStatus]=useState("noTeams");const [lineMove,setLineMove]=useState(null);
  const [formData,setFormData]=useState(null);const [formStatus,setFormStatus]=useState("noTeams");
  const [rankData,setRankData]=useState(null);const [rankStatus,setRankStatus]=useState("noTeams");
  const [pressureData,setPressureData]=useState(null);const [pressureStatus,setPressureStatus]=useState("noTeams");
  const [ensembleData,setEnsembleData]=useState(null);const [ensembleStatus,setEnsembleStatus]=useState("noTeams");
  const [olData,setOlData]=useState(null);const [olStatus,setOlStatus]=useState("noTeams");
  const [microData,setMicroData]=useState(null);const [microStatus,setMicroStatus]=useState("noTeams");
  // NEW state
  const [garbageData,setGarbageData]=useState(null);const [garbageStatus,setGarbageStatus]=useState("noTeams");
  const [leverageData,setLeverageData]=useState(null);const [leverageStatus,setLeverageStatus]=useState("noTeams");
  const [coachData,setCoachData]=useState(null);const [coachStatus,setCoachStatus]=useState("noTeams");
  const [cpoeData,setCpoeData]=useState(null);const [cpoeStatus,setCpoeStatus]=useState("noTeams");
  const [dataLoading,setDataLoading]=useState(false);
  const [loading,setLoading]=useState(false);const [gameResult,setGameResult]=useState(null);const [error,setError]=useState(null);
  const [parlayLegs,setParlayLegs]=useState([]);const [parlayAnalysis,setParlayAnalysis]=useState(null);const [analyzingParlay,setAnalyzingParlay]=useState(false);
  const [history,setHistory]=useState([]);const [analyzedGames,setAnalyzedGames]=useState([]);
  // ── Backend analytics state ───────────────────────────────────────────────
  const [signalWeights,setSignalWeights]=useState({...DEFAULT_WEIGHTS});
  const [backtestHistory,setBacktestHistory]=useState([]);
  const [clvHistory,setClvHistory]=useState([]);
  const [calibration,setCalibration]=useState(null);
  const [contradictions,setContradictions]=useState([]);
  const [alignments,setAlignments]=useState([]);
  // ── Mobile / fullscreen ───────────────────────────────────────────────────
  const [isFullscreen,setIsFullscreen]=useState(false);
  const [isMobile,setIsMobile]=useState(window.innerWidth<600);
  useEffect(()=>{
    const onFS=()=>setIsFullscreen(!!document.fullscreenElement);
    const onResize=()=>setIsMobile(window.innerWidth<600);
    document.addEventListener('fullscreenchange',onFS);
    window.addEventListener('resize',onResize);
    return()=>{document.removeEventListener('fullscreenchange',onFS);window.removeEventListener('resize',onResize);};
  },[]);
  function toggleFullscreen(){
    if(!document.fullscreenElement){
      (document.documentElement.requestFullscreen||document.documentElement.webkitRequestFullscreen||document.documentElement.mozRequestFullScreen)?.call(document.documentElement);
    } else {
      (document.exitFullscreen||document.webkitExitFullscreen||document.mozCancelFullScreen)?.call(document);
    }
  }
  // ── New feature state ─────────────────────────────────────────────────────
  const [splitsData,setSplitsData]=useState(null);const [splitsStatus,setSplitsStatus]=useState("noTeams");
  const [refData,setRefData]=useState(null);const [refStatus,setRefStatus]=useState("noTeams");
  const [primeData,setPrimeData]=useState(null);const [primeStatus,setPrimeStatus]=useState("noTeams");
  const [multiData,setMultiData]=useState(null);const [multiStatus,setMultiStatus]=useState("noTeams");
  const [situationalData,setSituationalData]=useState(null);const [situationalStatus,setSituationalStatus]=useState("noTeams");
  const [advancedData,setAdvancedData]=useState(null);const [advancedStatus,setAdvancedStatus]=useState("noTeams");
  const [scheduleSpotData,setScheduleSpotData]=useState(null);const [scheduleSpotLoading,setScheduleSpotLoading]=useState(false);
  const [publicData,setPublicData]=useState(null);const [publicLoading,setPublicLoading]=useState(false);
  const [eloRatings,setEloRatings]=useState({});
  // ── Self-learning state ───────────────────────────────────────────────────
  const [learnedWeights,setLearnedWeights]=useState({...DEFAULT_WEIGHTS});
  const [patternMemory,setPatternMemory]=useState({});
  const [teamBias,setTeamBias]=useState([]);
  const [currentFingerprint,setCurrentFingerprint]=useState(null);
  const [patternResult,setPatternResult]=useState(null);
  // ── Clustering state ──────────────────────────────────────────────────────
  const [clusterResult,setClusterResult]=useState(null);
  const [fetchingSchematic,setFetchingSchematic]=useState(false);
  const [teamSignalMap,setTeamSignalMap]=useState({});
  // ── Weekly execution schedule state ──────────────────────────────────────
  const [completedPhases,setCompletedPhases]=useState({});
  const [phase1Running,setPhase1Running]=useState(false);
  const [phase2Running,setPhase2Running]=useState(false);
  const [phase3Running,setPhase3Running]=useState(false);
  const [phase4Running,setPhase4Running]=useState(false);
  // ── Advanced systems state ────────────────────────────────────────────────
  const [mcResult,setMcResult]=useState(null);
  const [mcRunning,setMcRunning]=useState(false);
  const [driftResult,setDriftResult]=useState(null);
  const [featureImportance,setFeatureImportance]=useState([]);
  const [mistakes,setMistakes]=useState([]);
  const [fetchTimestamps,setFetchTimestamps]=useState({});
  const [pipelineHealth,setPipelineHealth]=useState(null);
  // ── 5 New features state ──────────────────────────────────────────────────
  const [unitHistory,setUnitHistory]=useState([]);
  const [forecastData,setForecastData]=useState(null);
  const [forecastLoading,setForecastLoading]=useState(false);
  // ── Auto-fetch results state ──────────────────────────────────────────────
  const [pendingGames,setPendingGames]=useState([]);
  // ── Bet intent — set before analysis, auto-fills bankroll on result ────────
  const [betIntentUnits,setBetIntentUnits]=useState("");
  const [betIntentOdds,setBetIntentOdds]=useState("-110");
  const [betIntentActive,setBetIntentActive]=useState(false);
  const [fetchingResults,setFetchingResults]=useState(false);
  const [fetchProgress,setFetchProgress]=useState("");
  // ── Three new features state ──────────────────────────────────────────────
  const [h2hData,setH2hData]=useState(null);const [h2hLoading,setH2hLoading]=useState(false);
  const [dvoaData,setDvoaData]=useState(null);const [dvoaLoading,setDvoaLoading]=useState(false);
  const [weatherSeverity,setWeatherSeverity]=useState(null);
  const prevTeams=useRef({home:"",away:""});
  const lastAttributionRef=useRef(null);

  useEffect(()=>{
    (async()=>{
      try{const r=await window.storage.get(HIST_KEY);if(r)setHistory(JSON.parse(r.value));}catch{}
      try{const r=await window.storage.get(BACKTEST_KEY);if(r){const h=JSON.parse(r.value);setBacktestHistory(h);setFeatureImportance(computeFeatureImportance(h));setDriftResult(detectConceptDrift(h));}}catch{}
      try{const r=await window.storage.get(CLV_KEY);if(r)setClvHistory(JSON.parse(r.value));}catch{}
      try{const r=await window.storage.get(WEIGHTS_KEY);if(r)setSignalWeights(JSON.parse(r.value));}catch{}
      try{const r=await window.storage.get(CALIBRATION_KEY);if(r)setCalibration(JSON.parse(r.value));}catch{}
      try{const r=await window.storage.get(LEARNING_KEY);if(r)setLearnedWeights(JSON.parse(r.value));}catch{}
      try{const r=await window.storage.get(PATTERN_KEY);if(r)setPatternMemory(JSON.parse(r.value));}catch{}
      try{const r=await window.storage.get(MISTAKE_KEY);if(r)setMistakes(JSON.parse(r.value));}catch{}
      try{const r=await window.storage.get(UNITS_KEY);if(r)setUnitHistory(JSON.parse(r.value));}catch{}
      try{const r=await window.storage.get(CLUSTER_KEY);if(r){const d=JSON.parse(r.value);setClusterResult(d.result);setTeamSignalMap(d.signalMap||{});}}catch{}
      try{const r=await window.storage.get(SCHEDULE_KEY);if(r)setCompletedPhases(JSON.parse(r.value));}catch{}
      try{const r=await window.storage.get(PENDING_KEY);if(r){
        // Auto-expire games older than 7 days
        const cutoff=Date.now()-7*24*60*60*1000;
        const active=JSON.parse(r.value).filter(g=>!g.analyzedTs||g.analyzedTs>cutoff);
        setPendingGames(active);
        if(active.length!==JSON.parse(r.value).length) await window.storage.set(PENDING_KEY,JSON.stringify(active));
      }}catch{}
    })();
  },[]);

  useEffect(()=>{
    if(!homeTeam||!awayTeam)return;
    if(homeTeam!==prevTeams.current.home||awayTeam!==prevTeams.current.away){
      prevTeams.current={home:homeTeam,away:awayTeam};
      setGameResult(null);setError(null);setMcResult(null);
      setForecastData(null);setWeatherSeverity(null);
      setH2hData(null);setDvoaData(null);
      setScheduleSpotData(null);setPublicData(null);
      loadAllData();
      // Auto-fetch weather for outdoor stadiums
      if(!STADIUM_CTX[homeTeam]?.indoor&&OUTDOOR_STADIUMS[homeTeam]) fetchWeatherForecast(homeTeam);
      // Auto-fetch on team selection
      fetchH2H();
      fetchDVOA();
      fetchScheduleSpot();
      fetchPublicPct();
    }
  },[homeTeam,awayTeam]);

  async function loadAllData(){
    setDataLoading(true);
    setHomeStats(EMPTY_STATS);setAwayStats(EMPTY_STATS);setHomeHL(false);setAwayHL(false);
    setInjuries("");setLines(null);setLineMove(null);setFormData(null);setRankData(null);
    setPressureData(null);setEnsembleData(null);setOlData(null);setMicroData(null);
    setGarbageData(null);setLeverageData(null);setCoachData(null);setCpoeData(null);
    setContradictions([]);setAlignments([]);
    setSplitsData(null);setRefData(null);setPrimeData(null);setMultiData(null);setSituationalData(null);
    [setStatsStatus,setInjuryStatus,setLinesStatus,setFormStatus,setRankStatus,
     setPressureStatus,setEnsembleStatus,setOlStatus,setMicroStatus,
     setGarbageStatus,setLeverageStatus,setCoachStatus,setCpoeStatus,
     setSplitsStatus,setRefStatus,setPrimeStatus,setMultiStatus,setSituationalStatus].forEach(s=>s("loading"));

    // ── Check session cache first (avoids re-fetching within 30 min) ─────────
    const cached = {
      stats:    cacheGet(homeTeam,awayTeam,"stats"),
      inj:      cacheGet(homeTeam,awayTeam,"inj"),
      formrank: cacheGet(homeTeam,awayTeam,"formrank"),
      lines:    cacheGet(homeTeam,awayTeam,"lines"),
      pressure: cacheGet(homeTeam,awayTeam,"pressure"),
      ensemble: cacheGet(homeTeam,awayTeam,"ensemble"),
      ol:       cacheGet(homeTeam,awayTeam,"ol"),
      micro:    cacheGet(homeTeam,awayTeam,"micro"),
      garbage:  cacheGet(homeTeam,awayTeam,"garbage"),
      leverage: cacheGet(homeTeam,awayTeam,"leverage"),
      coach:    cacheGet(homeTeam,awayTeam,"coach"),
      cpoe:     cacheGet(homeTeam,awayTeam,"cpoe"),
      splits:   cacheGet(homeTeam,awayTeam,"splits"),
      ref:      cacheGet(homeTeam,awayTeam,"ref"),
      primesite:cacheGet(homeTeam,awayTeam,"prime"),
      multi:    cacheGet(homeTeam,awayTeam,"multi"),
      sit:      cacheGet(homeTeam,awayTeam,"sit"),
    };
    const needsFetch = k => !cached[k];

    const [statsR,injR,formRR,linesR,pressR,ensR,olR,microR,garbR,levR,coachR,cpoeR,splitsR,refR,primeR,multiR,sitR,advR]=await Promise.allSettled([
      needsFetch("stats")    ? fetchStatsData()    : Promise.resolve(cached.stats),
      needsFetch("inj")      ? fetchInjuryData()   : Promise.resolve(cached.inj),
      needsFetch("formrank") ? fetchFormRankData()  : Promise.resolve(cached.formrank),
      needsFetch("lines")    ? fetchLinesData()     : Promise.resolve(cached.lines),
      needsFetch("pressure") ? fetchPressureData()  : Promise.resolve(cached.pressure),
      needsFetch("ensemble") ? fetchEnsembleData()  : Promise.resolve(cached.ensemble),
      needsFetch("ol")       ? fetchOLData()        : Promise.resolve(cached.ol),
      needsFetch("micro")    ? fetchMicroData()     : Promise.resolve(cached.micro),
      needsFetch("garbage")  ? fetchGarbageData()   : Promise.resolve(cached.garbage),
      needsFetch("leverage") ? fetchLeverageData()  : Promise.resolve(cached.leverage),
      needsFetch("coach")    ? fetchCoachData()     : Promise.resolve(cached.coach),
      needsFetch("cpoe")     ? fetchCPOEData()      : Promise.resolve(cached.cpoe),
      needsFetch("splits")   ? fetchSplitsData()    : Promise.resolve(cached.splits),
      needsFetch("ref")      ? fetchRefData()       : Promise.resolve(cached.ref),
      needsFetch("prime")    ? fetchPrimeData()     : Promise.resolve(cached.primesite),
      needsFetch("multi")    ? fetchMultiSeasonData(): Promise.resolve(cached.multi),
      needsFetch("sit")      ? fetchSituationalData(): Promise.resolve(cached.sit),
      needsFetch("adv")      ? fetchAdvancedData()  : Promise.resolve(cached.adv),
    ]);

    if(statsR.status==="fulfilled")  applyStats(statsR.value);       else setStatsStatus("error");
    if(injR.status==="fulfilled")    applyInjuries(injR.value);      else setInjuryStatus("error");
    if(formRR.status==="fulfilled")  applyFormRank(formRR.value);    else{setFormStatus("error");setRankStatus("error");}
    if(linesR.status==="fulfilled")  applyLines(linesR.value);       else setLinesStatus("error");
    if(pressR.status==="fulfilled")  applyPressure(pressR.value);    else setPressureStatus("error");
    if(ensR.status==="fulfilled")    applyEnsemble(ensR.value);      else setEnsembleStatus("error");
    if(olR.status==="fulfilled")     applyOL(olR.value);             else setOlStatus("error");
    if(microR.status==="fulfilled")  applyMicro(microR.value);       else setMicroStatus("error");
    if(garbR.status==="fulfilled")   applyGarbage(garbR.value);      else setGarbageStatus("error");
    if(levR.status==="fulfilled")    applyLeverage(levR.value);      else setLeverageStatus("error");
    if(coachR.status==="fulfilled")  applyCoach(coachR.value);       else setCoachStatus("error");
    if(cpoeR.status==="fulfilled")   applyCPOE(cpoeR.value);         else setCpoeStatus("error");
    if(splitsR.status==="fulfilled") applySplits(splitsR.value);     else setSplitsStatus("error");
    if(refR.status==="fulfilled")    applyRef(refR.value);           else setRefStatus("error");
    if(primeR.status==="fulfilled")  applyPrime(primeR.value);       else setPrimeStatus("error");
    if(multiR.status==="fulfilled")  applyMulti(multiR.value);       else setMultiStatus("error");
    if(sitR.status==="fulfilled")    applySituational(sitR.value);   else setSituationalStatus("error");
    if(advR.status==="fulfilled")   applyAdvanced(advR.value);      else setAdvancedStatus("error");

    // ── Write successful results to session cache ─────────────────────────────
    if(statsR.status==="fulfilled")   cacheSet(homeTeam,awayTeam,"stats",statsR.value);
    if(injR.status==="fulfilled")     cacheSet(homeTeam,awayTeam,"inj",injR.value);
    if(formRR.status==="fulfilled")   cacheSet(homeTeam,awayTeam,"formrank",formRR.value);
    if(linesR.status==="fulfilled")   cacheSet(homeTeam,awayTeam,"lines",linesR.value);
    if(pressR.status==="fulfilled")   cacheSet(homeTeam,awayTeam,"pressure",pressR.value);
    if(ensR.status==="fulfilled")     cacheSet(homeTeam,awayTeam,"ensemble",ensR.value);
    if(olR.status==="fulfilled")      cacheSet(homeTeam,awayTeam,"ol",olR.value);
    if(microR.status==="fulfilled")   cacheSet(homeTeam,awayTeam,"micro",microR.value);
    if(garbR.status==="fulfilled")    cacheSet(homeTeam,awayTeam,"garbage",garbR.value);
    if(levR.status==="fulfilled")     cacheSet(homeTeam,awayTeam,"leverage",levR.value);
    if(coachR.status==="fulfilled")   cacheSet(homeTeam,awayTeam,"coach",coachR.value);
    if(cpoeR.status==="fulfilled")    cacheSet(homeTeam,awayTeam,"cpoe",cpoeR.value);
    if(splitsR.status==="fulfilled")  cacheSet(homeTeam,awayTeam,"splits",splitsR.value);
    if(refR.status==="fulfilled")     cacheSet(homeTeam,awayTeam,"ref",refR.value);
    if(primeR.status==="fulfilled")   cacheSet(homeTeam,awayTeam,"prime",primeR.value);
    if(multiR.status==="fulfilled")   cacheSet(homeTeam,awayTeam,"multi",multiR.value);
    if(sitR.status==="fulfilled")     cacheSet(homeTeam,awayTeam,"sit",sitR.value);
    if(advR.status==="fulfilled")     cacheSet(homeTeam,awayTeam,"adv",advR.value);

    // ── Update pipeline timestamps and compute health ─────────────────────
    const now=Date.now();
    const ts={};
    const signalMap=[["stats",statsR],["injuries",injR],["form",formRR],["lines",linesR],["pressure",pressR],["ensemble",ensR],["ol",olR],["micro",microR],["garbage",garbR],["leverage",levR],["coach",coachR],["cpoe",cpoeR],["splits",splitsR],["ref",refR],["prime",primeR],["multi",multiR],["situational",sitR]];
    signalMap.forEach(([name,r])=>{if(r.status==="fulfilled")ts[name]=now;});
    setFetchTimestamps(ts);
    setPipelineHealth(computePipelineHealth(ts));

    setDataLoading(false);
    // ── Update teamSignalMap with fresh signal data for future clustering ──
    const freshMap={...teamSignalMap};
    if(pressR.status==="fulfilled"&&pressR.value){
      try{
        const pd=typeof pressR.value==="string"?JSON.parse(pressR.value.match(/\{[\s\S]*\}/)?.[0]||"{}"):pressR.value;
        if(homeTeam&&pd.home)freshMap[homeTeam]={...(freshMap[homeTeam]||{}),pressureAllowed:pd.home.pressureAllowed,pressureGenerated:pd.home.passRushWin};
        if(awayTeam&&pd.away)freshMap[awayTeam]={...(freshMap[awayTeam]||{}),pressureAllowed:pd.away.pressureAllowed,pressureGenerated:pd.away.passRushWin};
      }catch{}
    }
    if(cpoeR.status==="fulfilled"&&cpoeR.value){
      try{
        const cd=typeof cpoeR.value==="string"?JSON.parse(cpoeR.value.match(/\{[\s\S]*\}/)?.[0]||"{}"):cpoeR.value;
        if(homeTeam&&cd.home)freshMap[homeTeam]={...(freshMap[homeTeam]||{}),cpoe:cd.home.cpoe};
        if(awayTeam&&cd.away)freshMap[awayTeam]={...(freshMap[awayTeam]||{}),cpoe:cd.away.cpoe};
      }catch{}
    }
    if(olR.status==="fulfilled"&&olR.value){
      try{
        const od=typeof olR.value==="string"?JSON.parse(olR.value.match(/\{[\s\S]*\}/)?.[0]||"{}"):olR.value;
        if(homeTeam&&od.home)freshMap[homeTeam]={...(freshMap[homeTeam]||{}),olHealth:od.home.healthScore};
        if(awayTeam&&od.away)freshMap[awayTeam]={...(freshMap[awayTeam]||{}),olHealth:od.away.healthScore};
      }catch{}
    }
    // Feed DVOA into teamSignalMap for clustering
    if(dvoaData){
      if(homeTeam&&dvoaData.home)freshMap[homeTeam]={...(freshMap[homeTeam]||{}),offDVOA:dvoaData.home.offDVOA,defDVOA:dvoaData.home.defDVOA};
      if(awayTeam&&dvoaData.away)freshMap[awayTeam]={...(freshMap[awayTeam]||{}),offDVOA:dvoaData.away.offDVOA,defDVOA:dvoaData.away.defDVOA};
    }
    if(linesR.status==="fulfilled"&&linesR.value){
      try{
        const ld=typeof linesR.value==="string"?JSON.parse(linesR.value.match(/\{[\s\S]*\}/)?.[0]||"{}"):linesR.value;
        if(homeTeam&&ld.total){freshMap[homeTeam]={...(freshMap[homeTeam]||{}),avgTotal:parseFloat(ld.total)};if(awayTeam)freshMap[awayTeam]={...(freshMap[awayTeam]||{}),avgTotal:parseFloat(ld.total)};}
      }catch{}
    }
    if(Object.keys(freshMap).length>Object.keys(teamSignalMap).length||(homeTeam&&freshMap[homeTeam]!==teamSignalMap[homeTeam])){
      setTeamSignalMap(freshMap);
      // Re-run clustering silently if we have enough teams
      if(Object.keys(freshMap).length>=K_CLUSTERS){
        try{
          const updated=runClusteringPipeline(freshMap,backtestHistory);
          if(updated){setClusterResult(updated);try{await window.storage.set(CLUSTER_KEY,JSON.stringify({result:updated,signalMap:freshMap,updatedAt:new Date().toISOString()}));}catch{}}
        }catch{}
      }
    }
  }

  // ── Fetch helpers ─────────────────────────────────────────────────────────
  async function fetchStatsData(){return callClaude({useSearch:true,prompt:`Search 2025-26 NFL season stats for ${homeTeam} and ${awayTeam}: W-L, PPG, pts allowed/g, passing yds/g, rushing yds/g.\nONLY JSON: {"home":{"wins":N,"losses":N,"ppg":N,"papg":N,"passYds":N,"rushYds":N},"away":{...}}`});}
  function applyStats(text){try{const m=text.match(/\{[\s\S]*\}/);if(!m)throw new Error();const p=JSON.parse(m[0]);const s=v=>(v&&v!==0)?String(v):"";setHomeStats({wins:s(p.home?.wins),losses:s(p.home?.losses),ppg:s(p.home?.ppg),papg:s(p.home?.papg),passYds:s(p.home?.passYds),rushYds:s(p.home?.rushYds)});setAwayStats({wins:s(p.away?.wins),losses:s(p.away?.losses),ppg:s(p.away?.ppg),papg:s(p.away?.papg),passYds:s(p.away?.passYds),rushYds:s(p.away?.rushYds)});setStatsStatus("success");setHomeHL(true);setAwayHL(true);setTimeout(()=>{setHomeHL(false);setAwayHL(false);},3000);}catch{setStatsStatus("error");}}
  async function fetchInjuryData(){return callClaude({useSearch:true,prompt:`Current NFL injury report for ${homeTeam} and ${awayTeam}. Out/Doubtful/Questionable only.\nPlain text: "${homeTeam} Injuries:\n[Player] ([Pos]) — [Status] ([Injury])\n${awayTeam} Injuries:\n[Player] ([Pos]) — [Status] ([Injury])"`});}
  function applyInjuries(text){if(text.trim()){setInjuries(text.trim());setInjuryStatus("success");}else setInjuryStatus("error");}
  async function fetchFormRankData(){return callClaude({useSearch:true,maxTokens:1100,prompt:`Search 2025-26 NFL data for ${homeTeam} and ${awayTeam}: last 5 W/L+ATS, avg pts L5, streak, off/def rank, RZ%, 3rd down%.\nONLY JSON: {"form":{"home":{"results":[{"result":"W","ats":"C"},...],"l5Record":"3-2","l5ATS":"3-2","avgPtsL5":N,"streak":"W2","note":""},"away":{...}},"rankings":{"home":{"offRank":N,"defRank":N,"rzOff":N,"rzDef":N,"thirdOff":N,"thirdDef":N},"away":{...}}}`});}
  function applyFormRank(text){try{const m=text.match(/\{[\s\S]*\}/);if(!m)throw new Error();const p=JSON.parse(m[0]);if(p.form){setFormData(p.form);setFormStatus("success");}else setFormStatus("error");if(p.rankings){setRankData(p.rankings);setRankStatus("success");}else setRankStatus("error");}catch{setFormStatus("error");setRankStatus("error");}}
  async function fetchLinesData(){return callClaude({useSearch:true,maxTokens:900,prompt:`Search sportsbook lines for ${awayTeam} @ ${homeTeam}. Model lines.\nONLY JSON: {"awayScore":N,"homeScore":N,"spread":N,"favTeam":"full name","total":N,"totalLean":"over/under","awayML":"+/-NNN","homeML":"+/-NNN","spreadConfidence":"Low/Medium/High","totalConfidence":"Low/Medium/High","lineMove":{"open":"KC -3","current":"KC -4.5","sharpSide":"name","summary":"1 sentence"}}`});}
  function applyLines(text){try{const m=text.match(/\{[\s\S]*\}/);if(!m)throw new Error();const p=JSON.parse(m[0]);const{lineMove:lm,...lo}=p;setLines(lo);setLinesStatus("success");if(lm?.open)setLineMove(lm);}catch{setLinesStatus("error");}}
  async function fetchPressureData(){return callClaude({useSearch:true,maxTokens:800,prompt:`Search 2025-26 NFL pressure rate stats for ${homeTeam} and ${awayTeam}: pressure allowed%, pass rush win%, sack rate%, hurry rate%.\nONLY JSON: {"home":{"pressureAllowed":N,"passRushWin":N,"sackRate":N,"hurryRate":N,"note":""},"away":{...},"matchupEdge":"which team has pressure advantage and why","spreadImpact":N,"spreadAdjNote":""}`});}
  function applyPressure(text){try{const m=text.match(/\{[\s\S]*\}/);if(!m)throw new Error();setPressureData(JSON.parse(m[0]));setPressureStatus("success");}catch{setPressureStatus("error");}}
  async function fetchEnsembleData(){return callClaude({useSearch:true,maxTokens:800,prompt:`Search DraftKings, FanDuel, Caesars, BetMGM lines for ${awayTeam} @ ${homeTeam}.\nONLY JSON: {"books":[{"book":"DraftKings","spread":N,"favTeam":"full name","total":N},...],"favTeam":"consensus fav","sharpConsensus":"where sharp money is","exploit":"market edge or insight"}`});}
  function applyEnsemble(text){try{const m=text.match(/\{[\s\S]*\}/);if(!m)throw new Error();setEnsembleData(JSON.parse(m[0]));setEnsembleStatus("success");}catch{setEnsembleStatus("error");}}
  async function fetchOLData(){return callClaude({useSearch:true,maxTokens:900,prompt:`Search 2025-26 NFL OL data for ${homeTeam} and ${awayTeam}: starter availability, sack rate trend, PFF grade, run block rank, key OL injuries. OL Health Score 0-100.\nONLY JSON: {"home":{"healthScore":N,"startersOut":N,"sackRateTrend":"up/down/stable","avgPFFGrade":N,"runBlockRank":N,"keyInjuries":[],"note":""},"away":{...},"spreadImpact":"","totalImpact":""}`});}
  function applyOL(text){try{const m=text.match(/\{[\s\S]*\}/);if(!m)throw new Error();setOlData(JSON.parse(m[0]));setOlStatus("success");}catch{setOlStatus("error");}}
  async function fetchMicroData(){const ctx=STADIUM_CTX[homeTeam]||{};return callClaude({useSearch:true,maxTokens:800,prompt:`Search contextual factors for ${awayTeam} @ ${homeTeam}: travel distance/timezone, days rest each team, week spot, desperation, crowd advantage.\nONLY JSON: {"travelPenalty":"","travelColor":"#f59e0b","restEdge":"","restColor":"#4ade80","turfRisk":null,"weekSpot":"","desperationIndex":"","crowdAdvantage":null,"compositeAdj":N,"compositeNote":""}`});}
  function applyMicro(text){try{const m=text.match(/\{[\s\S]*\}/);if(!m)throw new Error();setMicroData(JSON.parse(m[0]));setMicroStatus("success");}catch{setMicroStatus("error");}}

  // ── NEW fetch helpers ─────────────────────────────────────────────────────
  async function fetchGarbageData(){return callClaude({useSearch:true,maxTokens:900,prompt:`Search 2025-26 NFL garbage-time stats for ${homeTeam} and ${awayTeam}. Garbage time = plays when win probability <10% or >90% with <5 min remaining. Find: raw PPG, points scored specifically in garbage time, adjusted PPG without garbage time, whether season stats are significantly contaminated.
ONLY JSON: {"home":{"rawPPG":N,"garbagePoints":N,"adjustedPPG":N,"contaminated":bool,"note":"1-line insight"},"away":{...},"spreadImpact":"how garbage-time inflation or deflation affects the model spread prediction","contaminated":bool}`});}
  function applyGarbage(text){try{const m=text.match(/\{[\s\S]*\}/);if(!m)throw new Error();setGarbageData(JSON.parse(m[0]));setGarbageStatus("success");}catch{setGarbageStatus("error");}}

  async function fetchLeverageData(){return callClaude({useSearch:true,maxTokens:900,prompt:`Search 2025-26 NFL luck/regression data for ${homeTeam} and ${awayTeam}. Find: turnover differential vs expected (fumble recovery rate, INT luck), EPA per drive, expected wins vs actual wins (pythagorean expectation), close game record (1-score games).
Luck score: +5 = very lucky, -5 = very unlucky. Based on fumble recovery %, turnover margin vs expected, close-game record.
ONLY JSON: {"home":{"luckScore":N,"turnoverLuck":N,"fumbleRecovery":N,"epaDrive":N,"regressedRecord":"e.g. 6-6","note":"1-line insight"},"away":{...},"regressionVerdict":"which team is over/underperforming their true talent level and why — key for parlay"}`});}
  function applyLeverage(text){try{const m=text.match(/\{[\s\S]*\}/);if(!m)throw new Error();setLeverageData(JSON.parse(m[0]));setLeverageStatus("success");}catch{setLeverageStatus("error");}}

  async function fetchCoachData(){return callClaude({useSearch:true,maxTokens:900,prompt:`Search 2025-26 NFL coaching aggressiveness data for ${homeTeam} and ${awayTeam} head coaches. Find: 4th down go rate (% of 4th down opportunities they go for it), 2-point conversion attempt rate, fake punt/FG rate, clock management tendencies.
Aggressiveness Index 0-100: 80+ = aggressive (goes for it, 2-pt, fake plays), 20- = conservative (always kicks, plays it safe).
ONLY JSON: {"home":{"coachName":"","aggressivenessIndex":N,"fourthDownGo":N,"twoPtRate":N,"trickPlayRate":N,"clockMgmt":"Good/Average/Poor","note":"1-line insight"},"away":{...},"matchupNote":"coaching style matchup edge — how aggressiveness mismatch affects close-game scenarios","spreadImpact":N,"spreadAdjNote":"why aggressiveness impacts the spread"}`});}
  function applyCoach(text){try{const m=text.match(/\{[\s\S]*\}/);if(!m)throw new Error();setCoachData(JSON.parse(m[0]));setCoachStatus("success");}catch{setCoachStatus("error");}}

  async function fetchCPOEData(){return callClaude({useSearch:true,maxTokens:900,prompt:`Search 2025-26 NFL CPOE (Completion Percentage Over Expected) stats for the starting QBs of ${homeTeam} and ${awayTeam}. CPOE measures how much better/worse a QB completes passes vs the expected completion rate based on depth of target, coverage, and receiver separation. Also find xEPA (expected EPA per play) and the opposing defense's CPOE allowed.
ONLY JSON: {"home":{"qbName":"","cpoe":N,"compPct":N,"expectedCompPct":N,"xEPA":N,"vsDefCPOE":N,"note":"1-line insight"},"away":{...},"matchupEdge":"which QB has the CPOE edge vs the opposing defense and why — be specific","totalImpact":N,"totalImpactNote":"how CPOE mismatch shifts the projected total"}`});}
  function applyCPOE(text){try{const m=text.match(/\{[\s\S]*\}/);if(!m)throw new Error();setCpoeData(JSON.parse(m[0]));setCpoeStatus("success");}catch{setCpoeStatus("error");}}

  // ── NEW: Home/Away splits ─────────────────────────────────────────────────
  async function fetchSplitsData(){return callClaude({useSearch:true,maxTokens:900,prompt:`Search 2025-26 NFL season home/away splits for ${homeTeam} and ${awayTeam}: home W-L record, home ATS record, away W-L, away ATS, home PPG, away PPG, home PAPG, away PAPG.
ONLY JSON: {"home":{"homeRecord":"W-L","homeATS":"W-L","awayRecord":"W-L","awayATS":"W-L","homePPG":N,"awayPPG":N,"homePAPG":N,"awayPAPG":N,"splitNote":"key insight about home/away split"},"away":{...},"spreadImpact":"how the home/away split affects this matchup spread"}`});}
  function applySplits(text){try{const m=text.match(/\{[\s\S]*\}/);if(!m)throw new Error();setSplitsData(JSON.parse(m[0]));setSplitsStatus("success");}catch{setSplitsStatus("error");}}

  // ── NEW: Referee profile ──────────────────────────────────────────────────
  async function fetchRefData(){return callClaude({useSearch:true,maxTokens:700,prompt:`Search for the assigned referee crew for ${awayTeam} @ ${homeTeam} this week in the 2025-26 NFL season. Find referee/crew chief name, their average total points per game officiated this season, average penalties per game, over/under rate for games they officiate, and any notable tendencies.
ONLY JSON: {"crewName":"","avgTotal":N,"penaltiesPerGame":N,"overRate":N,"yardsPerGame":N,"homeTeamATS":"55%","crewRank":N,"totalImpact":"how this crew affects the total for this game"}`});}
  function applyRef(text){try{const m=text.match(/\{[\s\S]*\}/);if(!m)throw new Error();setRefData(JSON.parse(m[0]));setRefStatus("success");}catch{setRefStatus("error");}}

  // ── NEW: Prime time performance ───────────────────────────────────────────
  async function fetchPrimeData(){return callClaude({useSearch:true,maxTokens:800,prompt:`Search for prime time game information for ${awayTeam} @ ${homeTeam}: is this a Thursday Night Football, Sunday Night Football, or Monday Night Football game? Find each team's prime time record ATS this season and career, average points scored in prime time, last 5 prime time game results.
ONLY JSON: {"isPrimeTime":bool,"gameType":"TNF/SNF/MNF or null","network":"NBC/ESPN/Prime Video or null","home":{"primeRecord":"W-L","primeATS":"W-L","avgPtsPT":N,"last5PT":"e.g. W W L W L","note":""},"away":{...},"atsNote":"overall prime time ATS insight for this matchup"}`});}
  function applyPrime(text){try{const m=text.match(/\{[\s\S]*\}/);if(!m)throw new Error();setPrimeData(JSON.parse(m[0]));setPrimeStatus("success");}catch{setPrimeStatus("error");}}

  // ── NEW: Multi-season regression ──────────────────────────────────────────
  async function fetchMultiSeasonData(){return callClaude({useSearch:true,maxTokens:900,prompt:`Search historical NFL data for ${homeTeam} and ${awayTeam} over the last 3 seasons (2022-23, 2023-24, 2024-25). Calculate a weighted win percentage (most recent season 50% weight, prior 30%, 2 seasons ago 20%), weighted ATS percentage, 3-year average PPG and PAPG, and true talent rank 1-32. Identify team trajectory trend.
ONLY JSON: {"home":{"weightedWinPct":N,"weightedAtsPct":N,"avgPPG3yr":N,"avgPAPG3yr":N,"trueTalentRank":N,"trend":"improving/declining/stable","note":"key multi-season insight"},"away":{...},"baselineNote":"how multi-season baseline changes the prediction vs single-season view"}`});}
  function applyMulti(text){try{const m=text.match(/\{[\s\S]*\}/);if(!m)throw new Error();setMultiData(JSON.parse(m[0]));setMultiStatus("success");}catch{setMultiStatus("error");}}

  // ── NEW: Situational ATS ──────────────────────────────────────────────────
  async function fetchSituationalData(){return callClaude({useSearch:true,maxTokens:1000,prompt:`Search historical ATS records for ${homeTeam} and ${awayTeam} in specific situations over the last 3 seasons: off bye week, as home underdog, divisional games, short rest (<6 days), after straight-up loss, prime time, and cold weather games. Include W-L record and ATS percentage for each situation.
ONLY JSON: {"home":{"offByeATS":"58%","offByeRecord":"7-5","homeDogATS":"62%","homeDogRecord":"5-3","divisionalATS":"51%","divisionalRecord":"12-11","shortRestATS":"44%","shortRestRecord":"4-5","afterLossATS":"53%","afterLossRecord":"16-14","primeTimeATS":"55%","primeTimeRecord":"6-5","coldWeatherATS":"60%","coldWeatherRecord":"6-4"},"away":{...}}`});}
  function applySituational(text){try{const m=text.match(/\{[\s\S]*\}/);if(!m)throw new Error();setSituationalData(JSON.parse(m[0]));setSituationalStatus("success");}catch{setSituationalStatus("error");}}

  // ── Advanced efficiency signals ───────────────────────────────────────────
  async function fetchAdvancedData(){
    return callClaude({useSearch:true,maxTokens:1000,
      prompt:"Search for the 2025-26 NFL season advanced stats for "+homeTeam+" and "+awayTeam+". Find: red zone touchdown percentage (TD%), red zone trips per game, red zone touchdowns allowed %, third down conversion rate (offense), third down conversion rate allowed (defense), offensive plays per game (pace), average seconds per snap, turnover differential, forced fumbles, interceptions forced, EPA per dropback for each starting QB, EPA per dropback rank."+
      "\nONLY JSON: {\"home\":{\"rzTdPct\":N,\"rzAllowedPct\":N,\"rzTripsPerGame\":N,\"thirdDownPct\":N,\"thirdDownAllowed\":N,\"playsPerGame\":N,\"secondsPerSnap\":N,\"timeOfPoss\":N,\"turnoverDiff\":N,\"forcedFumbles\":N,\"interceptions\":N,\"epaPerDropback\":N,\"epaRank\":N},\"away\":{...},\"matchupNote\":\"one sentence on what these efficiency stats mean for the total\"}"
    });
  }
  function applyAdvanced(text){
    try{
      const m=text.match(/\{[\s\S]*\}/);
      if(!m)throw new Error();
      setAdvancedData(JSON.parse(m[0]));
      setAdvancedStatus("success");
    }catch{setAdvancedStatus("error");}
  }

  // ── Auto weather forecast ─────────────────────────────────────────────────
  async function fetchWeatherForecast(team){
    const stadium=OUTDOOR_STADIUMS[team];
    if(!stadium)return;
    setForecastLoading(true);setForecastData(null);setWeatherSeverity(null);
    try{
      const text=await callClaude({useSearch:true,maxTokens:600,prompt:`Search for the weather forecast for ${stadium.city} on game day for the upcoming NFL game at ${team}'s stadium. Find the temperature in Fahrenheit, wind speed in mph, and precipitation probability for Sunday (or game day).
ONLY JSON: {"location":"${stadium.city}","tempF":N,"windMph":N,"precipPct":N,"description":"e.g. Partly cloudy, 42°F","icon":"emoji weather icon","suggested":"dome/ideal/cold/wind/rain","reasoning":"why this weather category"}
Rules: cold=temp<35F. wind=windMph>=20. rain=precipPct>=40. ideal=everything else. dome only for indoor stadiums.`});
      const m=text.match(/\{[\s\S]*\}/);
      if(m){
        const fd=JSON.parse(m[0]);
        setForecastData(fd);
        // Compute continuous severity score from raw forecast data
        if(fd.tempF!=null&&fd.windMph!=null&&fd.precipPct!=null){
          const sev=calcWeatherSeverity(fd.tempF,fd.windMph,fd.precipPct);
          setWeatherSeverity(sev);
          // Auto-apply the most accurate category
          if(sev.category&&sev.severity>8) setWeather(sev.category);
        }
      }
    }catch(e){console.error("Weather forecast failed",e);}
    setForecastLoading(false);
  }

  // ── Head-to-Head history fetch ────────────────────────────────────────────
  async function fetchH2H(){
    if(!homeTeam||!awayTeam)return;
    setH2hLoading(true);setH2hData(null);
    try{
      const text=await callClaude({useSearch:true,maxTokens:1000,prompt:`Search for the all-time head-to-head history between ${homeTeam} and ${awayTeam} in the NFL regular season and playoffs over the last 10 years. Find: overall record, ATS record, average total points scored, home team winning percentage, and list the last 5 matchups with scores.
ONLY JSON:
{"gamesAnalyzed":N,"homeSU":"W-L","favTeamLabel":"${abb(homeTeam)}","atsPct":N,"atsRecord":"W-L","totalRecord":"OVER W-UNDER L","avgMargin":"X.X","avgTotal":"X.X","homeAts":"XX%","awayAts":"XX%","pattern":"One key matchup insight e.g. Bills are 7-2 ATS at home vs Dolphins since 2019","lastFive":[{"date":"Nov 2024","score":"${abb(homeTeam)} 27-17 ${abb(awayTeam)}","margin":"+10","coverTeam":true,"coverResult":"${abb(homeTeam)} covered -6"}],"note":"Any notable trend or context about this rivalry"}`});
      const m=text.match(/\{[\s\S]*\}/);
      if(m)setH2hData(JSON.parse(m[0]));
    }catch(e){console.error("H2H fetch failed",e);}
    setH2hLoading(false);
  }

  // ── Opponent-adjusted stats fetch ─────────────────────────────────────────
  // ── DVOA fetch — Football Outsiders weekly data ─────────────────────────
  async function fetchDVOA(){
    if(!homeTeam||!awayTeam)return;
    setDvoaLoading(true);setDvoaData(null);
    try{
      const text=await callClaude({useSearch:true,maxTokens:900,prompt:"Search for the current NFL DVOA ratings from Football Outsiders (footballoutsiders.com) for "+homeTeam+" and "+awayTeam+". Find their offensive DVOA percentage, defensive DVOA percentage, total DVOA, and NFL rank for each. Also find their week-over-week trend (improving/declining/stable).\nONLY JSON:\n{\"week\":\"Week N\",\"home\":{\"team\":\""+homeTeam+"\",\"offDVOA\":N,\"defDVOA\":N,\"totalDVOA\":N,\"offRank\":N,\"defRank\":N,\"trend\":\"improving/declining/stable\"},\"away\":{\"team\":\""+awayTeam+"\",\"offDVOA\":N,\"defDVOA\":N,\"totalDVOA\":N,\"offRank\":N,\"defRank\":N,\"trend\":\"improving/declining/stable\"},\"matchupNote\":\"One sentence on what the DVOA matchup means for this game\"}"});
      const m=text.match(/\{[\s\S]*\}/);
      if(m){
        const d=JSON.parse(m[0]);
        setDvoaData(d);
        try{await window.storage.set(DVOA_KEY,JSON.stringify({data:d,fetchedAt:new Date().toISOString(),homeTeam,awayTeam}));}catch{}
      }
    }catch(e){console.error("DVOA fetch failed",e);}
    setDvoaLoading(false);
  }

  // ── Fetch schematic data and run clustering pipeline ──────────────────────
  async function fetchSchematicData(){
    setFetchingSchematic(true);
    try{
      const text=await callClaude({useSearch:true,maxTokens:2200,prompt:`Search for current 2025-26 NFL season team statistics for ALL 32 teams. For each team find:
- Pass yards per game (offense)
- Rush yards per game (offense)
- Points scored per game (PPG)
- Points allowed per game (PAPG)
- Pressure rate allowed by their OL (% of dropbacks where QB was pressured)
- Pass rush win rate (how often their DL beats the block in 2.5 seconds)
- QB CPOE (completion percentage over expected, positive=above average)
- OL health score estimate 0-100 (100=fully healthy)
- Average game total when they play (over/under environment)

Return ONLY JSON (no markdown, all 32 teams):
{
  "season":"2025-26",
  "teams":{
    "Arizona Cardinals":{"passYds":215,"rushYds":105,"ppg":20,"papg":26,"pressureAllowed":32,"pressureGenerated":40,"cpoe":-2,"olHealth":72,"avgTotal":43},
    "Atlanta Falcons":{...},
    "Baltimore Ravens":{...},
    "Buffalo Bills":{...},
    "Carolina Panthers":{...},
    "Chicago Bears":{...},
    "Cincinnati Bengals":{...},
    "Cleveland Browns":{...},
    "Dallas Cowboys":{...},
    "Denver Broncos":{...},
    "Detroit Lions":{...},
    "Green Bay Packers":{...},
    "Houston Texans":{...},
    "Indianapolis Colts":{...},
    "Jacksonville Jaguars":{...},
    "Kansas City Chiefs":{...},
    "Las Vegas Raiders":{...},
    "Los Angeles Chargers":{...},
    "Los Angeles Rams":{...},
    "Miami Dolphins":{...},
    "Minnesota Vikings":{...},
    "New England Patriots":{...},
    "New Orleans Saints":{...},
    "New York Giants":{...},
    "New York Jets":{...},
    "Philadelphia Eagles":{...},
    "Pittsburgh Steelers":{...},
    "San Francisco 49ers":{...},
    "Seattle Seahawks":{...},
    "Tampa Bay Buccaneers":{...},
    "Tennessee Titans":{...},
    "Washington Commanders":{...}
  }
}`});
      const m=text.match(/\{[\s\S]*\}/);
      if(!m)throw new Error("No JSON");
      const data=JSON.parse(m[0]);
      const signalMap=data.teams||{};
      // Run K-Means++ clustering pipeline
      const result=runClusteringPipeline(signalMap,backtestHistory);
      if(result){
        setClusterResult(result);
        setTeamSignalMap(signalMap);
        try{await window.storage.set(CLUSTER_KEY,JSON.stringify({result,signalMap,updatedAt:new Date().toISOString()}));}catch{}
      }
    }catch(e){console.error("Clustering failed",e);}
    setFetchingSchematic(false);
  }

  // ── Weekly Execution Phase Handlers ──────────────────────────────────────
  async function markPhaseComplete(phaseId){
    const wk=getWeekKey();
    const updated={...completedPhases,[wk]:{...(completedPhases[wk]||{}),[phaseId]:new Date().toISOString()}};
    setCompletedPhases(updated);
    try{await window.storage.set(SCHEDULE_KEY,JSON.stringify(updated));}catch{}
  }

  // Phase 1 — Tuesday 9:00 AM: Fetch & Harmonize
  async function executePhase1(){
    setPhase1Running(true);
    try{
      // 1. Fetch schematic data + re-cluster all 32 teams
      await fetchSchematicData();
      // 2. Auto-mark complete
      await markPhaseComplete("P1");
    }catch(e){console.error("Phase 1 failed",e);}
    setPhase1Running(false);
  }

  // Phase 2 — Thursday 4:00 PM: Context & Roster Adjustments
  async function executePhase2(){
    setPhase2Running(true);
    try{
      // Re-fetch injury/ref/splits data for the current matchup
      if(homeTeam&&awayTeam){
        const [injR,refR,splitsR]=await Promise.allSettled([
          fetchInjuryData(), fetchRefData(), fetchSplitsData()
        ]);
        if(injR.status==="fulfilled")  applyInjuries(injR.value);
        if(refR.status==="fulfilled")  applyRef(refR.value);
        if(splitsR.status==="fulfilled")applySplits(splitsR.value);
      }
      await markPhaseComplete("P2");
    }catch(e){console.error("Phase 2 failed",e);}
    setPhase2Running(false);
  }

  // Phase 3 — Friday 3:00 PM: Multi-Model Ensemble
  async function executePhase3(){
    setPhase3Running(true);
    try{
      // Run full signal stack for current matchup
      if(homeTeam&&awayTeam) await loadAllData();
      // Auto-trigger Weekly Pick scanner to evaluate full slate
      // This pre-populates the best bet and surfaces top games for pending
      const wpBtn=document.querySelector('[data-weekly-pick-fetch]');
      if(wpBtn) wpBtn.click();
      await markPhaseComplete("P3");
    }catch(e){console.error("Phase 3 failed",e);}
    setPhase3Running(false);
  }

  // Phase 4 — Sunday 10:00 AM: Market Arbitration & Line Shopping
  async function executePhase4(){
    setPhase4Running(true);
    try{
      // Fresh lines + ensemble from all 6 books
      if(homeTeam&&awayTeam){
        const [linesR,ensR]=await Promise.allSettled([fetchLinesData(),fetchEnsembleData()]);
        if(linesR.status==="fulfilled") applyLines(linesR.value);
        if(ensR.status==="fulfilled")   applyEnsemble(ensR.value);
      }
      await markPhaseComplete("P4");
    }catch(e){console.error("Phase 4 failed",e);}
    setPhase4Running(false);
  }
  // ── Schedule spot fetch ───────────────────────────────────────────────────
  async function fetchScheduleSpot(){
    if(!homeTeam||!awayTeam)return;
    setScheduleSpotLoading(true);setScheduleSpotData(null);
    try{
      const text=await callClaude({useSearch:true,maxTokens:700,
        prompt:"Search for the schedule situation for the upcoming NFL game "+awayTeam+" at "+homeTeam+" this week. Find: days of rest for each team, is either team on a short week (Thursday game), did either team have a bye last week, is either team on a second consecutive road game, is this a divisional rivalry game, is this game a potential trap game (big favorite between two tough opponents), any cross-country travel disadvantage, any revenge game situation."+
        "\nONLY JSON: {\"home\":{\"daysRest\":N,\"flags\":[\"SHORT_WEEK\"|\"LONG_REST\"|\"ROAD_TRIP\"|\"BACK_TO_BACK\"|\"TRAP_GAME\"|\"DIVISIONAL\"|\"PRIMETIME\"|\"REVENGE\"]},\"away\":{\"daysRest\":N,\"flags\":[...]},\"note\":\"Brief situation summary\"}"
      });
      const m=text.match(/\{[\s\S]*\}/);
      if(m)setScheduleSpotData(JSON.parse(m[0]));
    }catch(e){console.error("ScheduleSpot failed",e);}
    setScheduleSpotLoading(false);
  }

  // ── Public betting % fetch ────────────────────────────────────────────────
  async function fetchPublicPct(){
    if(!homeTeam||!awayTeam)return;
    setPublicLoading(true);setPublicData(null);
    try{
      const text=await callClaude({useSearch:true,maxTokens:700,
        prompt:"Search Action Network or ESPN BET or Covers.com for public betting percentages for the NFL game "+awayTeam+" at "+homeTeam+" this week. Find the percentage of bets on each side for spread, total, and moneyline."+
        "\nONLY JSON: {\"spread\":{\"favTeam\":\"full team name\",\"favPct\":N,\"lineMove\":\"fav/dog/none\",\"odds\":\"-110\"},\"total\":{\"overTeam\":\"Over\",\"overPct\":N,\"odds\":\"-110\"},\"moneyline\":{\"favTeam\":\"full team name\",\"favPct\":N,\"odds\":\"-150\"},\"sharpNote\":\"Reverse line movement or sharp money signal — null if none\"}"
      });
      const m=text.match(/\{[\s\S]*\}/);
      if(m)setPublicData(JSON.parse(m[0]));
    }catch(e){console.error("PublicPct failed",e);}
    setPublicLoading(false);
  }

  async function addUnit(entry){
    const newH=[entry,...unitHistory].slice(0,500);
    setUnitHistory(newH);
    try{await window.storage.set(UNITS_KEY,JSON.stringify(newH));}catch{}
  }
  async function clearUnits(){
    setUnitHistory([]);
    try{await window.storage.delete(UNITS_KEY);}catch{}
  }

  // ── Auto-fetch all pending game results ───────────────────────────────────
  async function fetchAllResults(){
    if(!pendingGames.length||fetchingResults) return;
    setFetchingResults(true);
    const remaining=[...pendingGames];
    const completed=[];

    for(let i=0;i<remaining.length;i++){
      const g=remaining[i];
      setFetchProgress(`${abb(g.awayTeam)} @ ${abb(g.homeTeam)} (${i+1}/${remaining.length})`);
      try{
        const score=await fetchFinalScore(g.awayTeam,g.homeTeam,g.analyzedAt);
        if(score.found){
          // Calculate ATS and total results
          const hScore=parseFloat(score.homeScore),aScore=parseFloat(score.awayScore);
          const sp=parseFloat(g.modelSpread||0);
          const margin=hScore-aScore;
          const atsCover=(margin+sp)>0.5,atsPush=Math.abs(margin+sp)<=0.5;
          const actualTotal=hScore+aScore,projTotal=parseFloat(g.modelTotal||44);
          const totOver=actualTotal>projTotal;
          const totCorrect=totOver===(g.modelTotalLean?.toUpperCase()==="OVER");
          // Auto-log to backtest
          const resultEntry={
            homeTeam:g.homeTeam,awayTeam:g.awayTeam,
            confidence:g.confidence,
            modelSpread:sp,actualMargin:margin,
            projTotal,actualTotal,
            spreadCorrect:atsCover&&!atsPush,
            totalCorrect:totCorrect,
            atsResult:atsCover?"COVER":atsPush?"PUSH":"NO COVER",
            totalResult:totOver?"OVER":"UNDER",
            date:score.gameDate||g.analyzedAt,
            actualScoreStr:`${abb(g.awayTeam)} ${aScore} – ${hScore} ${abb(g.homeTeam)}`,
            autoFetched:true,
          };
          await addBacktestResult(resultEntry);
          // Auto-log to bankroll if bet was tracked pre-game
          if(g.isBet && g.betUnits > 0){
            const dec = americanToDecimal(g.betOdds)||1.909;
            const wonUnits = resultEntry.spreadCorrect ? parseFloat((g.betUnits*(dec-1)).toFixed(2)) : resultEntry.atsResult==="PUSH" ? 0 : -g.betUnits;
            await addUnit({
              units:g.betUnits, odds:g.betOdds, decimal:dec, result:resultEntry.spreadCorrect?"WIN":resultEntry.atsResult==="PUSH"?"PUSH":"LOSS",
              unitsWon:wonUnits, note:abb(g.awayTeam)+"@"+abb(g.homeTeam)+" (auto)",
              date:resultEntry.date, autoLogged:true,
            });
          }
          completed.push(g.awayTeam+"|"+g.homeTeam);
        }
      }catch(e){console.error("fetchResult failed",g.awayTeam,"@",g.homeTeam,e);}
      // Small delay to avoid rate limiting
      if(i<remaining.length-1) await new Promise(r=>setTimeout(r,800));
    }

    // Remove successfully fetched games from pending
    const stillPending=remaining.filter(g=>!completed.includes(g.awayTeam+"|"+g.homeTeam));
    setPendingGames(stillPending);
    try{await window.storage.set(PENDING_KEY,JSON.stringify(stillPending));}catch{}
    setFetchingResults(false);
    setFetchProgress("");
  }

  async function dismissPending(index){
    const updated=pendingGames.filter((_,i)=>i!==index);
    setPendingGames(updated);
    try{await window.storage.set(PENDING_KEY,JSON.stringify(updated));}catch{}
  }

  // ── Deep analysis ────────────────────────────────────────────────────────
  async function runAnalysis(){
    if(!homeTeam||!awayTeam)return;
    setLoading(true);setGameResult(null);setError(null);
    const bs=(t,s)=>{const p=[];if(s.wins||s.losses)p.push(`${s.wins}W-${s.losses}L`);if(s.ppg)p.push(`PPG:${s.ppg}`);if(s.papg)p.push(`PAPG:${s.papg}`);if(s.passYds)p.push(`Pass:${s.passYds}`);if(s.rushYds)p.push(`Rush:${s.rushYds}`);return p.length?`${t}: ${p.join(", ")}`:t;};
    const fd=(t,k)=>{const d=formData?.[k];return d?`${t} L5:${d.l5Record} ATS:${d.l5ATS} Streak:${d.streak} AvgPts:${d.avgPtsL5}`:""};
    const rd=(t,k)=>{const d=rankData?.[k];return d?`${t} Off#${d.offRank} Def#${d.defRank} RZOff:${d.rzOff}% 3rdOff:${d.thirdOff}%`:""};
    const lc=lines?`Lines: ${abb(lines.favTeam||"")} -${lines.spread} O/U:${lines.total}(${lines.totalLean}) ML:${abb(awayTeam)}${lines.awayML}/${abb(homeTeam)}${lines.homeML}`:"";
    const lm=lineMove?`LineMove: ${lineMove.open}→${lineMove.current} Sharp:${lineMove.sharpSide}`:"";
    // ── Weather severity (continuous scale replaces binary) ───────────────
    const adjWeather  = weatherAdjustWithSeverity(weather, weatherSeverity);
    const adj         = adjWeather;
    const weatherCtx  = weatherSeverity
      ? "WEATHER SEVERITY "+weatherSeverity.severity+"/100 ("+weatherSeverity.label+"): totalAdj="+weatherSeverity.totalAdj+" spreadAdj="+weatherSeverity.spreadAdj+" | Temp="+weatherSeverity.components.tempScore+" Wind="+weatherSeverity.components.windScore+" Precip="+weatherSeverity.components.precipScore
      : "";
    // ── H2H and OppAdj context ────────────────────────────────────────────
    const h2hCtx = h2hData
      ? "H2H HISTORY ("+h2hData.gamesAnalyzed+" games): "+abb(homeTeam)+" SU="+h2hData.homeSU+" ATS="+h2hData.atsRecord+" ("+h2hData.atsPct+"% cover) AvgTotal="+h2hData.avgTotal+" Pattern: "+h2hData.pattern
      : "";
    const dvoaCtx = dvoaData
      ? "DVOA (Football Outsiders): "+abb(homeTeam)+" Off="+dvoaData.home?.offDVOA+"% (#"+dvoaData.home?.offRank+") Def="+dvoaData.home?.defDVOA+"% (#"+dvoaData.home?.defRank+") Total="+dvoaData.home?.totalDVOA+"% trend="+dvoaData.home?.trend+". "+abb(awayTeam)+" Off="+dvoaData.away?.offDVOA+"% (#"+dvoaData.away?.offRank+") Def="+dvoaData.away?.defDVOA+"% (#"+dvoaData.away?.defRank+") trend="+dvoaData.away?.trend+". Spread adj="+dvoaToSpreadAdj(dvoaData.home?.offDVOA,dvoaData.home?.defDVOA,dvoaData.away?.offDVOA,dvoaData.away?.defDVOA)+"pts. "+dvoaData.matchupNote
      : "";
    // ── Advanced efficiency context ────────────────────────────────────────
    const advAdj = advancedData ? calcAdvancedTotalAdj(advancedData.home, advancedData.away) : null;
    const toSumm = advancedData ? calcTurnoverLuck(advancedData.home, advancedData.away) : null;
    const advancedCtx = advancedData
      ? "ADVANCED EFFICIENCY: "+abb(homeTeam)+" RZ TD%="+advancedData.home?.rzTdPct+"% 3rdDown%="+advancedData.home?.thirdDownPct+"% Pace="+advancedData.home?.playsPerGame+"plays/g EPA/db="+advancedData.home?.epaPerDropback+". "+abb(awayTeam)+" RZ TD%="+advancedData.away?.rzTdPct+"% 3rdDown%="+advancedData.away?.thirdDownPct+"% Pace="+advancedData.away?.playsPerGame+"plays/g EPA/db="+advancedData.away?.epaPerDropback+". Total adj="+advAdj?.total+"pts (RZ:"+advAdj?.rz+" 3rd:"+advAdj?.thirdDown+" Pace:"+advAdj?.pace+"). TO luck: "+abb(homeTeam)+"="+toSumm?.homeLuck+" "+abb(awayTeam)+"="+toSumm?.awayLuck+". "+advancedData.matchupNote
      : "";
    // ── Elo / Schedule Spot / Public % context ────────────────────────────
    const homeEloR = eloRatings[homeTeam]||1500, awayEloR = eloRatings[awayTeam]||1500;
    const eloCtx = (homeEloR!==1500||awayEloR!==1500)
      ? "ELO RATINGS: "+abb(homeTeam)+"="+homeEloR+" "+abb(awayTeam)+"="+awayEloR+" spreadAdj="+eloToSpreadAdj(homeEloR,awayEloR)+"pts homeWinProb="+eloWinProb(homeEloR,awayEloR)+"%"
      : "";
    const scheduleCtx = scheduleSpotData
      ? "SCHEDULE SPOT: "+abb(homeTeam)+" flags=["+( scheduleSpotData.home?.flags||[]).join(",")+"] "+abb(awayTeam)+" flags=["+(scheduleSpotData.away?.flags||[]).join(",")+"] "+scheduleSpotData.note
      : "";
    const publicCtx = publicData
      ? "PUBLIC BETTING %: Spread="+abb(publicData.spread?.favTeam||homeTeam)+" "+publicData.spread?.favPct+"% public lineMove="+publicData.spread?.lineMove+". Total=Over "+publicData.total?.overPct+"%. "+( publicData.sharpNote||"No RLM detected")
      : "";
    const logitWP=lines?spreadToWinProb(lines.spread,lines.favTeam,homeTeam):{homeWin:50,awayWin:50};
    const pressCtx=pressureData?`PRESSURE: ${abb(awayTeam)} pressure allowed:${pressureData.away?.pressureAllowed||"?"}% vs ${abb(homeTeam)} rush win:${pressureData.home?.passRushWin||"?"}%. Edge:${pressureData.matchupEdge||""} Adj:${pressureData.spreadImpact||0}pts`:"";
    const ensCtx=ensembleData?`MARKET: Consensus ${ensembleData.favTeam?abb(ensembleData.favTeam):""}-${(()=>{const b=ensembleData.books||[];return b.length?(b.reduce((s,b)=>s+(b.spread||0),0)/b.length).toFixed(1):"?"})()}. Sharp:${ensembleData.sharpConsensus||""}`:"";
    const olCtx=olData?`OL: ${abb(homeTeam)} health:${olData.home?.healthScore||"?"} (${olData.home?.startersOut||0} out). ${abb(awayTeam)} health:${olData.away?.healthScore||"?"} (${olData.away?.startersOut||0} out). ${olData.spreadImpact||""}`:"";
    const microCtx=microData?`MICRO: Travel:${microData.travelPenalty||"N/A"}. Rest:${microData.restEdge||"N/A"}. Week:${microData.weekSpot||""}. Adj:${microData.compositeAdj||0}pts`:"";
    const garbCtx=garbageData?`GARBAGE-TIME FILTER: ${abb(homeTeam)} adj PPG:${garbageData.home?.adjustedPPG||"?"}(raw:${garbageData.home?.rawPPG||"?"},${garbageData.home?.contaminated?"CONTAMINATED":"clean"}). ${abb(awayTeam)} adj PPG:${garbageData.away?.adjustedPPG||"?"}(${garbageData.away?.contaminated?"CONTAMINATED":"clean"}). ${garbageData.spreadImpact||""}`:"";
    const levCtx=leverageData?`LUCK REGRESSION: ${abb(homeTeam)} luck:${leverageData.home?.luckScore||0}(EPA/drive:${leverageData.home?.epaDrive||"?"},fumbleRec:${leverageData.home?.fumbleRecovery||"?"}%,regressed:${leverageData.home?.regressedRecord||"?"}). ${abb(awayTeam)} luck:${leverageData.away?.luckScore||0}(regressed:${leverageData.away?.regressedRecord||"?"}). Verdict:${leverageData.regressionVerdict||""}`:"";
    const coachCtx=coachData?`COACHING INDEX: ${abb(homeTeam)} coach:${coachData.home?.coachName||"?"} aggr:${coachData.home?.aggressivenessIndex||"?"}/100(4th:${coachData.home?.fourthDownGo||"?"}%,2pt:${coachData.home?.twoPtRate||"?"}%). ${abb(awayTeam)} coach:${coachData.away?.coachName||"?"} aggr:${coachData.away?.aggressivenessIndex||"?"}/100. Matchup:${coachData.matchupNote||""} Adj:${coachData.spreadImpact||0}pts`:"";
    const cpoeCtx=cpoeData?`CPOE: ${abb(homeTeam)} QB ${cpoeData.home?.qbName||""} CPOE:${cpoeData.home?.cpoe||"?"} vs def. ${abb(awayTeam)} QB ${cpoeData.away?.qbName||""} CPOE:${cpoeData.away?.cpoe||"?"}. Edge:${cpoeData.matchupEdge||""} Total impact:${cpoeData.totalImpact||0}pts`:"";
    const logitCtx=`LOGIT TRANSFORM: Market implies ${abb(homeTeam)} ${logitWP.homeWin}% win prob from spread. Compare to model output for divergence signal.`;
    const splitsCtx=splitsData?`HOME/AWAY SPLITS: ${abb(homeTeam)} home record:${splitsData.home?.homeRecord||"?"} ATS:${splitsData.home?.homeATS||"?"}. ${abb(awayTeam)} away record:${splitsData.away?.awayRecord||"?"} ATS:${splitsData.away?.awayATS||"?"}. ${splitsData.spreadImpact||""}`:"";
    // ── Sportsbook profiling context ──────────────────────────────────────
    const bookList=ensembleData?.books||[];
    const truePrice=calcTrueMarketPrice(bookList);
    const sharpGaps=detectSharpLineGaps(bookList,lines);
    const _gapStr=sharpGaps.length?"Sharp-line gaps detected: "+sharpGaps.slice(0,2).map(g=>g.softBook+" "+g.gap+"pts soft vs "+g.sharpBook).join(", ")+" — soft book hasn't adjusted yet.":"Books efficient — no exploitable gaps.";
    const bookCtx=bookList.length?"SPORTSBOOK PROFILING: True market price (Score-weighted)="+(truePrice?"-"+truePrice:"N/A")+". "+_gapStr:"";
    // ── GNN Roster Interdependency context ────────────────────────────────
    const homeGNN   = runRosterGNN(injuries, pressureData, olData, cpoeData, "home");
    const awayGNN   = runRosterGNN(injuries, pressureData, olData, cpoeData, "away");
    const gnnSpreadAdj = rosterToSpreadAdj(homeGNN.integrityScore, awayGNN.integrityScore);
    const homeCovKey   = detectCoverageScheme(pressureData, cpoeData, ensembleData);
    const homeCov      = COVERAGE_SCHEMES[homeCovKey];
        const gnnCascadeStr = homeGNN.cascades.length ? " Cascades: "+homeGNN.cascades.slice(0,3).map(c=>c.pos+" "+Math.round(c.rawScore*100)+"->"+Math.round(c.gnnScore*100)).join(", ")+"." : "";
    const gnnCtx = "GNN ROSTER INTEGRITY (2-round GCN): "+abb(homeTeam)+"="+homeGNN.integrityScore+"/100 "+abb(awayTeam)+"="+awayGNN.integrityScore+"/100. Net adj="+(gnnSpreadAdj>0?"+":"")+gnnSpreadAdj+"pts."+gnnCascadeStr+" Coverage: "+(homeCov?.label||"")+" (pass"+(homeCov?.passAdj>0?"+":"")+Math.round((homeCov?.passAdj||0)*100)+"% WR1"+(homeCov?.wr1Adj>0?"+":"")+Math.round((homeCov?.wr1Adj||0)*100)+"%).";
    const refCtx=refData?`REFEREE CREW: ${refData.crewName||"Unknown"} avg total:${refData.avgTotal||"?"} penalties/g:${refData.penaltiesPerGame||"?"} over rate:${refData.overRate||"?"}%. ${refData.totalImpact||""}`:"";
    const primeCtx=primeData?.isPrimeTime?`PRIME TIME (${primeData.gameType||""}): ${abb(homeTeam)} PT ATS:${primeData.home?.primeATS||"?"} ${primeData.home?.last5PT||""}. ${abb(awayTeam)} PT ATS:${primeData.away?.primeATS||"?"}. ${primeData.atsNote||""}`:"";
    const multiCtx=multiData?`MULTI-SEASON BASELINE: ${abb(homeTeam)} weighted win%:${multiData.home?.weightedWinPct||"?"}% ATS%:${multiData.home?.weightedAtsPct||"?"}% rank:#${multiData.home?.trueTalentRank||"?"} trend:${multiData.home?.trend||"?"}. ${abb(awayTeam)} weighted win%:${multiData.away?.weightedWinPct||"?"}% ATS%:${multiData.away?.weightedAtsPct||"?"}% rank:#${multiData.away?.trueTalentRank||"?"}. ${multiData.baselineNote||""}`:"";
    const sitCtx=situationalData?`SITUATIONAL ATS: ${abb(homeTeam)} off-bye:${situationalData.home?.offByeATS||"?"} div:${situationalData.home?.divisionalATS||"?"} home-dog:${situationalData.home?.homeDogATS||"?"}. ${abb(awayTeam)} away-short-rest:${situationalData.away?.shortRestATS||"?"} after-loss:${situationalData.away?.afterLossATS||"?"}`:"";
    // ── Build learning context from model's history ───────────────────────
    const fp=fingerprintGame({weather,lines,primeData,multiData},{homeTeam,awayTeam});
    const pr=lookupPatterns(fp,patternMemory);
    setCurrentFingerprint(fp); setPatternResult(pr);
    const tb=computeTeamBias(backtestHistory);
    setTeamBias(tb);
    const learningCtx=buildLearningContext(learnedWeights,pr,tb,backtestHistory,homeTeam,awayTeam);
    // ── Schematic archetype matchup context ───────────────────────────────
    const homeArch=clusterResult?.teamArchetypes?.[homeTeam];
    const awayArch=clusterResult?.teamArchetypes?.[awayTeam];
    const archTend=homeArch&&awayArch?getMatchupTendency(homeArch,awayArch):null;
    const clusterCtx=archTend?`SCHEMATIC ARCHETYPES (K-Means++ clustering, K=${K_CLUSTERS}): ${abb(awayTeam)}=${ARCHETYPES[awayArch]?.label||awayArch} offense vs ${abb(homeTeam)}=${ARCHETYPES[homeArch]?.label||homeArch} defense. Historical tendency: spreadAdj=${archTend.spreadAdj>0?"+":""}${archTend.spreadAdj} totalAdj=${archTend.totalAdj>0?"+":""}${archTend.totalAdj} — ${archTend.note}`:"SCHEMATIC ARCHETYPES: Run clustering for matchup-type adjustment.";
    const divNote=isDivisional(homeTeam,awayTeam)?`DIVISIONAL (${getDivision(homeTeam)})`:"";
    const existingLegs=parlayLegs.length>0?"EXISTING LEGS: "+parlayLegs.map((l,idx)=>"L"+(idx+1)+":"+abb(l.awayTeam)+"@"+abb(l.homeTeam)+" "+l.betType+":"+l.pick).join(", "):"";

    const prompt=`Elite NFL parlay handicapper. 17 signal layers + self-learning context. ONE wrong leg kills the ticket. Synthesize ALL signals below.

MATCHUP: ${awayTeam} @ ${homeTeam}
Venue:${venue==="home"?homeTeam+" home":venue==="away"?awayTeam+" home":"Neutral"} Weather:${weather==="dome"?"Dome":weather==="cold"?"Cold<35F":weather==="wind"?"Wind20+":weather==="rain"?"Rain/Snow":"Ideal"}
${divNote} ${adj.note?"WEATHER: "+adj.note:""}

STATS (raw): ${bs(homeTeam,homeStats)} | ${bs(awayTeam,awayStats)}
FORM: ${fd(homeTeam,"home")} | ${fd(awayTeam,"away")}
RANKINGS: ${rd(homeTeam,"home")} | ${rd(awayTeam,"away")}
${injuries?"INJURIES: "+injuries:""}
${lc} ${lm}
${pressCtx}
${ensCtx}
${olCtx}
${microCtx}
${garbCtx}
${levCtx}
${coachCtx}
${cpoeCtx}
${logitCtx}
${splitsCtx}
${refCtx}
${primeCtx}
${multiCtx}
${sitCtx}
${learningCtx}
${clusterCtx}
${bookCtx}
${gnnCtx}
${weatherCtx}
${h2hCtx}
${dvoaCtx}
${advancedCtx}
${eloCtx}
${scheduleCtx}
${publicCtx}
${existingLegs}

Return ONLY JSON (no markdown):
{
  "homeWin":N,"awayWin":N,
  "predictedScore":"KC 27 - LV 17",
  "spreadPick":"KC -4.5",
  "total":N,"totalLean":"over/under","totalWinProb":N,
  "winProb":N,"confidence":"LOW/MEDIUM/HIGH",
  "winner":"full team name",
  "parlayRisk":"LOW/MEDIUM/HIGH/VERY HIGH",
  "publicBetting":{"awayBetPct":N,"awayMoneyPct":N,"rlm":bool,"rlmNote":"","sharpSide":"team name","note":""},
  "qbMatchup":{"homeQB":{"name":"","team":"${homeTeam}","rating":N,"tds":N,"ints":N,"vsDefRating":N,"note":""},"awayQB":{...},"edge":"home/away/even","note":""},
  "situations":{"flags":["situational risk"],"edges":["situational edge"]},
  "edges":["edge1 — must reference specific signal data","edge2","edge3"],
  "flags":["flag1 — must reference specific signal data","flag2"],
  "analysis":"500-600 words integrating ALL 17 signals. Structure: 1) Win prob + logit validation 2) Spread with all composite adjustments (pressure+OL+coach+micro+weather+splits+situational) 3) Total with CPOE+weather+ref crew adj 4) Garbage-time filtered stats 5) Luck regression verdict 6) Multi-season baseline vs single-season 7) Coaching aggressiveness in close-game scenarios 8) CPOE matchup 9) Market ensemble + RLM 10) Home/away splits relevance 11) Situational ATS spots 12) Referee crew total impact 13) Prime time factor if applicable 14) Final parlay recommendation with specific bet"
}

COMPOSITE SPREAD ADJ (apply all layers):
1. Base spread
2. Pressure rate mismatch (${pressureData?.spreadImpact||0}pts)
3. OL degradation
4. Weather (${adj.spreadAdj}pts)
5. Micro-context (${microData?.compositeAdj||0}pts)
6. Coaching aggressiveness (${coachData?.spreadImpact||0}pts)
7. Market ensemble divergence → toward sharp side
8. CPOE total impact (${cpoeData?.totalImpact||0}pts on total)
9. Garbage-time filter (use adjusted PPG not raw)
10. Luck regression (regressed record, not actual W-L)
11. Logit transform validation (flag if model diverges >3% from market-implied prob)

RISK: LOW=65%+ all signals aligned sharp no luck no garbage contamination OL healthy; MEDIUM=55-64%; HIGH=50-54% any red flag; VERY HIGH=<50% multiple risk signals.`;

    try{
      const text=await callClaude({prompt,useSearch:true,maxTokens:1800});
      const m=text.match(/\{[\s\S]*\}/);if(!m)throw new Error("No JSON");
      const result=JSON.parse(m[0]);
      setGameResult(result);
      // ── Save to pending games for auto-result fetch ───────────────────────
      const pendingEntry={
        awayTeam,homeTeam,
        betUnits:betIntentActive&&betIntentUnits?parseFloat(betIntentUnits)||0:0,
        betOdds:betIntentActive&&betIntentOdds?betIntentOdds:"-110",
        isBet:betIntentActive&&!!betIntentUnits,
        modelSpread:lines?.spread,
        favTeam:lines?.favTeam,
        modelTotal:result.total||lines?.total,
        modelTotalLean:result.totalLean||lines?.totalLean,
        confidence:result.confidence,
        analyzedAt:new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"}),
        analyzedTs:Date.now(),
      };
      // Reset bet intent after locking in
      setBetIntentActive(false); setBetIntentUnits(""); setBetIntentOdds("-110");
      const updatedPending=[pendingEntry,...pendingGames.filter(g=>!(g.homeTeam===homeTeam&&g.awayTeam===awayTeam))].slice(0,20);
      setPendingGames(updatedPending);
      try{await window.storage.set(PENDING_KEY,JSON.stringify(updatedPending));}catch{}
      // ── Run Monte Carlo simulation in the background ───────────────────────
      setMcRunning(true);
      setTimeout(()=>{
        try{
          const mc=runMonteCarlo({homeWinProb:result.winProb||50,vegasSpread:lines?.spread||3,modelSpread:parseFloat((result.spreadPick||"").replace(/[^0-9.]/g,""))||lines?.spread||3,vegasTotal:result.total||lines?.total||44,homeTeam,weather});
          setMcResult(mc);
        }catch(e){console.error("MC error",e);}
        setMcRunning(false);
      },50);
      // ── Capture signal attribution for self-learning ──────────────────────
      const rawSignals={pressureData,cpoeData,leverageData,garbageData,coachData,olData,microData,lines,splitsData,situationalData,multiData,refData,primeData,weather};
      lastAttributionRef.current = attributeSignals(result, rawSignals);
      // ── Run contradiction detection ────────────────────────────────────────
      const ctSignals={pressureData,cpoeData,leverageData,garbageData,coachData,olData,lines,weather};
      const{contradictions:ct,alignments:al}=detectContradictions(ctSignals);
      setContradictions(ct);setAlignments(al);
      setAnalyzedGames(prev=>{
        const filtered=prev.filter(g=>!(g.homeTeam===homeTeam&&g.awayTeam===awayTeam));
        return [...filtered,{homeTeam,awayTeam,result,lines,weather,venue,pressureData,olData,microData,cpoeData,coachData,leverageData,garbageData}].slice(0,8);
      });
    }catch(e){setError(e.message||"Analysis failed.");}
    setLoading(false);
  }

  // ── Backend analytics management functions ────────────────────────────────
  async function saveSignalWeights(w){
    setSignalWeights(w);
    try{await window.storage.set(WEIGHTS_KEY,JSON.stringify(w));}catch{}
  }

  async function addBacktestResult(result){
    const newH=[result,...backtestHistory].slice(0,100);
    setBacktestHistory(newH);
    // ── Rebuild calibration ───────────────────────────────────────────────
    const cal=buildCalibration(newH);
    setCalibration(cal);
    try{await window.storage.set(BACKTEST_KEY,JSON.stringify(newH));}catch{}
    try{await window.storage.set(CALIBRATION_KEY,JSON.stringify(cal));}catch{}

    // ── Auto-classify mistake ─────────────────────────────────────────────
    if(!result.spreadCorrect){
      const cats=classifyMistake(result,result,lastAttributionRef.current||{},{homeTeam,awayTeam,weather});
      const mistakeEntry={...result,categories:cats,date:new Date().toLocaleDateString()};
      const newMistakes=[mistakeEntry,...mistakes].slice(0,200);
      setMistakes(newMistakes);
      try{await window.storage.set(MISTAKE_KEY,JSON.stringify(newMistakes));}catch{}
    }

    // ── Recompute drift and feature importance ────────────────────────────
    const drift=detectConceptDrift(newH);
    setDriftResult(drift);
    setFeatureImportance(computeFeatureImportance(newH));

    // ── Self-learning: only activates after MIN_SAMPLE games ──────────────
    if(newH.length < MIN_SAMPLE) return;
    const attribution = lastAttributionRef.current;
    if(!attribution) return;
    const updatedWeights = updateWeightsOnline(learnedWeights, attribution, result.spreadCorrect);
    setLearnedWeights(updatedWeights);
    try{await window.storage.set(LEARNING_KEY,JSON.stringify(updatedWeights));}catch{}
    if(currentFingerprint){
      const updatedMemory = { ...patternMemory };
      if(!updatedMemory[currentFingerprint])updatedMemory[currentFingerprint]={wins:0,total:0};
      updatedMemory[currentFingerprint].total++;
      if(result.spreadCorrect)updatedMemory[currentFingerprint].wins++;
      setPatternMemory(updatedMemory);
      try{await window.storage.set(PATTERN_KEY,JSON.stringify(updatedMemory));}catch{}
    }
    setTeamBias(computeTeamBias(newH));
  }

  async function clearBacktest(){
    setBacktestHistory([]);setCalibration(null);
    try{await window.storage.delete(BACKTEST_KEY);}catch{}
    try{await window.storage.delete(CALIBRATION_KEY);}catch{}
  }

  async function resetLearning(){
    setLearnedWeights({...DEFAULT_WEIGHTS});
    setPatternMemory({});
    setTeamBias([]);
    lastAttributionRef.current=null;
    try{await window.storage.delete(LEARNING_KEY);}catch{}
    try{await window.storage.delete(PATTERN_KEY);}catch{}
  }

  async function clearMistakes(){
    setMistakes([]);
    try{await window.storage.delete(MISTAKE_KEY);}catch{}
  }

  async function applyAutoCalibration(calibratedWeights){
    setLearnedWeights(calibratedWeights);
    setSignalWeights(calibratedWeights);
    try{await window.storage.set(LEARNING_KEY,JSON.stringify(calibratedWeights));}catch{}
    try{await window.storage.set(WEIGHTS_KEY,JSON.stringify(calibratedWeights));}catch{}
  }

  async function addCLVEntry(entry){
    const newH=[entry,...clvHistory].slice(0,100);
    setClvHistory(newH);
    try{await window.storage.set(CLV_KEY,JSON.stringify(newH));}catch{}
  }

  async function clearCLV(){
    setClvHistory([]);
    try{await window.storage.delete(CLV_KEY);}catch{}
  }

  // Build calibration stats from backtest history
  function buildCalibration(hist){
    const byConf={HIGH:{wins:0,total:0},MEDIUM:{wins:0,total:0},LOW:{wins:0,total:0}};
    const byBetType={Spread:{wins:0,total:0},Moneyline:{wins:0,total:0},Over:{wins:0,total:0},Under:{wins:0,total:0}};
    let totalW=0,totalG=0;
    hist.forEach(g=>{
      const conf=g.confidence||"MEDIUM";
      if(byConf[conf]){byConf[conf].total++;if(g.spreadCorrect)byConf[conf].wins++;}
      totalG++;if(g.spreadCorrect)totalW++;
      if(g.betType&&byBetType[g.betType]){byBetType[g.betType].total++;if(g.correct)byBetType[g.betType].wins++;}
    });
    return{byConfidence:byConf,byBetType,total:totalG,overallRate:totalG>0?Math.round(totalW/totalG*100):null};
  }

  async function analyzeParlayLegs(){
    if(parlayLegs.length<2)return;
    setAnalyzingParlay(true);setParlayAnalysis(null);
    const legStr=parlayLegs.map((l,i)=>"Leg "+(i+1)+": "+l.awayTeam+" @ "+l.homeTeam+" | "+l.betType+": "+l.pick+" ("+l.winProb+"%, "+l.risk+")"+(l.rlm?" RLM":"")+(l.cpoeEdge?" CPOE-EDGE":"")+(l.coachEdge?" COACH-EDGE":"")+(l.luckRegressed?" LUCK-REGRESSED":"")+(l.keyNumFlag?" KEY#"+l.keyNumFlag.kn:"")+(l.divisional?" DIV":"")+(l.homedog?" HOMEDOG":"")).join("\n");
    const combProb=parlayLegs.reduce((a,l)=>a*(l.winProb||55)/100,1)*100;
    try{
      const text=await callClaude({useSearch:true,maxTokens:1100,prompt:`Elite parlay analyst. ${parlayLegs.length}-leg parlay. Real money. Brutal.

${legStr}
Combined: ${combProb.toFixed(1)}%

**Grade:** A-F + reason
**Strongest Leg:** reference CPOE, coaching, luck regression, garbage filter if applicable
**Weakest Leg:** specific bust risk
**Key Number Risk:** any near -3/-7
**Signal Quality:** legs with most complete signal stack vs thin data legs
**Luck Trap Legs:** any leg riding a lucky team likely to regress
**Correlation:** weather/total correlations between legs
**Sharp Action:** RLM + market consensus legs
**Recommendation:** Play all / Swap Leg X / Reduce / Avoid — name specific legs
**Adjusted Probability:** accounting for correlations
**Score:** X/10 — 280 words max.`});
      setParlayAnalysis(text);
    }catch{setParlayAnalysis("Analysis unavailable.");}
    setAnalyzingParlay(false);
  }

  async function saveParlay(result,notes){
    const entry={date:new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}),legs:parlayLegs,result,notes,combinedProb:(parlayLegs.reduce((a,l)=>a*(l.winProb||55)/100,1)*100).toFixed(1)};
    const newH=[entry,...history].slice(0,30);setHistory(newH);
    try{await window.storage.set(HIST_KEY,JSON.stringify(newH));}catch{}
  }
  async function clearHistory(){setHistory([]);try{await window.storage.delete(HIST_KEY);}catch{}}
  function applyAutoSuggestion(sug){
    const newLegs=(sug.parlayLegs||[]).map(leg=>{
      const g=analyzedGames[leg.gameIndex];if(!g)return null;
      const r=g.result;const isDiv=isDivisional(g.homeTeam,g.awayTeam);const isHomeDog=g.lines&&g.lines.favTeam&&g.lines.favTeam!==g.homeTeam;
      const winnerIsHome=r.winner&&g.homeTeam.toLowerCase().includes(r.winner.toLowerCase().split(" ").pop());
      return{awayTeam:g.awayTeam,homeTeam:g.homeTeam,betType:leg.betType,pick:leg.pick,pickTeam:winnerIsHome?g.homeTeam:g.awayTeam,winProb:r.winProb||55,risk:r.parlayRisk||"MEDIUM",rlm:r.publicBetting?.rlm,divisional:isDiv,homedog:!!isHomeDog,keyNumFlag:keyNumFlag(g.lines?.spread),cpoeEdge:!!(g.cpoeData?.matchupEdge),coachEdge:!!(g.coachData?.spreadImpact),luckRegressed:!!(g.leverageData?.regressionVerdict)};
    }).filter(Boolean).slice(0,4);
    setParlayLegs(newLegs);setParlayAnalysis(null);
  }

  const addToParlay=leg=>{if(parlayLegs.length<4)setParlayLegs(p=>[...p,leg]);};
  const removeFromParlay=i=>{setParlayLegs(p=>p.filter((_,idx)=>idx!==i));setParlayAnalysis(null);};
  const canAnalyze=homeTeam&&awayTeam;
  const homeColor=tc(homeTeam),awayColor=tc(awayTeam);
  const statusDots=[["📊",statsStatus],["🩹",injuryStatus],["📈",formStatus],["💰",linesStatus],["🔥",pressureStatus],["📡",ensembleStatus],["🛡️",olStatus],["🔬",microStatus],["🗑️",garbageStatus],["🎲",leverageStatus],["🧠",coachStatus],["🎯",cpoeStatus],["🏠",splitsStatus],["📋",situationalStatus],["📅",multiStatus],["🦺",refStatus],["🌙",primeStatus]];

  return(<div style={{minHeight:"100dvh",background:"#060610",backgroundImage:"radial-gradient(ellipse at 15% 10%,rgba(30,15,60,0.55) 0%,transparent 55%),radial-gradient(ellipse at 85% 90%,rgba(10,35,15,0.4) 0%,transparent 55%)",fontFamily:"'Barlow Condensed',sans-serif",color:"#fff",paddingBottom:"40px"}}>
    {/* ── Global style injection ── */}
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@300;400;500;600;700;800;900&display=swap');
      *, *::before, *::after{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
      html,body{overscroll-behavior:none;background:#060610;}
      select option{background:#10101f;}
      ::-webkit-scrollbar{width:3px;height:3px;}
      ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:2px;}
      ::-webkit-scrollbar-track{background:transparent;}
      @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
      @keyframes spin{to{transform:rotate(360deg)}}
      @keyframes fadeSlideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}

      /* ── Touch / mobile ── */
      button,select,input,textarea{touch-action:manipulation;font-family:'Barlow Condensed',sans-serif;}
      button{min-height:36px;cursor:pointer;}
      select,input{min-height:40px;}

      /* ── Panel defaults ── */
      .nfl-panel{border-radius:9px;padding:12px;}

      /* ── Mobile breakpoint ── */
      @media(max-width:599px){
        .nfl-header-subtitle{display:none!important;}
        .nfl-inner{padding:8px 8px 0!important;}
        select,input{font-size:16px!important;}
        .nfl-analyze-btn{font-size:13px!important;padding:14px!important;}
      }

      /* ── Fullscreen ── */
      :fullscreen .nfl-inner{padding-bottom:env(safe-area-inset-bottom,16px)!important;}
      :-webkit-full-screen .nfl-inner{padding-bottom:env(safe-area-inset-bottom,16px)!important;}

      /* ── Safe area (iPhone notch/home bar) ── */
      .nfl-header{
        padding-left:max(16px,env(safe-area-inset-left))!important;
        padding-right:max(16px,env(safe-area-inset-right))!important;
        padding-top:max(10px,env(safe-area-inset-top))!important;
      }

      /* ── Focus ring ── */
      button:focus-visible,input:focus-visible,select:focus-visible{
        outline:2px solid rgba(99,102,241,0.6);outline-offset:2px;
      }
    `}</style>

    {/* Header */}
    <div className="nfl-header" style={{borderBottom:"1px solid rgba(255,255,255,0.05)",padding:"12px 18px",display:"flex",alignItems:"center",gap:"10px",background:"rgba(0,0,0,0.45)",backdropFilter:"blur(20px)",position:"sticky",top:0,zIndex:100}}>
      <div style={{width:"28px",height:"28px",borderRadius:"6px",background:"linear-gradient(135deg,#3b1c08,#1c0e04)",border:"1px solid rgba(251,191,36,0.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px",flexShrink:0}}>🏈</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:"15px",fontWeight:900,letterSpacing:"0.08em",textTransform:"uppercase",lineHeight:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>NFL Parlay Model</div>
        <div className="nfl-header-subtitle" style={{fontSize:"7px",color:"#2a2a2a",letterSpacing:"0.1em",textTransform:"uppercase",marginTop:"1px"}}>17 Signals · EV + Kelly · Bankroll · Weather Forecast · Line Shopping · Injury Impact · Monte Carlo · Self-Learning</div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:"6px",flexShrink:0}}>
        {parlayLegs.length>0&&<div style={{background:"rgba(251,191,36,0.06)",border:"1px solid rgba(251,191,36,0.16)",borderRadius:"5px",padding:"3px 7px",textAlign:"center"}}><div style={{fontSize:"7px",color:"#444"}}>PARLAY</div><div style={{fontSize:"13px",fontWeight:900,color:"#fbbf24",lineHeight:1}}>{parlayLegs.length}/4</div></div>}
        <button onClick={toggleFullscreen} title={isFullscreen?"Exit Full Screen":"Full Screen"} style={{width:"32px",height:"32px",borderRadius:"6px",border:"1px solid rgba(255,255,255,0.12)",background:"rgba(255,255,255,0.06)",color:"#888",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px",flexShrink:0,transition:"all 0.15s"}}
          onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.12)";e.currentTarget.style.color="#fff";}}
          onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.06)";e.currentTarget.style.color="#888";}}>
          {isFullscreen?"⊠":"⛶"}
        </button>
      </div>
    </div>

    <div className="nfl-inner" style={{maxWidth:"780px",margin:"0 auto",padding:"16px 14px 0"}}>
      {/* ── Weekly Execution Sequence ─── */}
      <WeeklyExecutionDashboard
        onPhase1={executePhase1} onPhase2={executePhase2}
        onPhase3={executePhase3} onPhase4={executePhase4}
        phase1Running={phase1Running} phase2Running={phase2Running}
        phase3Running={phase3Running} phase4Running={phase4Running}
        completedPhases={completedPhases} onMarkComplete={markPhaseComplete}
      />
      {/* ── Weekly Best Bet ─── */}
      <WeeklyPick onLoadMatchup={(away,home)=>{setAwayTeam(away);setHomeTeam(home);}}/>
      {/* ── Auto-fetch results (shows when pending games exist) ─── */}
      <AutoResultsPanel pendingGames={pendingGames} onFetchResults={fetchAllResults} onDismiss={dismissPending} fetching={fetchingResults} fetchProgress={fetchProgress}/>
      <HistoryTracker history={history} onClear={clearHistory}/>
      {/* ── ML Engine (all background systems in one panel) ─── */}
      <MLEngineDashboard
        backtestHistory={backtestHistory} onAddResult={addBacktestResult}
        onClearBacktest={clearBacktest} modelSpread={lines?.spread}
        modelTotal={gameResult?.total||lines?.total}
        modelTotalLean={gameResult?.totalLean||lines?.totalLean}
        homeTeam={homeTeam} awayTeam={awayTeam} confidence={gameResult?.confidence}
        clvHistory={clvHistory} onAddCLV={addCLVEntry} onClearCLV={clearCLV}
        lines={lines} gameResult={gameResult}
        learnedWeights={learnedWeights} patternMemory={patternMemory}
        teamBias={teamBias} onResetLearning={resetLearning}
        signalWeights={signalWeights} onUpdateWeights={saveSignalWeights}
        calibration={calibration}
        featureImportance={featureImportance} onAutoCalibrate={applyAutoCalibration}
        driftResult={driftResult} mistakes={mistakes}
        clusterResult={clusterResult} onFetchSchematicData={fetchSchematicData}
        fetchingSchematic={fetchingSchematic}
        parlayHistory={history} onLoadMatchup={(away,home)=>{setAwayTeam(away);setHomeTeam(home);}}
      />
      <BankrollPanel unitHistory={unitHistory} onAddUnit={addUnit} onClearUnits={clearUnits}/>
      {parlayLegs.length>0&&<ParlayBuilder legs={parlayLegs} onRemove={removeFromParlay} parlayAnalysis={parlayAnalysis} onAnalyze={analyzeParlayLegs} analyzing={analyzingParlay} onSave={saveParlay}/>}
      {analyzedGames.length>=2&&<ParlayAutoSuggester analyzedGames={analyzedGames} onApplySuggestion={applyAutoSuggestion}/>}
      <WeekSchedule onSelectGame={(away,home)=>{setAwayTeam(away);setHomeTeam(home);}}/>
      {/* Auto weather forecast for outdoor games */}
      <WeatherForecastPanel homeTeam={homeTeam} forecastData={forecastData} forecastLoading={forecastLoading} onApplyWeather={setWeather} currentWeather={weather}/>
      {/* Weather severity score */}
      {weatherSeverity&&<WeatherSeverityBar severityResult={weatherSeverity}/>}
      {/* Head-to-Head matchup history */}
      {(homeTeam&&awayTeam)&&<H2HPanel h2hData={h2hData} loading={h2hLoading} homeTeam={homeTeam} awayTeam={awayTeam}/>}
      {/* Opponent-adjusted stats */}
      {(homeTeam&&awayTeam)&&<DVOAPanel dvoaData={dvoaData} loading={dvoaLoading} homeTeam={homeTeam} awayTeam={awayTeam}/>}
      {(homeTeam&&awayTeam)&&<AdvancedStatsPanel advancedData={advancedData} advancedStatus={advancedStatus} homeTeam={homeTeam} awayTeam={awayTeam} lines={lines}/> }
      {(homeTeam&&awayTeam)&&<EloPowerPanel eloRatings={eloRatings} homeTeam={homeTeam} awayTeam={awayTeam} backtestHistory={backtestHistory}/> }
      {(homeTeam&&awayTeam)&&<ScheduleSpotPanel scheduleSpotData={scheduleSpotData} loading={scheduleSpotLoading} homeTeam={homeTeam} awayTeam={awayTeam}/> }
      {(homeTeam&&awayTeam)&&<PublicBettingPanel publicData={publicData} loading={publicLoading} homeTeam={homeTeam} awayTeam={awayTeam} lines={lines}/> }

      {/* Matchup */}
      <Panel mb="10px" border="rgba(255,255,255,0.07)">
        <div style={{fontSize:"8px",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"#2a2a2a",marginBottom:"7px"}}>{parlayLegs.length>0?`Game ${parlayLegs.length+1} of 4`:"Analyze Game"}</div>
        <SavedPresets onLoad={p=>{setAwayTeam(p.away);setHomeTeam(p.home);setVenue(p.venue||"home");setWeather(p.weather||"dome");}} currentHome={homeTeam} currentAway={awayTeam} currentVenue={venue} currentWeather={weather}/>
        <div style={{display:"flex",gap:"8px",alignItems:"center",marginBottom:"8px"}}>
          <div style={{flex:1}}><label style={{display:"block",fontSize:"8px",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"#555",marginBottom:"5px",fontFamily:"'Barlow Condensed',sans-serif"}}>Away Team</label><select value={awayTeam} onChange={e=>setAwayTeam(e.target.value)} style={{width:"100%",padding:"10px 12px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"7px",color:"#fff",fontSize:"13px",cursor:"pointer",outline:"none",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:600,appearance:"none",backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='7' viewBox='0 0 10 7'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23888' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 10px center"}}><option value="">— Select —</option>{NFL_TEAMS.filter(t=>t!==homeTeam).map(t=><option key={t} value={t}>{t}</option>)}</select></div>
          <div style={{fontSize:"13px",fontWeight:900,color:"#1a1a28",paddingTop:"19px",flexShrink:0}}>@</div>
          <div style={{flex:1}}><label style={{display:"block",fontSize:"8px",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"#555",marginBottom:"5px",fontFamily:"'Barlow Condensed',sans-serif"}}>Home Team</label><select value={homeTeam} onChange={e=>setHomeTeam(e.target.value)} style={{width:"100%",padding:"10px 12px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"7px",color:"#fff",fontSize:"13px",cursor:"pointer",outline:"none",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:600,appearance:"none",backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='7' viewBox='0 0 10 7'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23888' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 10px center"}}><option value="">— Select —</option>{NFL_TEAMS.filter(t=>t!==awayTeam).map(t=><option key={t} value={t}>{t}</option>)}</select></div>
        </div>
        {(homeTeam||awayTeam)&&<div style={{display:"flex",gap:"3px",marginBottom:"8px"}}>{awayTeam&&<div style={{flex:1,height:"2px",borderRadius:"1px",background:awayColor,opacity:0.4}}/>}{homeTeam&&<div style={{flex:1,height:"2px",borderRadius:"1px",background:homeColor,opacity:0.4}}/>}</div>}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"7px"}}>
          {[["Venue",venue,setVenue,[["home","🏟 Home Field"],["away","✈️ Away Field"],["neutral","⚖️ Neutral"]]],["Weather",weather,setWeather,[["dome","☁️ Dome/Indoor"],["ideal","🌤 Ideal"],["cold","❄️ Cold <35°F"],["wind","💨 Windy 20+mph"],["rain","🌧 Rain/Snow"]]]].map(([lbl,val,setter,opts])=>(
            <div key={lbl}><label style={{display:"block",fontSize:"8px",fontWeight:700,letterSpacing:"0.09em",textTransform:"uppercase",color:"#2a2a2a",marginBottom:"3px"}}>{lbl}</label><select value={val} onChange={e=>setter(e.target.value)} style={{width:"100%",padding:"7px 9px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"5px",color:"#bbb",fontSize:"12px",outline:"none",fontFamily:"'Barlow Condensed',sans-serif",appearance:"none",cursor:"pointer"}}>{opts.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div>
          ))}
        </div>
      </Panel>

      {/* Data status */}
      {/* ── Pipeline health + data status ── */}
      {(homeTeam&&awayTeam)&&<PipelineStatusPanel health={pipelineHealth} onRefresh={loadAllData} isLoading={dataLoading}/>}
      {(homeTeam&&awayTeam)&&<div style={{display:"flex",alignItems:"center",gap:"5px",marginBottom:"9px",padding:"5px 10px",background:"rgba(255,255,255,0.015)",border:"1px solid rgba(255,255,255,0.04)",borderRadius:"6px",flexWrap:"wrap"}}>
        <span style={{fontSize:"8px",fontWeight:700,color:dataLoading?"#f59e0b":"#555",fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:"0.07em"}}>{dataLoading?"Loading 17 signals in parallel…":"Signals"}</span>
        {statusDots.map(([icon,st],i)=><div key={i} style={{display:"flex",alignItems:"center",gap:"2px"}}><span style={{fontSize:"8px"}}>{icon}</span><div style={{width:"4px",height:"4px",borderRadius:"50%",background:st==="success"?"#4ade80":st==="loading"?"#f59e0b":st==="error"?"#f87171":"#1a1a2a",animation:st==="loading"?"pulse 1s infinite":"none"}}/></div>)}
      </div>}

      {/* Lines */}
      {(homeTeam&&awayTeam)&&<Panel border={lines?"rgba(192,132,252,0.12)":"rgba(255,255,255,0.06)"} mb="10px"><PanelTitle icon="💰" title="Lines & Projections" tag={linesStatus==="success"?"live":linesStatus==="loading"?"…":undefined}/>{linesStatus==="loading"&&<Skel cols={3}/>}{lines&&(<><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"5px",marginBottom:"5px"}}><div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:"6px",padding:"8px 6px",textAlign:"center"}}><div style={{fontSize:"7px",color:"#1a1a2a",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"2px",fontWeight:700,letterSpacing:"0.09em"}}>SPREAD</div><div style={{fontSize:"14px",fontWeight:900,color:"#4ade80",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{lines.favTeam?abb(lines.favTeam):"?"} -{lines.spread||"?"}</div>{keyNumFlag(lines.spread)&&<div style={{fontSize:"7px",color:"#f59e0b",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"2px",fontWeight:700}}>⚠ KEY #{keyNumFlag(lines.spread).kn}</div>}</div><div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:"6px",padding:"8px 6px",textAlign:"center"}}><div style={{fontSize:"7px",color:"#1a1a2a",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"2px",fontWeight:700,letterSpacing:"0.09em"}}>TOTAL O/U</div><div style={{fontSize:"14px",fontWeight:900,color:"#c084fc",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{lines.total||"?"}</div><div style={{fontSize:"7px",fontWeight:700,color:lines.totalLean==="over"?"#4ade80":"#f87171",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"2px"}}>LEAN {(lines.totalLean||"").toUpperCase()}{weatherAdjust(weather).note?` →${(parseFloat(lines.total||0)+weatherAdjust(weather).totalAdj).toFixed(1)}`:""}</div></div><div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:"6px",padding:"8px 6px",textAlign:"center"}}><div style={{fontSize:"7px",color:"#1a1a2a",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"2px",fontWeight:700,letterSpacing:"0.09em"}}>SCORE</div><div style={{fontSize:"11px",fontWeight:900,color:"#fff",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1.3}}>{abb(awayTeam)} {lines.awayScore}<br/>{abb(homeTeam)} {lines.homeScore}</div></div></div><div style={{display:"flex",gap:"4px",marginBottom:lineMove?"5px":"0"}}>{[[awayTeam,lines.awayML,awayColor],[homeTeam,lines.homeML,homeColor]].map(([t,ml,c])=><div key={t} style={{flex:1,display:"flex",justifyContent:"space-between",alignItems:"center",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.04)",borderRadius:"4px",padding:"4px 7px"}}><span style={{fontSize:"9px",fontWeight:700,color:c,fontFamily:"'Barlow Condensed',sans-serif"}}>{abb(t)}</span><span style={{fontSize:"12px",fontWeight:900,color:"#fff",fontFamily:"'Barlow Condensed',sans-serif"}}>{ml||"—"}</span></div>)}</div>{lineMove&&<div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.04)",borderRadius:"4px",padding:"5px 8px",display:"flex",gap:"8px",alignItems:"center",flexWrap:"wrap"}}><span style={{fontSize:"8px",color:"#4ade80",fontWeight:700,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:"0.09em"}}>📈 MOVE</span><span style={{fontSize:"9px",color:"#aaa",fontFamily:"'Barlow Condensed',sans-serif"}}>{lineMove.open} → {lineMove.current}</span><span style={{fontSize:"8px",color:"#fbbf24",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700}}>Sharp: {lineMove.sharpSide}</span></div>}</> )}<div style={{marginTop:"6px",fontSize:"8px",color:"#101018",fontFamily:"'Barlow Condensed',sans-serif"}}>AI projections · Entertainment only</div></Panel>}

      {/* All signal panels */}
      {(homeTeam&&awayTeam)&&lines&&<LogitPanel lines={lines} homeTeam={homeTeam} awayTeam={awayTeam} modelWinProb={gameResult?.winProb}/>}
      {lineMove&&<SteamMoveAlert lineMove={lineMove}/>}
      {(homeTeam&&awayTeam)&&<PressurePanel pressureData={pressureData} loading={pressureStatus==="loading"} homeTeam={homeTeam} awayTeam={awayTeam}/>}
      {(homeTeam&&awayTeam)&&<MarketEnsemblePanel ensemble={ensembleData} loading={ensembleStatus==="loading"} homeTeam={homeTeam} awayTeam={awayTeam}/>}
      {(homeTeam&&awayTeam)&&<OLPanel olData={olData} loading={olStatus==="loading"} homeTeam={homeTeam} awayTeam={awayTeam}/>}
      {(homeTeam&&awayTeam)&&<GarbageTimePanel garbageData={garbageData} loading={garbageStatus==="loading"} homeTeam={homeTeam} awayTeam={awayTeam}/>}
      {(homeTeam&&awayTeam)&&<LeveragePanel leverageData={leverageData} loading={leverageStatus==="loading"} homeTeam={homeTeam} awayTeam={awayTeam}/>}
      {(homeTeam&&awayTeam)&&<CoachingPanel coachData={coachData} loading={coachStatus==="loading"} homeTeam={homeTeam} awayTeam={awayTeam}/>}
      {(homeTeam&&awayTeam)&&<CPOEPanel cpoeData={cpoeData} loading={cpoeStatus==="loading"} homeTeam={homeTeam} awayTeam={awayTeam}/>}
      {(homeTeam&&awayTeam)&&<MicroContextPanel homeTeam={homeTeam} awayTeam={awayTeam} weather={weather} microData={microData} microLoading={microStatus==="loading"}/>}
      {(contradictions.length>0||alignments.length>0)&&<ContradictionPanel contradictions={contradictions} alignments={alignments}/>}
      {/* ── 8 New Feature Panels ── */}
      {(homeTeam&&awayTeam)&&<SplitsPanel splitsData={splitsData} loading={splitsStatus==="loading"} homeTeam={homeTeam} awayTeam={awayTeam}/>}
      {(homeTeam&&awayTeam)&&<SituationalATSPanel situationalData={situationalData} loading={situationalStatus==="loading"} homeTeam={homeTeam} awayTeam={awayTeam}/>}
      {(homeTeam&&awayTeam)&&<MultiSeasonPanel multiData={multiData} loading={multiStatus==="loading"} homeTeam={homeTeam} awayTeam={awayTeam}/>}
      {(homeTeam&&awayTeam)&&<RefPanel refData={refData} loading={refStatus==="loading"}/>}
      {(homeTeam&&awayTeam)&&<PrimeTimePanel primeData={primeData} loading={primeStatus==="loading"} homeTeam={homeTeam} awayTeam={awayTeam}/>}
      {parlayLegs.length>=2&&<CorrelationMatrixPanel legs={parlayLegs} weather={weather}/>}
      {gameResult&&lines&&<DivergenceAlert lines={lines} gameResult={gameResult}/>}

      {/* Form + Rankings */}
      {(homeTeam&&awayTeam)&&(formData||rankData||formStatus==="loading")&&<Panel mb="10px"><PanelTitle icon="📈" title="Form & Rankings" tag={formStatus==="success"&&rankStatus==="success"?"live":undefined}/>{(formStatus==="loading"||rankStatus==="loading")&&<Skel cols={2}/>}{(formData||rankData)&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"9px"}}>{[{team:awayTeam,color:awayColor,fk:"away",rk:"away"},{team:homeTeam,color:homeColor,fk:"home",rk:"home"}].map(({team,color,fk,rk})=>{const fd=formData?.[fk],rd=rankData?.[rk];return(<div key={team} style={{borderTop:`2px solid ${color}28`,paddingTop:"8px"}}><div style={{fontSize:"9px",fontWeight:800,color,fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"6px"}}>{abb(team)}</div>{fd&&<div style={{marginBottom:"6px"}}><div style={{display:"flex",gap:"3px",marginBottom:"4px",flexWrap:"wrap"}}>{(fd.results||[]).map((r,i)=><div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"1px"}}><div style={{width:"15px",height:"15px",borderRadius:"50%",background:r.result==="W"?"#16a34a":"#dc2626",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"7px",fontWeight:900,color:"#fff",fontFamily:"'Barlow Condensed',sans-serif"}}>{r.result}</div><div style={{fontSize:"6px",fontWeight:700,color:r.ats==="C"?"#4ade80":"#f87171",fontFamily:"'Barlow Condensed',sans-serif"}}>{r.ats||""}</div></div>)}</div><div style={{display:"flex",gap:"3px",flexWrap:"wrap"}}>{[[fd.l5Record,"L5"],[fd.l5ATS,"ATS"],[fd.streak,"STK"]].map(([v,l])=>v?<div key={l} style={{background:"rgba(255,255,255,0.04)",borderRadius:"3px",padding:"2px 5px",textAlign:"center"}}><div style={{fontSize:"6px",color:"#1a1a2a",fontFamily:"'Barlow Condensed',sans-serif"}}>{l}</div><div style={{fontSize:"10px",fontWeight:800,color:"#ddd",fontFamily:"'Barlow Condensed',sans-serif"}}>{v}</div></div>:null)}</div>{fd.note&&<div style={{fontSize:"8px",color:"#2a2a2a",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"2px",fontStyle:"italic"}}>{fd.note}</div>}</div>}{rd&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"3px"}}>{[["OFF",rd.offRank,"rank"],["DEF",rd.defRank,"rank"],["RZ Off",rd.rzOff,"%"],["RZ Def",rd.rzDef,"%"],["3rd Off",rd.thirdOff,"%"],["3rd Def",rd.thirdDef,"%"]].map(([lbl,v,unit])=>{const isRk=unit==="rank",num=parseFloat(v)||0;const c=isRk?(num<=10?"#4ade80":num<=21?"#f59e0b":"#f87171"):(num>=60?"#4ade80":num>=45?"#f59e0b":"#f87171");return <div key={lbl} style={{background:"rgba(255,255,255,0.03)",borderRadius:"3px",padding:"3px 4px",textAlign:"center"}}><div style={{fontSize:"6px",color:"#1a1a2a",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"1px"}}>{lbl}</div><div style={{fontSize:"10px",fontWeight:800,color:c,fontFamily:"'Barlow Condensed',sans-serif"}}>{isRk?`#${v||"?"}`:v?`${v}%`:"—"}</div></div>;})}</div>}</div>);})}</div>}</Panel>}

      {/* Stats */}
      <Panel mb="10px"><PanelTitle icon="📊" title="Team Stats" tag={statsStatus==="success"?"live":statsStatus==="loading"?"loading…":undefined}/><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>{[{team:awayTeam||"Away",s:awayStats,set:setAwayStats,c:awayColor,hl:awayHL},{team:homeTeam||"Home",s:homeStats,set:setHomeStats,c:homeColor,hl:homeHL}].map(({team,s,set,c,hl})=><div key={team} style={{borderTop:`2px solid ${c}28`,paddingTop:"8px"}}><div style={{fontSize:"9px",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:c,marginBottom:"6px",opacity:0.85}}>{abb(team)}</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px"}}>{[["Wins","wins"],["Losses","losses"],["PPG","ppg"],["Pts Allow/G","papg"],["Pass Yds/G","passYds"],["Rush Yds/G","rushYds"]].map(([lbl,key])=><StatFld key={key} label={lbl} value={s[key]} onChange={v=>set(prev=>({...prev,[key]:v}))} hl={hl}/>)}</div></div>)}</div><div style={{marginTop:"6px",fontSize:"8px",color:"#1a1a28",fontFamily:"'Barlow Condensed',sans-serif"}}>Auto-fetched · Edit to override</div></Panel>

      {/* Injuries */}
      <Panel mb="13px"><PanelTitle icon="🩹" title="Injury Report" tag={injuryStatus==="success"?"live":injuryStatus==="loading"?"loading…":undefined}/><textarea value={injuries} onChange={e=>setInjuries(e.target.value)} placeholder={injuryStatus==="loading"?"Fetching…":injuryStatus==="noTeams"?"Select both teams…":"None found — add manually"} rows={injuries?Math.min(7,injuries.split("\n").length+1):3} style={{width:"100%",padding:"7px 9px",background:injuryStatus==="success"?"rgba(74,222,128,0.025)":"rgba(255,255,255,0.018)",border:`1px solid ${injuryStatus==="success"?"rgba(74,222,128,0.13)":injuryStatus==="error"?"rgba(248,113,113,0.13)":"rgba(255,255,255,0.06)"}`,borderRadius:"5px",color:"#aaa",fontSize:"10px",outline:"none",resize:"vertical",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.5"}}/></Panel>
      {/* Injury impact quantifier — auto-parses injury text to point values */}
      <InjuryImpactPanel injuries={injuries} homeTeam={homeTeam} awayTeam={awayTeam} lines={lines}/>
      {/* GNN Roster Interdependency — cascade effects, coverage scheme, snap counts */}
      {(homeTeam&&awayTeam)&&<GNNRosterPanel homeTeam={homeTeam} awayTeam={awayTeam} injuries={injuries} pressureData={pressureData} olData={olData} cpoeData={cpoeData} ensembleData={ensembleData} lines={lines}/>}


      {/* Pattern match alert — fires when current game matches learned history */}
      {patternResult&&<PatternMatchAlert currentFingerprint={currentFingerprint} patternResult={patternResult}/>}

      {/* ── Bet intent — set before analysis to auto-track result in bankroll ── */}
      {canAnalyze&&(
        <div style={{marginBottom:"8px",padding:"9px 11px",background:"rgba(255,255,255,0.03)",border:"1px solid "+(betIntentActive?"rgba(74,222,128,0.2)":"rgba(255,255,255,0.07)"),borderRadius:"7px",transition:"border 0.2s"}}>
          <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:betIntentActive?"8px":"0"}}>
            <button onClick={()=>setBetIntentActive(o=>!o)}
              style={{padding:"4px 10px",borderRadius:"4px",border:"1px solid "+(betIntentActive?"rgba(74,222,128,0.35)":"rgba(255,255,255,0.1)"),background:betIntentActive?"rgba(74,222,128,0.1)":"transparent",color:betIntentActive?"#4ade80":"#555",fontSize:"9px",fontWeight:700,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",transition:"all 0.15s"}}>
              {betIntentActive?"✅ Tracking This Bet":"💰 Betting This?"}
            </button>
            {betIntentActive&&<span style={{fontSize:"8px",color:"#4ade80",fontFamily:"'Barlow Condensed',sans-serif"}}>Auto-logs to bankroll when result is fetched</span>}
          </div>
          {betIntentActive&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"7px"}}>
              <div>
                <label style={{display:"block",fontSize:"7px",fontWeight:700,color:"#444",marginBottom:"2px",fontFamily:"'Barlow Condensed',sans-serif"}}>Units to Bet</label>
                <input value={betIntentUnits} onChange={e=>setBetIntentUnits(e.target.value)} placeholder="e.g. 2" type="number" min="0.5" step="0.5"
                  style={{width:"100%",padding:"6px 8px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(74,222,128,0.2)",borderRadius:"5px",color:"#fff",fontSize:"14px",fontWeight:700,outline:"none",fontFamily:"'Barlow Condensed',sans-serif"}}/>
              </div>
              <div>
                <label style={{display:"block",fontSize:"7px",fontWeight:700,color:"#444",marginBottom:"2px",fontFamily:"'Barlow Condensed',sans-serif"}}>Odds (American)</label>
                <input value={betIntentOdds} onChange={e=>setBetIntentOdds(e.target.value)} placeholder="-110"
                  style={{width:"100%",padding:"6px 8px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(74,222,128,0.2)",borderRadius:"5px",color:"#fff",fontSize:"14px",fontWeight:700,outline:"none",fontFamily:"'Barlow Condensed',sans-serif"}}/>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Analyze button */}
      <button onClick={runAnalysis} disabled={!canAnalyze||loading} style={{width:"100%",padding:"13px",borderRadius:"8px",border:"none",background:canAnalyze&&!loading?"linear-gradient(135deg,#16a34a,#15803d)":"rgba(255,255,255,0.04)",color:canAnalyze&&!loading?"#fff":"#1a1a2a",fontSize:"13px",fontWeight:900,letterSpacing:"0.12em",textTransform:"uppercase",cursor:canAnalyze&&!loading?"pointer":"not-allowed",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"13px",boxShadow:canAnalyze&&!loading?"0 0 20px rgba(22,163,74,0.15)":"none",transition:"all 0.2s"}}>
        {loading?<span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"8px"}}><span style={{width:"12px",height:"12px",border:"2px solid rgba(255,255,255,0.2)",borderTopColor:"#fff",borderRadius:"50%",display:"inline-block",animation:"spin 0.7s linear infinite"}}/>Running 17-Signal Analysis…</span>:"Analyze Game"+(parlayLegs.length>0?" (Leg "+(parlayLegs.length+1)+")":"")}
      </button>

      {error&&<div style={{background:"rgba(239,68,68,0.05)",border:"1px solid rgba(239,68,68,0.13)",borderRadius:"6px",padding:"8px 11px",color:"#fca5a5",fontSize:"10px",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"10px"}}>⚠ {error}</div>}
      {gameResult&&<GameCard result={gameResult} homeTeam={homeTeam} awayTeam={awayTeam} weather={weather} lines={lines} pressureData={pressureData} olData={olData} microData={microData} cpoeData={cpoeData} coachData={coachData} leverageData={leverageData} garbageData={garbageData} onAddToParlay={addToParlay} parlayFull={parlayLegs.length>=4}/>}
      {/* Monte Carlo always renders when result or simulation is running */}
      {(mcResult||mcRunning)&&<MonteCarloPanel mcResult={mcResult} running={mcRunning} homeTeam={homeTeam} awayTeam={awayTeam} lines={lines}/>}
      {/* EV Calculator + Kelly — appears after analysis */}
      {gameResult&&<EVKellyPanel gameResult={gameResult} lines={lines}/>}
      {/* Line Shopping — shows best available line across books */}
      {gameResult&&ensembleData&&<LineShoppingPanel ensemble={ensembleData} lines={lines} gameResult={gameResult} homeTeam={homeTeam} awayTeam={awayTeam}/>}
      {/* ── Sportsbook Profiling & Sharp-Line Arbitrage ── */}
      {ensembleData&&<SportsbookProfilePanel ensemble={ensembleData} lines={lines}/>}
      {ensembleData&&<SharpLineArbitragePanel ensemble={ensembleData} lines={lines} homeTeam={homeTeam} awayTeam={awayTeam}/>}
      {/* ── Player Prop & Derivative Modeler ── */}
      {(homeTeam&&awayTeam)&&<PropModelerPanel homeTeam={homeTeam} awayTeam={awayTeam} gameResult={gameResult} lines={lines} weather={weather} pressureData={pressureData} olData={olData} cpoeData={cpoeData} garbageData={garbageData}/>}
      <div style={{textAlign:"center",marginTop:"22px",fontSize:"8px",color:"#0e0e1a",letterSpacing:"0.08em",fontFamily:"'Barlow Condensed',sans-serif"}}>FOR ENTERTAINMENT PURPOSES ONLY · NOT FINANCIAL OR BETTING ADVICE</div>
    </div>
  </div>);
}
