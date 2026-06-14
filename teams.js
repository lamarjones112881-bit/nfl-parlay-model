// ── Team Constants ──────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from "react";

// ── Constants ─────────────────────────────────────────────────────────────────
const NFL_TEAMS = [
  "Arizona Cardinals","Atlanta Falcons","Baltimore Ravens","Buffalo Bills",
  "Carolina Panthers","Chicago Bears","Cincinnati Bengals","Cleveland Browns",
  "Dallas Cowboys","Denver Broncos","Detroit Lions","Green Bay Packers",
  "Houston Texans","Indianapolis Colts","Jacksonville Jaguars","Kansas City Chiefs",
  "Las Vegas Raiders","Los Angeles Chargers","Los Angeles Rams","Miami Dolphins",
  "Minnesota Vikings","New England Patriots","New Orleans Saints","New York Giants",
  "New York Jets","Philadelphia Eagles","Pittsburgh Steelers","San Francisco 49ers",
  "Seattle Seahawks","Tampa Bay Buccaneers","Tennessee Titans","Washington Commanders"
];
const DIVISIONS = {
  "NFC East":["Dallas Cowboys","New York Giants","Philadelphia Eagles","Washington Commanders"],
  "NFC North":["Chicago Bears","Detroit Lions","Green Bay Packers","Minnesota Vikings"],
  "NFC South":["Atlanta Falcons","Carolina Panthers","New Orleans Saints","Tampa Bay Buccaneers"],
  "NFC West":["Arizona Cardinals","Los Angeles Rams","San Francisco 49ers","Seattle Seahawks"],
  "AFC East":["Buffalo Bills","Miami Dolphins","New England Patriots","New York Jets"],
  "AFC North":["Baltimore Ravens","Cincinnati Bengals","Cleveland Browns","Pittsburgh Steelers"],
  "AFC South":["Houston Texans","Indianapolis Colts","Jacksonville Jaguars","Tennessee Titans"],
  "AFC West":["Denver Broncos","Kansas City Chiefs","Las Vegas Raiders","Los Angeles Chargers"]
};
const getDivision = t => Object.entries(DIVISIONS).find(([,ts])=>ts.includes(t))?.[0]||null;
const isDivisional = (a,b) => { const da=getDivision(a),db=getDivision(b); return da&&db&&da===db; };
const TEAM_ABBR = {
  "Arizona Cardinals":"ARI","Atlanta Falcons":"ATL","Baltimore Ravens":"BAL","Buffalo Bills":"BUF",
  "Carolina Panthers":"CAR","Chicago Bears":"CHI","Cincinnati Bengals":"CIN","Cleveland Browns":"CLE",
  "Dallas Cowboys":"DAL","Denver Broncos":"DEN","Detroit Lions":"DET","Green Bay Packers":"GB",
  "Houston Texans":"HOU","Indianapolis Colts":"IND","Jacksonville Jaguars":"JAX","Kansas City Chiefs":"KC",
  "Las Vegas Raiders":"LV","Los Angeles Chargers":"LAC","Los Angeles Rams":"LAR","Miami Dolphins":"MIA",
  "Minnesota Vikings":"MIN","New England Patriots":"NE","New Orleans Saints":"NO","New York Giants":"NYG",
  "New York Jets":"NYJ","Philadelphia Eagles":"PHI","Pittsburgh Steelers":"PIT","San Francisco 49ers":"SF",
  "Seattle Seahawks":"SEA","Tampa Bay Buccaneers":"TB","Tennessee Titans":"TEN","Washington Commanders":"WAS"
};
const TEAM_COLORS = {
  "Arizona Cardinals":"#97233F","Atlanta Falcons":"#A71930","Baltimore Ravens":"#241773","Buffalo Bills":"#00338D",
  "Carolina Panthers":"#0085CA","Chicago Bears":"#0B162A","Cincinnati Bengals":"#FB4F14","Cleveland Browns":"#311D00",
  "Dallas Cowboys":"#003594","Denver Broncos":"#FB4F14","Detroit Lions":"#0076B6","Green Bay Packers":"#203731",
  "Houston Texans":"#03202F","Indianapolis Colts":"#002C5F","Jacksonville Jaguars":"#006778","Kansas City Chiefs":"#E31837",
  "Las Vegas Raiders":"#333333","Los Angeles Chargers":"#0080C6","Los Angeles Rams":"#003594","Miami Dolphins":"#008E97",
  "Minnesota Vikings":"#4F2683","New England Patriots":"#002244","New Orleans Saints":"#B3995D","New York Giants":"#0B2265",
  "New York Jets":"#125740","Philadelphia Eagles":"#004C54","Pittsburgh Steelers":"#FFB612","San Francisco 49ers":"#AA0000",
  "Seattle Seahawks":"#002244","Tampa Bay Buccaneers":"#D50A0A","Tennessee Titans":"#0C2340","Washington Commanders":"#5A1414"
};
const STADIUM_CTX = {
  "Kansas City Chiefs":{turf:"grass",altitude:909,noise:"HIGH",indoor:false},
  "Buffalo Bills":{turf:"grass",altitude:570,noise:"HIGH",indoor:false},
  "Baltimore Ravens":{turf:"grass",altitude:146,noise:"HIGH",indoor:false},
  "San Francisco 49ers":{turf:"grass",altitude:15,noise:"MED",indoor:false},
  "Philadelphia Eagles":{turf:"grass",altitude:40,noise:"ELITE",indoor:false},
  "Pittsburgh Steelers":{turf:"grass",altitude:1060,noise:"HIGH",indoor:false},
  "Green Bay Packers":{turf:"grass",altitude:660,noise:"HIGH",indoor:false},
  "Seattle Seahawks":{turf:"field_turf",altitude:175,noise:"ELITE",indoor:false},
  "Dallas Cowboys":{turf:"field_turf",altitude:430,noise:"MED",indoor:true},
  "Las Vegas Raiders":{turf:"field_turf",altitude:2030,noise:"MED",indoor:true},
  "New Orleans Saints":{turf:"field_turf",altitude:6,noise:"HIGH",indoor:true},
  "Atlanta Falcons":{turf:"field_turf",altitude:1050,noise:"MED",indoor:true},
  "Arizona Cardinals":{turf:"field_turf",altitude:1086,noise:"LOW",indoor:true},
  "Los Angeles Rams":{turf:"field_turf",altitude:102,noise:"LOW",indoor:true},
  "Los Angeles Chargers":{turf:"field_turf",altitude:102,noise:"LOW",indoor:true},
  "Indianapolis Colts":{turf:"field_turf",altitude:718,noise:"MED",indoor:true},
  "Minnesota Vikings":{turf:"field_turf",altitude:830,noise:"HIGH",indoor:true},
  "Detroit Lions":{turf:"field_turf",altitude:600,noise:"MED",indoor:true},
  "Denver Broncos":{turf:"grass",altitude:5280,noise:"HIGH",indoor:false},
  "Miami Dolphins":{turf:"grass",altitude:6,noise:"LOW",indoor:false},
  "Tennessee Titans":{turf:"grass",altitude:597,noise:"MED",indoor:false},
  "Jacksonville Jaguars":{turf:"grass",altitude:12,noise:"LOW",indoor:false},
  "Tampa Bay Buccaneers":{turf:"grass",altitude:14,noise:"MED",indoor:false},
  "Carolina Panthers":{turf:"grass",altitude:765,noise:"MED",indoor:false},
  "Washington Commanders":{turf:"grass",altitude:20,noise:"MED",indoor:false},
  "New York Giants":{turf:"field_turf",altitude:3,noise:"MED",indoor:false},
  "New York Jets":{turf:"field_turf",altitude:3,noise:"MED",indoor:false},
  "New England Patriots":{turf:"field_turf",altitude:30,noise:"HIGH",indoor:false},
  "Cleveland Browns":{turf:"grass",altitude:653,noise:"HIGH",indoor:false},
  "Cincinnati Bengals":{turf:"grass",altitude:483,noise:"MED",indoor:false},
  "Chicago Bears":{turf:"grass",altitude:594,noise:"HIGH",indoor:false},
  "Houston Texans":{turf:"field_turf",altitude:43,noise:"MED",indoor:true},
};
const EMPTY_STATS = { wins:"",losses:"",ppg:"",papg:"",passYds:"",rushYds:"" };
const abb = t => TEAM_ABBR[t]||t.split(" ").pop();
const tc  = t => TEAM_COLORS[t]||"#4a9eff";
const BET_TYPES   = ["Spread","Moneyline","Over","Under"];
const RISK_COLORS = { LOW:"#4ade80",MEDIUM:"#f59e0b",HIGH:"#f87171","VERY HIGH":"#ef4444" };
const HIST_KEY        = "nfl_parlay_history_v4";
const PRESETS_KEY     = "nfl_game_presets_v1";
const BACKTEST_KEY    = "nfl_backtest_v1";
const CLV_KEY         = "nfl_clv_v1";
const CALIBRATION_KEY = "nfl_calibration_v1";
const WEIGHTS_KEY     = "nfl_signal_weights_v1";
const SEASON_KEY      = "nfl_season_analytics_v1";
const POWER_KEY       = "nfl_power_rankings_v1";
const PENDING_KEY     = "nfl_pending_games_v1";
const PROPS_KEY       = "nfl_props_v1";
const CLUSTER_KEY     = "nfl_clusters_v1";
const GNN_KEY         = "nfl_gnn_v1";
const SCHEDULE_KEY    = "nfl_execution_schedule_v1";

