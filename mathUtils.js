// ── Math & EV Utilities ─────────────────────────────────────────────────────
function americanToDecimal(odds) {
  const o = parseFloat(odds);
  if(isNaN(o)) return null;
  return o > 0 ? (o/100)+1 : (100/Math.abs(o))+1;
}
function decimalToImplied(decimal) {
  if(!decimal||decimal<=1) return null;
  return (1/decimal)*100;
}
function calcEV(modelWinPct, decimalOdds) {
  if(!modelWinPct||!decimalOdds) return null;
  const p = modelWinPct/100;
  const q = 1-p;
  const ev = (p*(decimalOdds-1) - q)*100;
  return parseFloat(ev.toFixed(2));
}
function calcKelly(modelWinPct, decimalOdds, fraction=0.25) {
  if(!modelWinPct||!decimalOdds||decimalOdds<=1) return null;
  const p = modelWinPct/100;
  const b = decimalOdds-1;
  const kelly = (b*p - (1-p)) / b;
  const quarterKelly = kelly * fraction;
  return { full:parseFloat((kelly*100).toFixed(2)), quarter:parseFloat((quarterKelly*100).toFixed(2)), recommended:parseFloat((quarterKelly*100).toFixed(2)) };
}

// ── Injury impact table ───────────────────────────────────────────────────
const INJURY_IMPACT = {
  QB: { starter:{out:-3.8,doubtful:-2.2,questionable:-1.0}, label:"QB" },
  LT: { starter:{out:-0.9,doubtful:-0.5,questionable:-0.2}, label:"LT" },
  RT: { starter:{out:-0.6,doubtful:-0.3,questionable:-0.1}, label:"RT" },
  LG: { starter:{out:-0.5,doubtful:-0.3,questionable:-0.1}, label:"LG" },
  RG: { starter:{out:-0.5,doubtful:-0.3,questionable:-0.1}, label:"RG" },
  C:  { starter:{out:-0.5,doubtful:-0.3,questionable:-0.1}, label:"C"  },
  RB: { starter:{out:-0.8,doubtful:-0.5,questionable:-0.2}, label:"RB" },
  WR: { starter:{out:-0.7,doubtful:-0.4,questionable:-0.2}, label:"WR" },
  TE: { starter:{out:-0.5,doubtful:-0.3,questionable:-0.1}, label:"TE" },
  EDGE:{ starter:{out:-0.7,doubtful:-0.4,questionable:-0.1}, label:"Edge" },
  CB: { starter:{out:-0.6,doubtful:-0.3,questionable:-0.1}, label:"CB" },
  S:  { starter:{out:-0.4,doubtful:-0.2,questionable:-0.1}, label:"S"  },
  LB: { starter:{out:-0.4,doubtful:-0.2,questionable:-0.1}, label:"LB" },
};

function parseInjuryImpact(injuryText, teamName) {
  if(!injuryText||!teamName) return {total:0,items:[],grade:"OK"};
  const lines = injuryText.split('\n').filter(l=>l.includes(teamName)||l.includes(abb(teamName)));
  const section = [];
  let inSection=false;
  injuryText.split('\n').forEach(l=>{
    if(l.toLowerCase().includes(teamName.toLowerCase())) inSection=true;
    if(inSection) section.push(l);
    // Stop at next team heading
    if(inSection && l.trim().endsWith("Injuries:") && !l.toLowerCase().includes(teamName.toLowerCase())) inSection=false;
  });
  const text = section.join(' ').toLowerCase();
  let total=0;
  const items=[];
  Object.entries(INJURY_IMPACT).forEach(([pos,data])=>{
    const posReg=new RegExp(`\\b${pos.toLowerCase()}\\b`);
    if(!posReg.test(text)) return;
    let status='questionable', impact=0;
    if(/\bout\b/.test(text)&&posReg.test(text.slice(Math.max(0,text.search(posReg)-50),text.search(posReg)+100))) { status='out'; impact=data.starter.out; }
    else if(/doubtful/.test(text)) { status='doubtful'; impact=data.starter.doubtful; }
    else { status='questionable'; impact=data.starter.questionable; }
    if(impact!==0){ total+=impact; items.push({pos:data.label,status,impact}); }
  });
  const grade = total<=-3?"CRITICAL":total<=-1.5?"SIGNIFICANT":total<=-0.5?"MINOR":"OK";
  return {total:parseFloat(total.toFixed(1)),items,grade};
}

// ─────────────────────────────────────────────────────────────────────────
// UI COMPONENTS
// ─────────────────────────────────────────────────────────────────────────

// ── EV + Kelly Panel ──────────────────────────────────────────────────────

export { americanToDecimal, decimalToImplied, calcEV, calcKelly, parseInjuryImpact };
