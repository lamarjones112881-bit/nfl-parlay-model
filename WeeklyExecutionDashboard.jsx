import { useState, useEffect } from "react";
import { getETNow, getWeekKey, getPhaseStatus } from "../utils/scheduleUtils.js";
import { Panel, PanelTitle, Tag } from "../components/UIKit.jsx";

function WeeklyExecutionDashboard({
  onPhase1, onPhase2, onPhase3, onPhase4,
  phase1Running, phase2Running, phase3Running, phase4Running,
  completedPhases, onMarkComplete,
}) {
  const [activePhase, setActivePhase] = useState(null);
  const [tick, setTick] = useState(0);

  // Refresh countdown every 60s
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 60000);
    return () => clearInterval(t);
  }, []);

  const statuses  = EXECUTION_PHASES.map(p => ({ ...p, ...getPhaseStatus(p, completedPhases) }));
  const duePhases = statuses.filter(p => p.isActive);
  const nextPhase = statuses.find(p => !p.isDue && !p.isCompleted);
  // Start open only if a phase is due, otherwise collapsed
  const [open, setOpen] = useState(duePhases.length > 0);

  const phaseHandlers = { P1: onPhase1, P2: onPhase2, P3: onPhase3, P4: onPhase4 };
  const phaseRunning  = { P1: phase1Running, P2: phase2Running, P3: phase3Running, P4: phase4Running };

  return (
    <div style={{marginBottom:"14px"}}>
      {/* Due-phase alert banners */}
      {duePhases.map(p => (
        <div key={p.id} style={{background:`${p.color}10`,border:`2px solid ${p.color}40`,borderRadius:"10px",padding:"10px 14px",marginBottom:"8px",animation:"fadeSlideUp 0.3s ease-out"}}>
          <div style={{display:"flex",alignItems:"center",gap:"10px",flexWrap:"wrap"}}>
            <div style={{width:"32px",height:"32px",borderRadius:"8px",background:`${p.color}20`,border:`1px solid ${p.color}40`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px",flexShrink:0}}>{p.icon}</div>
            <div style={{flex:1,minWidth:"120px"}}>
              <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"2px"}}>
                <div style={{width:"6px",height:"6px",borderRadius:"50%",background:p.color,boxShadow:`0 0 8px ${p.color}`,animation:"pulse 1s infinite"}}/>
                <span style={{fontSize:"11px",fontWeight:900,letterSpacing:"0.08em",textTransform:"uppercase",color:p.color,fontFamily:"'Barlow Condensed',sans-serif"}}>{p.id} — {p.label} — DUE NOW</span>
              </div>
              <div style={{fontSize:"9px",color:`${p.color}99`,fontFamily:"'Barlow Condensed',sans-serif"}}>{p.dayLabel} {p.timeLabel} · {p.desc.slice(0,80)}…</div>
            </div>
            <button onClick={phaseHandlers[p.id]} disabled={phaseRunning[p.id]}
              style={{padding:"8px 16px",borderRadius:"7px",border:"none",background:`linear-gradient(135deg,${p.color},${p.color}bb)`,color:"#000",fontSize:"11px",fontWeight:800,cursor:phaseRunning[p.id]?"not-allowed":"pointer",fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:"0.05em",display:"flex",alignItems:"center",gap:"5px",flexShrink:0}}>
              {phaseRunning[p.id]?<><Spinner/> Running…</>:`▶ Execute ${p.id}`}
            </button>
          </div>
        </div>
      ))}

      {/* Main dashboard */}
      <div style={{background:"rgba(0,0,0,0.4)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"12px",overflow:"hidden"}}>
        <div style={{padding:"11px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",background:"rgba(255,255,255,0.02)",borderBottom:open?"1px solid rgba(255,255,255,0.05)":"none"}} onClick={()=>setOpen(o=>!o)}>
          <div style={{display:"flex",alignItems:"center",gap:"9px"}}>
            <span style={{fontSize:"13px"}}>📅</span>
            <div>
              <div style={{fontSize:"11px",fontWeight:800,letterSpacing:"0.1em",textTransform:"uppercase",color:"#e2e8f0",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>Weekly Execution Sequence</div>
              <div style={{fontSize:"8px",color:"#2a2a2a",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"1px",letterSpacing:"0.07em",textTransform:"uppercase"}}>
                {duePhases.length>0?`${duePhases.length} phase${duePhases.length>1?"s":""} due now`:nextPhase?`Next: ${nextPhase.label} in ${nextPhase.countdown}`:"All phases complete for this week"}
              </div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
            {statuses.filter(p=>p.isCompleted).map(p=><Tag key={p.id} color={p.color}>✓ {p.id}</Tag>)}
            <span style={{color:"#333",fontSize:"11px"}}>{open?"▲":"▼"}</span>
          </div>
        </div>

        {open && (
          <div style={{padding:"14px 16px"}}>
            {/* Timeline */}
            <div style={{position:"relative",marginBottom:"14px"}}>
              {/* Connector line */}
              <div style={{position:"absolute",left:"19px",top:"24px",bottom:"24px",width:"2px",background:"rgba(255,255,255,0.06)",zIndex:0}}/>
              {statuses.map((p, i) => {
                const status = p.isCompleted?"done":p.isActive?"active":p.isDue?"overdue":"upcoming";
                const dotColor = status==="done"?"#4ade80":status==="active"?p.color:status==="overdue"?"#f87171":"#2a2a2a";
                return (
                  <div key={p.id} style={{display:"flex",gap:"12px",marginBottom:i<3?"16px":"0",position:"relative",zIndex:1}}
                    onClick={()=>setActivePhase(activePhase===p.id?null:p.id)}>
                    {/* Node */}
                    <div style={{width:"38px",height:"38px",borderRadius:"10px",background:status==="done"?"rgba(74,222,128,0.12)":status==="active"?`${p.color}18`:"rgba(255,255,255,0.04)",border:`2px solid ${dotColor}${status==="upcoming"?"33":"66"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,cursor:"pointer",transition:"all 0.15s",boxShadow:status==="active"?`0 0 12px ${p.color}44`:status==="done"?"0 0 8px rgba(74,222,128,0.3)":"none"}}>
                      <span style={{fontSize:status==="done"?"14px":"16px"}}>{status==="done"?"✓":p.icon}</span>
                    </div>
                    {/* Content */}
                    <div style={{flex:1,cursor:"pointer",paddingTop:"2px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:"6px",flexWrap:"wrap",marginBottom:"3px"}}>
                        <span style={{fontSize:"10px",fontWeight:800,color:status==="done"?"#4ade80":status==="active"?p.color:status==="overdue"?"#f87171":"#555",fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:"0.05em"}}>{p.dayLabel} {p.timeLabel}</span>
                        <span style={{fontSize:"10px",fontWeight:700,color:status==="done"?"#4ade80":status==="active"?p.color:"#888",fontFamily:"'Barlow Condensed',sans-serif"}}>— {p.label}</span>
                        {status==="done"&&<Tag color="#4ade80">Complete</Tag>}
                        {status==="active"&&<Tag color={p.color}>DUE NOW</Tag>}
                        {status==="upcoming"&&<Tag color="#444">In {p.countdown}</Tag>}
                      </div>
                      <div style={{fontSize:"9px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.4"}}>{p.desc.slice(0,100)}…</div>

                      {/* Expanded steps */}
                      {activePhase===p.id && (
                        <div style={{marginTop:"8px",padding:"8px 10px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"6px"}}>
                          <div style={{fontSize:"8px",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:p.color,fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"6px"}}>{p.id} Execution Steps</div>
                          {p.steps.map((step, si) => (
                            <div key={si} style={{display:"flex",alignItems:"center",gap:"7px",padding:"3px 0",borderBottom:si<p.steps.length-1?"1px solid rgba(255,255,255,0.04)":"none"}}>
                              <div style={{width:"16px",height:"16px",borderRadius:"50%",background:`${p.color}15`,border:`1px solid ${p.color}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"8px",fontWeight:700,color:p.color,fontFamily:"'Barlow Condensed',sans-serif",flexShrink:0}}>{si+1}</div>
                              <span style={{fontSize:"9px",color:"#888",fontFamily:"'Barlow Condensed',sans-serif"}}>{step}</span>
                            </div>
                          ))}
                          <div style={{display:"flex",gap:"5px",marginTop:"8px"}}>
                            <button onClick={e=>{e.stopPropagation();phaseHandlers[p.id]?.();}} disabled={phaseRunning[p.id]}
                              style={{flex:1,padding:"7px",borderRadius:"5px",border:"none",background:phaseRunning[p.id]?"rgba(255,255,255,0.04)":`linear-gradient(135deg,${p.color},${p.color}bb)`,color:phaseRunning[p.id]?"#333":"#000",fontSize:"10px",fontWeight:800,cursor:phaseRunning[p.id]?"not-allowed":"pointer",fontFamily:"'Barlow Condensed',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:"5px"}}>
                              {phaseRunning[p.id]?<><Spinner/>Running {p.id}…</>:`▶ Execute ${p.id}`}
                            </button>
                            {!p.isCompleted && <button onClick={e=>{e.stopPropagation();onMarkComplete(p.id);}}
                              style={{padding:"7px 10px",borderRadius:"5px",border:"1px solid rgba(74,222,128,0.2)",background:"rgba(74,222,128,0.06)",color:"#4ade80",fontSize:"9px",cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif"}}>✓ Done</button>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div style={{padding:"7px 10px",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:"6px",fontSize:"9px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.5"}}>
              📅 All times Eastern. Week resets Tuesday. Phases unlock in sequence and persist until next Tuesday. App must be open to execute — no background scheduling in PWA.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


// ── Model Ratings ────────────────────────────────────────────────────────────
function computeModelRatings(backtestHistory) {

export default WeeklyExecutionDashboard;