// ═══════════════════════════════════════════════════════════════════════════
// FIVE NEW FEATURES: EV + Kelly · Bankroll Tracker · Weather Forecast
//                   Line Shopping · Injury Impact Quantifier
// ═══════════════════════════════════════════════════════════════════════════

const BANKROLL_KEY  = "nfl_bankroll_v1";
const UNITS_KEY     = "nfl_units_v1";
const WEATHER_CACHE_KEY = "nfl_weather_v1";
const H2H_KEY           = "nfl_h2h_v1";
const DVOA_KEY          = "nfl_dvoa_v1";
const ADVANCED_KEY      = "nfl_advanced_v1";
const ELO_KEY           = "nfl_elo_v1";
const SCHEDULE_SPOT_KEY = "nfl_schedspot_v1";
const PUBLIC_PCT_KEY    = "nfl_public_pct_v1";

// ── Outdoor stadium coordinates (for weather fetch) ───────────────────────
const OUTDOOR_STADIUMS = {
  "Buffalo Bills":        {city:"Buffalo",lat:42.77,lon:-78.79},
  "Green Bay Packers":    {city:"Green Bay",lat:44.50,lon:-88.06},
  "Kansas City Chiefs":   {city:"Kansas City",lat:39.05,lon:-94.48},
  "Baltimore Ravens":     {city:"Baltimore",lat:39.28,lon:-76.62},
  "Pittsburgh Steelers":  {city:"Pittsburgh",lat:40.44,lon:-80.01},
  "Cleveland Browns":     {city:"Cleveland",lat:41.50,lon:-81.69},
  "Cincinnati Bengals":   {city:"Cincinnati",lat:39.09,lon:-84.51},
  "Denver Broncos":       {city:"Denver",lat:39.74,lon:-105.02},
  "Seattle Seahawks":     {city:"Seattle",lat:47.59,lon:-122.33},
  "San Francisco 49ers":  {city:"Santa Clara",lat:37.40,lon:-121.97},
  "Miami Dolphins":       {city:"Miami",lat:25.95,lon:-80.24},
  "New England Patriots": {city:"Foxborough",lat:42.09,lon:-71.26},
  "New York Giants":      {city:"East Rutherford",lat:40.81,lon:-74.07},
  "New York Jets":        {city:"East Rutherford",lat:40.81,lon:-74.07},
  "Philadelphia Eagles":  {city:"Philadelphia",lat:39.90,lon:-75.17},
  "Washington Commanders":{city:"Landover",lat:38.91,lon:-76.86},
  "Carolina Panthers":    {city:"Charlotte",lat:35.23,lon:-80.85},
  "Tampa Bay Buccaneers": {city:"Tampa",lat:27.98,lon:-82.50},
  "Jacksonville Jaguars": {city:"Jacksonville",lat:30.32,lon:-81.64},
  "Tennessee Titans":     {city:"Nashville",lat:36.17,lon:-86.77},
  "Chicago Bears":        {city:"Chicago",lat:41.86,lon:-87.62},
  "Detroit Lions":        {city:"Detroit",lat:42.34,lon:-83.05},
};

// ── EV & Kelly math ───────────────────────────────────────────────────────

export { NFL_TEAMS, DIVISIONS, getDivision, isDivisional, TEAM_ABBR, TEAM_COLORS, STADIUM_CTX, EMPTY_STATS, abb, tc, BET_TYPES, RISK_COLORS, HIST_KEY, PRESETS_KEY, BACKTEST_KEY, CLV_KEY, CALIBRATION_KEY, WEIGHTS_KEY, SEASON_KEY, POWER_KEY, PENDING_KEY, PROPS_KEY, CLUSTER_KEY, GNN_KEY, SCHEDULE_KEY };
