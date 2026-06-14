// ── Weather Utilities ───────────────────────────────────────────────────────
import { STADIUM_COORDS } from "../constants/teams.js";

function calcWeatherSeverity(tempF, windMph, precipPct) {
  // Temperature component: comfortable 65°F → 0, freezing 32°F → 45, extreme 10°F → 100
  const tScore = tempF >= 65 ? 0
    : tempF >= 50 ? (65 - tempF) / 15 * 15
    : tempF >= 32 ? 15 + (50 - tempF) / 18 * 30
    : tempF >= 10 ? 45 + (32 - tempF) / 22 * 35
    : 80 + Math.min(20, (10 - tempF) / 10 * 20);

  // Wind component: 0mph → 0, 15mph → 25, 25mph → 60, 35mph+ → 100
  const wScore = windMph <= 0 ? 0
    : windMph <= 10 ? windMph / 10 * 12
    : windMph <= 20 ? 12 + (windMph - 10) / 10 * 28
    : windMph <= 30 ? 40 + (windMph - 20) / 10 * 35
    : Math.min(100, 75 + (windMph - 30) / 10 * 25);

  // Precipitation component: 0% → 0, 30% → 20, 60% → 55, 90%+ → 100
  const pScore = precipPct <= 0 ? 0
    : precipPct <= 30 ? precipPct / 30 * 20
    : precipPct <= 60 ? 20 + (precipPct - 30) / 30 * 35
    : Math.min(100, 55 + (precipPct - 60) / 40 * 45);

  // Weighted composite: wind dominates passing game impact
  const severity = Math.round(tScore * 0.25 + wScore * 0.50 + pScore * 0.25);

  // Derive spread and total adjustments from severity
  const totalAdj  = severity <= 5  ?  0
    : severity <= 20  ? -(severity / 20) * 1.5
    : severity <= 40  ? -1.5 - (severity - 20) / 20 * 2.0
    : severity <= 65  ? -3.5 - (severity - 40) / 25 * 2.0
    : -5.5 - Math.min(1.5, (severity - 65) / 35 * 1.5);

  const spreadAdj = severity <= 10 ? 0
    : severity <= 40 ? (severity - 10) / 30 * 0.8
    : severity <= 70 ? 0.8 + (severity - 40) / 30 * 0.7
    : 1.5 + Math.min(0.5, (severity - 70) / 30 * 0.5);

  // Auto-category
  const category = severity <= 8  ? "ideal"
    : severity <= 25 ? (windMph >= 15 ? "wind" : "cold")
    : severity <= 50 ? (precipPct >= 35 ? "rain" : "wind")
    : precipPct >= 40 ? "rain" : "wind";

  return {
    severity,
    totalAdj:  parseFloat(totalAdj.toFixed(1)),
    spreadAdj: parseFloat(spreadAdj.toFixed(1)),
    category,
    components: {
      tempScore:  Math.round(tScore),
      windScore:  Math.round(wScore),
      precipScore:Math.round(pScore),
    },
    label: severity <= 8  ? "Ideal"
      : severity <= 25 ? "Mild"
      : severity <= 50 ? "Moderate"
      : severity <= 70 ? "Severe"
      : "Extreme",
    color: severity <= 8  ? "#4ade80"
      : severity <= 25 ? "#86efac"
      : severity <= 50 ? "#f59e0b"
      : severity <= 70 ? "#f87171"
      : "#ef4444",
    note: severity <= 8  ? null
      : `${Math.abs(parseFloat(totalAdj.toFixed(1)))} pts off total, ${spreadAdj > 0 ? "+" : ""}${spreadAdj.toFixed(1)} spread adj — severity ${severity}/100`,
  };
}

// Enhanced weatherAdjust that uses severity when forecast data available
function weatherAdjustWithSeverity(category, severityResult) {
  if (severityResult) return severityResult;
  // Fall back to existing binary system
  if(category==="dome"||category==="ideal") return {totalAdj:0,spreadAdj:0,note:null,severity:0,label:"Ideal",color:"#4ade80"};
  if(category==="wind")  return {totalAdj:-3.5,spreadAdj:0.5,note:"Wind 20+ mph → -3.5 total",severity:55,label:"Severe",color:"#f87171"};
  if(category==="cold")  return {totalAdj:-2.0,spreadAdj:0.5,note:"Cold <35°F → -2.0 total",severity:35,label:"Moderate",color:"#f59e0b"};
  if(category==="rain")  return {totalAdj:-4.5,spreadAdj:1.0,note:"Rain/Snow → -4.5 total",severity:65,label:"Severe",color:"#f87171"};
  return {totalAdj:0,spreadAdj:0,note:null,severity:0,label:"Ideal",color:"#4ade80"};
}

// ── Weather Severity Panel ─────────────────────────────────────────────────
function WeatherSeverityBar({ severityResult }) {

export { calcWeatherSeverity, weatherAdjustWithSeverity };
