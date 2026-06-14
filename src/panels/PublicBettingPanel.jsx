import { Panel, PanelTitle, Tag, Spinner } from "../components/UIKit.jsx";

function PublicBettingPanel({ publicData, loading, homeTeam, awayTeam, lines }) {
  const [open, setOpen] = useState(false);
  if (!publicData && !loading) return null;

  const spreadPublic = publicData?.spread;
  const totalPublic  = publicData?.total;
  const mlPublic     = publicData?.moneyline;

  // Detect reverse line movement (sharp indicator)
  function detectRLM(publicPct, lineMoved) {
    if (!publicPct || !lineMoved) return null;
    const publicOnFav = publicPct >= 55;
    const lineMovedTowardDog = lineMoved === "dog"; // line moved toward dog despite public on fav
    if (publicOnFav && lineMovedTowardDog) return { isRLM: true, label: "🔥 RLM — sharps on dog", color: "#fbbf24" };
    return { isRLM: false };
  }

  const spreadRLM = detectRLM(spreadPublic?.favPct, spreadPublic?.lineMove);

  function PublicBar({ label, favTeam, favPct, dogPct, odds, rlm }) {
    if (!favPct) return null;
    const isSharpFade = favPct >= 70; // heavy public = potential sharp fade
    return (
      <div style={{marginBottom:"10px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"4px"}}>
          <span style={{fontSize:"9px",fontWeight:700,color:"#555",fontFamily:"'Barlow Condensed',sans-serif",textTransform:"uppercase",letterSpacing:"0.07em"}}>{label}</span>
          {rlm?.isRLM && <Tag color={rlm.color}>{rlm.label}</Tag>}
          {isSharpFade && !rlm?.isRLM && <Tag color="#f59e0b">⚠ Heavy public — fade signal</Tag>}
        </div>
        {/* Bar */}
        <div style={{display:"flex",height:"28px",borderRadius:"6px",overflow:"hidden",marginBottom:"4px"}}>
          <div style={{width:favPct+"%",background:tc(favTeam)+"cc",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px",fontWeight:800,color:"#fff",fontFamily:"'Barlow Condensed',sans-serif",transition:"width 0.5s ease"}}>
            {favPct >= 20 ? favPct+"%" : ""}
          </div>
          <div style={{flex:1,background:"rgba(255,255,255,0.08)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px",fontWeight:800,color:"#ccc",fontFamily:"'Barlow Condensed',sans-serif"}}>
            {dogPct >= 20 ? dogPct+"%" : ""}
          </div>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:"8px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif"}}>
          <span style={{color:tc(favTeam)}}>{abb(favTeam)} {favPct}% public</span>
          {odds && <span>{odds}</span>}
        </div>
      </div>
    );
  }

  return (
    <Panel border={spreadRLM?.isRLM ? "rgba(251,191,36,0.3)" : "rgba(139,92,246,0.18)"} bg={spreadRLM?.isRLM ? "rgba(251,191,36,0.04)" : "rgba(139,92,246,0.02)"} mb="10px">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}} onClick={()=>setOpen(o=>!o)}>
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          <span style={{fontSize:"11px"}}>👥</span>
          <span style={{fontSize:"10px",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"#a78bfa",fontFamily:"'Barlow Condensed',sans-serif"}}>Public Betting %</span>
          {loading && <Tag color="#f59e0b">loading…</Tag>}
          {spreadPublic?.favPct && <Tag color={spreadPublic.favPct >= 70 ? "#f59e0b" : "#a78bfa"}>{abb(spreadPublic.favTeam || homeTeam)} {spreadPublic.favPct}% spread</Tag>}
          {spreadRLM?.isRLM && <Tag color="#fbbf24">🔥 RLM Detected</Tag>}
        </div>
        <span style={{color:"#333",fontSize:"10px"}}>{open ? "▲" : "▼"}</span>
      </div>

      {open && publicData && !loading && (
        <div style={{marginTop:"11px"}}>
          <div style={{fontSize:"9px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"9px",lineHeight:"1.5"}}>
            Public betting % from Action Network. When 70%+ of bets are on one side and the line moves the other direction (Reverse Line Movement), this is sharp money on the other side. Sharps are right more often than the public over large samples.
          </div>
          {spreadPublic && <PublicBar label="Spread" favTeam={spreadPublic.favTeam || homeTeam} favPct={spreadPublic.favPct} dogPct={100 - (spreadPublic.favPct || 50)} odds={spreadPublic.odds} rlm={spreadRLM}/>}
          {totalPublic  && <PublicBar label="Total"  favTeam={totalPublic.overTeam || homeTeam} favPct={totalPublic.overPct} dogPct={100 - (totalPublic.overPct || 50)} odds={totalPublic.odds}/>}
          {mlPublic     && <PublicBar label="Moneyline" favTeam={mlPublic.favTeam || homeTeam} favPct={mlPublic.favPct} dogPct={100 - (mlPublic.favPct || 50)} odds={mlPublic.odds}/>}
          {publicData.sharpNote && (
            <div style={{background:"rgba(251,191,36,0.07)",border:"1px solid rgba(251,191,36,0.2)",borderRadius:"6px",padding:"8px 11px",marginTop:"5px"}}>
              <div style={{fontSize:"8px",fontWeight:700,color:"#fbbf24",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"2px",letterSpacing:"0.08em",textTransform:"uppercase"}}>Sharp Money Signal</div>
              <div style={{fontSize:"10px",color:"#fde68a",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.4"}}>{publicData.sharpNote}</div>
            </div>
          )}
          <div style={{marginTop:"7px",fontSize:"8px",color:"#2a2a2a",fontFamily:"'Barlow Condensed',sans-serif"}}>Source: Action Network · 70%+ public = fade signal · RLM = strong sharp indicator · Updates through kickoff</div>
        </div>
      )}
      {loading && <div style={{padding:"8px 0"}}><Skel cols={2}/></div>}
    </Panel>
  );
}


// ── Advanced Efficiency Signals ──────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

export default PublicBettingPanel;
