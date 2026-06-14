import { Panel, PanelTitle, Tag, Spinner } from "../components/UIKit.jsx";

function ScheduleSpotPanel({ scheduleSpotData, loading, homeTeam, awayTeam }) {
  const [open, setOpen] = useState(false);
  if (!scheduleSpotData && !loading) return null;

  const homeFlags = scheduleSpotData?.home?.flags || [];
  const awayFlags = scheduleSpotData?.away?.flags || [];
  const allFlags  = [
    ...homeFlags.map(f => ({ ...SPOT_FLAGS[f], team: homeTeam, side: "home" })),
    ...awayFlags.map(f => ({ ...SPOT_FLAGS[f], team: awayTeam, side: "away" })),
  ].filter(f => f.label);

  const netAdj = allFlags.reduce((sum, f) => sum + (f.side === "home" ? (f.spreadAdj || 0) : -(f.spreadAdj || 0)), 0);
  const hasFlags = allFlags.length > 0;

  return (
    <Panel border={hasFlags ? "rgba(251,146,60,0.22)" : "rgba(255,255,255,0.07)"} bg="rgba(251,146,60,0.02)" mb="10px">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}} onClick={()=>setOpen(o=>!o)}>
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          <span style={{fontSize:"11px"}}>📅</span>
          <span style={{fontSize:"10px",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"#fb923c",fontFamily:"'Barlow Condensed',sans-serif"}}>Schedule Spot Analysis</span>
          {loading && <Tag color="#f59e0b">loading…</Tag>}
          {allFlags.map((f, i) => <Tag key={i} color={f.color}>{f.icon} {f.label}</Tag>)}
          {!loading && !hasFlags && <Tag color="#555">No spot flags</Tag>}
        </div>
        <span style={{color:"#333",fontSize:"10px"}}>{open ? "▲" : "▼"}</span>
      </div>

      {open && (
        <div style={{marginTop:"11px"}}>
          {!hasFlags ? (
            <div style={{fontSize:"9px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif"}}>
              No significant schedule spot factors for this matchup. Standard rest, no travel disadvantage, no trap game indicators.
            </div>
          ) : (
            <>
              {allFlags.map((f, i) => (
                <div key={i} style={{background:`${f.color}07`,border:`1px solid ${f.color}20`,borderRadius:"7px",padding:"9px 12px",marginBottom:"6px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:"7px",marginBottom:"4px"}}>
                    <span style={{fontSize:"14px"}}>{f.icon}</span>
                    <span style={{fontSize:"10px",fontWeight:800,color:f.color,fontFamily:"'Barlow Condensed',sans-serif"}}>{f.label}</span>
                    <Tag color={f.side === "home" ? tc(homeTeam) : tc(awayTeam)}>{abb(f.team)}</Tag>
                    {f.spreadAdj !== 0 && (
                      <span style={{marginLeft:"auto",fontSize:"12px",fontWeight:900,color:f.spreadAdj > 0 ? "#4ade80" : "#f87171",fontFamily:"'Barlow Condensed',sans-serif"}}>
                        {f.spreadAdj > 0 ? "+" : ""}{f.spreadAdj} pts
                      </span>
                    )}
                  </div>
                  <div style={{fontSize:"9px",color:"#888",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.4"}}>{f.desc}</div>
                </div>
              ))}
              {Math.abs(netAdj) >= 0.5 && (
                <div style={{background:"rgba(251,146,60,0.08)",border:"1px solid rgba(251,146,60,0.2)",borderRadius:"6px",padding:"8px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:"9px",color:"#fed7aa",fontFamily:"'Barlow Condensed',sans-serif"}}>Net schedule spot spread adjustment</span>
                  <span style={{fontSize:"16px",fontWeight:900,color:netAdj > 0 ? "#4ade80" : "#f87171",fontFamily:"'Barlow Condensed',sans-serif"}}>{netAdj > 0 ? "+" : ""}{netAdj.toFixed(1)} pts</span>
                </div>
              )}
            </>
          )}
          <div style={{marginTop:"8px",fontSize:"8px",color:"#2a2a2a",fontFamily:"'Barlow Condensed',sans-serif"}}>Short week -1.5 · Bye rest +1.2 · Division dog +0.7 · Trap game -1.2 · Revenge +0.8</div>
        </div>
      )}
      {loading && <div style={{padding:"8px 0"}}><Skel cols={2}/></div>}
    </Panel>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// PUBLIC BETTING % PANEL
// ─────────────────────────────────────────────────────────────────────────
function PublicBettingPanel({ publicData, loading, homeTeam, awayTeam, lines }) {

export default ScheduleSpotPanel;
