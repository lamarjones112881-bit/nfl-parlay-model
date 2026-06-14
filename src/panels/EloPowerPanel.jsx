import { useState, useEffect } from "react";
import { expectedEloWin, updateElo, eloToSpreadAdj, eloWinProb, eloGrade } from "../ml/eloEngine.js";
import { Panel, PanelTitle, Tag } from "../components/UIKit.jsx";

function EloPowerPanel({ eloRatings, homeTeam, awayTeam, backtestHistory, onUpdateElo }) {
  const [open, setOpen] = useState(false);
  const [allRatings, setAllRatings] = useState(eloRatings || {});

  // Compute model-derived Elo from backtest history
  const modelElo = (() => {
    if (!backtestHistory?.length) return {};
    let ratings = { ...allRatings };
    // Initialize any missing teams
    backtestHistory.forEach(g => {
      if (g.homeTeam && !ratings[g.homeTeam]) ratings[g.homeTeam] = ELO_DEFAULT;
      if (g.awayTeam && !ratings[g.awayTeam]) ratings[g.awayTeam] = ELO_DEFAULT;
    });
    // Apply each result chronologically
    [...backtestHistory].reverse().forEach(g => {
      if (!g.homeTeam || !g.awayTeam || g.actualMargin == null) return;
      const homeWon   = g.actualMargin > 0;
      const margin    = Math.abs(g.actualMargin);
      const homeRating= ratings[g.homeTeam] || ELO_DEFAULT;
      const awayRating= ratings[g.awayTeam] || ELO_DEFAULT;
      const updated   = homeWon
        ? updateElo(homeRating, awayRating, margin)
        : updateElo(awayRating, homeRating, margin);
      ratings[g.homeTeam] = homeWon ? updated.newWinner : updated.newLoser;
      ratings[g.awayTeam] = homeWon ? updated.newLoser  : updated.newWinner;
    });
    return ratings;
  })();

  const homeElo = modelElo[homeTeam] || allRatings[homeTeam] || ELO_DEFAULT;
  const awayElo = modelElo[awayTeam] || allRatings[awayTeam] || ELO_DEFAULT;
  const spreadAdj = eloToSpreadAdj(homeElo, awayElo);
  const winProb   = eloWinProb(homeElo, awayElo);
  const homeGrade = eloGrade(homeElo);
  const awayGrade = eloGrade(awayElo);

  // Sort all teams by rating for leaderboard
  const leaderboard = Object.entries(modelElo)
    .sort((a,b) => b[1] - a[1])
    .slice(0, 32);

  return (
    <Panel border="rgba(251,191,36,0.2)" bg="rgba(251,191,36,0.02)" mb="10px">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}} onClick={()=>setOpen(o=>!o)}>
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          <span style={{fontSize:"11px"}}>📡</span>
          <span style={{fontSize:"10px",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"#fbbf24",fontFamily:"'Barlow Condensed',sans-serif"}}>Elo Power Ratings</span>
          {homeTeam && awayTeam && <Tag color="#fbbf24">Spread adj {spreadAdj >= 0 ? "+" : ""}{spreadAdj} pts</Tag>}
          {homeTeam && <Tag color={homeGrade.color}>{abb(homeTeam)} {homeElo}</Tag>}
          {awayTeam && <Tag color={awayGrade.color}>{abb(awayTeam)} {awayElo}</Tag>}
        </div>
        <span style={{color:"#333",fontSize:"10px"}}>{open ? "▲" : "▼"}</span>
      </div>

      {open && (
        <div style={{marginTop:"12px"}}>
          <div style={{fontSize:"9px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"9px",lineHeight:"1.5"}}>
            Elo ratings update after every logged backtest result using the FiveThirtyEight margin-of-victory multiplier. Each 25 Elo points ≈ 1 point on the spread. Home field adds 65 points (+2.6 pts). Starts at 1500 for all teams.
          </div>

          {/* Matchup comparison */}
          {homeTeam && awayTeam && (
            <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:"10px",alignItems:"center",marginBottom:"12px"}}>
              {[{team:awayTeam,elo:awayElo,grade:awayGrade},{},{team:homeTeam,elo:homeElo,grade:homeGrade}].map((item,i) =>
                i === 1 ? (
                  <div key="mid" style={{textAlign:"center"}}>
                    <div style={{fontSize:"8px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"2px"}}>WIN PROB</div>
                    <div style={{fontSize:"22px",fontWeight:900,color:"#4ade80",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{winProb}%</div>
                    <div style={{fontSize:"8px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"2px"}}>{abb(homeTeam)}</div>
                    <div style={{fontSize:"9px",fontWeight:700,color:Math.abs(spreadAdj)>=1?"#fbbf24":"#555",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"4px"}}>{spreadAdj >= 0 ? "+" : ""}{spreadAdj} pts spread</div>
                  </div>
                ) : (
                  <div key={item.team} style={{background:`${item.grade.color}0d`,border:`1px solid ${item.grade.color}25`,borderRadius:"8px",padding:"10px 12px",textAlign:"center"}}>
                    <div style={{fontSize:"9px",fontWeight:700,color:tc(item.team),fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"4px"}}>{abb(item.team)}</div>
                    <div style={{fontSize:"28px",fontWeight:900,color:item.grade.color,fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{item.elo}</div>
                    <Tag color={item.grade.color}>{item.grade.label}</Tag>
                  </div>
                )
              )}
            </div>
          )}

          {/* Leaderboard */}
          {leaderboard.length > 0 ? (
            <div>
              <div style={{fontSize:"8px",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#555",marginBottom:"5px",fontFamily:"'Barlow Condensed',sans-serif"}}>Model Elo Leaderboard</div>
              <div style={{display:"flex",flexDirection:"column",gap:"2px",maxHeight:"200px",overflowY:"auto"}}>
                {leaderboard.map(([team, rating], i) => {
                  const g = eloGrade(rating);
                  const isActive = team === homeTeam || team === awayTeam;
                  return (
                    <div key={team} style={{display:"flex",alignItems:"center",gap:"7px",padding:"4px 8px",background:isActive?`${g.color}12`:"rgba(255,255,255,0.02)",border:`1px solid ${isActive?g.color+"30":"rgba(255,255,255,0.04)"}`,borderRadius:"4px"}}>
                      <span style={{fontSize:"8px",fontWeight:700,color:"#444",fontFamily:"'Barlow Condensed',sans-serif",width:"22px"}}>#{i+1}</span>
                      <div style={{width:"5px",height:"5px",borderRadius:"50%",background:tc(team),flexShrink:0}}/>
                      <span style={{fontSize:"9px",fontWeight:isActive?800:500,color:isActive?tc(team):"#aaa",fontFamily:"'Barlow Condensed',sans-serif",flex:1}}>{abb(team)}</span>
                      <div style={{width:"80px",height:"3px",borderRadius:"2px",background:"rgba(255,255,255,0.05)",overflow:"hidden"}}>
                        <div style={{width:((rating-1300)/600*100)+"%",height:"100%",background:g.color,borderRadius:"2px"}}/>
                      </div>
                      <span style={{fontSize:"10px",fontWeight:700,color:g.color,fontFamily:"'Barlow Condensed',sans-serif",width:"36px",textAlign:"right"}}>{rating}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{marginTop:"6px",fontSize:"8px",color:"#2a2a2a",fontFamily:"'Barlow Condensed',sans-serif"}}>Updates automatically from backtest results · K=20 · Home field +65 Elo pts · MoV multiplier (538 method)</div>
            </div>
          ) : (
            <div style={{textAlign:"center",padding:"16px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif",fontSize:"10px"}}>Log game results in the Backtest Engine to build Elo ratings</div>
          )}
        </div>
      )}
    </Panel>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SCHEDULE SPOT PANEL
// ─────────────────────────────────────────────────────────────────────────
function ScheduleSpotPanel({ scheduleSpotData, loading, homeTeam, awayTeam }) {

export default EloPowerPanel;
