import { useState } from "react";
import { detectSharpLineGaps, detectMiddles, calcTrueMarketPrice } from "../utils/sportsbookUtils.js";
import { Panel, PanelTitle, Tag } from "../components/UIKit.jsx";

function SharpLineArbitragePanel({ ensemble, lines, homeTeam, awayTeam }) {
  const [open, setOpen] = useState(false);
  const books = ensemble?.books || [];
  const gaps    = detectSharpLineGaps(books, lines);
  const middles = detectMiddles(books, lines);

  const hasOpps = gaps.length > 0 || middles.length > 0;
  const topGap  = gaps[0];
  const headerColor = topGap?.severity === "EXPLOIT" ? "#ef4444"
    : topGap?.severity === "STRONG" ? "#f87171"
    : topGap?.severity === "OPPORTUNITY" ? "#f59e0b" : "#888";

  if (!books.length && !hasOpps) return null;

  return (
    <Panel border={hasOpps?`${headerColor}25`:"rgba(255,255,255,0.07)"} bg={hasOpps?`${headerColor}04`:"rgba(255,255,255,0.01)"} mb="10px">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}} onClick={()=>setOpen(o=>!o)}>
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          {hasOpps && <div style={{width:"8px",height:"8px",borderRadius:"50%",background:headerColor,boxShadow:`0 0 8px ${headerColor}`,animation:topGap?.severity==="EXPLOIT"?"pulse 1s infinite":"none",flexShrink:0}}/>}
          <span style={{fontSize:"12px"}}>⚡</span>
          <span style={{fontSize:"10px",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:hasOpps?headerColor:"#555",fontFamily:"'Barlow Condensed',sans-serif"}}>Sharp-Line Arbitrage</span>
          {gaps.length > 0 && <Tag color={headerColor}>{gaps.length} gap{gaps.length>1?"s":""}</Tag>}
          {middles.length > 0 && <Tag color="#a78bfa">{middles.length} middle{middles.length>1?"s":""}</Tag>}
          {!hasOpps && books.length > 0 && <Tag color="#555">Lines efficient</Tag>}
        </div>
        <span style={{color:"#333",fontSize:"10px"}}>{open?"▲":"▼"}</span>
      </div>

      {open && (
        <div style={{marginTop:"12px"}}>
          {!hasOpps && (
            <div style={{textAlign:"center",padding:"16px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",fontSize:"10px"}}>
              {books.length > 0 ? "All books are within 0.5 pts — lines are efficient. No exploitable gaps right now." : "Fetch lines to scan for arbitrage opportunities."}
            </div>
          )}

          {/* Sharp-line gaps */}
          {gaps.length > 0 && (
            <div style={{marginBottom:"12px"}}>
              <div style={{fontSize:"9px",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#555",marginBottom:"7px",fontFamily:"'Barlow Condensed',sans-serif"}}>📐 Line Value Gaps (Sharp vs Soft)</div>
              {gaps.map((g, i) => (
                <div key={i} style={{background:`${g.color}07`,border:`1px solid ${g.color}22`,borderRadius:"8px",padding:"10px 13px",marginBottom:"6px"}}>
                  {/* Header */}
                  <div style={{display:"flex",alignItems:"center",gap:"7px",marginBottom:"7px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:"5px",flex:1}}>
                      <Tag color={g.color}>{g.severity}</Tag>
                      <span style={{fontSize:"9px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif"}}>{g.sharpBook} vs {g.softBook}</span>
                    </div>
                    <div style={{fontSize:"18px",fontWeight:900,color:g.color,fontFamily:"'Barlow Condensed',sans-serif"}}>{g.gap} pts</div>
                  </div>
                  {/* Book comparison */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:"6px",alignItems:"center",marginBottom:"7px"}}>
                    {[{book:g.sharpBook,spread:g.sharpSpread,type:"sharp"},{},{book:g.softBook,spread:g.softSpread,type:"soft"}].map((b,bi)=>
                      bi===1
                        ? <div key="arrow" style={{textAlign:"center",fontSize:"14px",color:`${g.color}66`}}>→</div>
                        : <div key={b.book} style={{background:b.type==="sharp"?"rgba(74,222,128,0.07)":"rgba(248,113,113,0.07)",border:`1px solid ${b.type==="sharp"?"rgba(74,222,128,0.18)":"rgba(248,113,113,0.18)"}`,borderRadius:"6px",padding:"7px 10px",textAlign:"center"}}>
                            <div style={{fontSize:"8px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"2px"}}>
                              {BOOK_PROFILES[b.book]?.icon} {b.book}
                            </div>
                            <div style={{fontSize:"18px",fontWeight:900,color:b.type==="sharp"?"#4ade80":"#f87171",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>-{b.spread}</div>
                            <Tag color={b.type==="sharp"?"#4ade80":"#f87171"}>{b.type==="sharp"?"SHARP":"SOFT"}</Tag>
                          </div>
                    )}
                  </div>
                  {/* Action */}
                  <div style={{background:`${g.color}0a`,border:`1px solid ${g.color}1a`,borderRadius:"5px",padding:"7px 10px",marginBottom:"4px"}}>
                    <div style={{fontSize:"8px",fontWeight:700,color:g.color,fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"2px",textTransform:"uppercase",letterSpacing:"0.08em"}}>⚡ ACTION</div>
                    <div style={{fontSize:"10px",color:`${g.color}cc`,fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.4"}}>{g.betSide}</div>
                  </div>
                  <div style={{fontSize:"8px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif"}}>{g.valueNote}</div>
                </div>
              ))}
            </div>
          )}

          {/* Middle opportunities */}
          {middles.length > 0 && (
            <div>
              <div style={{fontSize:"9px",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#a78bfa",marginBottom:"7px",fontFamily:"'Barlow Condensed',sans-serif"}}>🎯 Middle Opportunities</div>
              <div style={{fontSize:"9px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"8px",lineHeight:"1.5"}}>
                A "middle" means betting both sides at different books. If the final margin lands in the window, both bets win. Otherwise you lose the juice on one side (~5-6 cents per dollar).
              </div>
              {middles.map((m, i) => (
                <div key={i} style={{background:"rgba(167,139,250,0.06)",border:"1px solid rgba(167,139,250,0.15)",borderRadius:"8px",padding:"10px 13px",marginBottom:"6px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:"7px",marginBottom:"7px"}}>
                    <div style={{flex:1,display:"flex",gap:"5px",alignItems:"center"}}>
                      <Tag color="#a78bfa">{m.window} pt window</Tag>
                      {m.isKeyNumber && <Tag color="#fbbf24">⚠ Key # in window</Tag>}
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:"8px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif"}}>Hit prob</div>
                      <div style={{fontSize:"16px",fontWeight:900,color:"#a78bfa",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{m.hitPct}%</div>
                    </div>
                  </div>
                  {/* Window visual */}
                  <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"7px"}}>
                    <div style={{background:"rgba(255,255,255,0.05)",borderRadius:"5px",padding:"6px 10px",textAlign:"center",flex:1}}>
                      <div style={{fontSize:"7px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif"}}>{m.bookA}</div>
                      <div style={{fontSize:"15px",fontWeight:900,color:"#a78bfa",fontFamily:"'Barlow Condensed',sans-serif"}}>-{m.spreadA}</div>
                    </div>
                    <div style={{textAlign:"center"}}>
                      <div style={{fontSize:"8px",color:"#a78bfa",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700}}>WINDOW</div>
                      <div style={{fontSize:"11px",fontWeight:900,color:"#fbbf24",fontFamily:"'Barlow Condensed',sans-serif"}}>{m.spreadB + 0.5} – {m.spreadA - 0.5}</div>
                    </div>
                    <div style={{background:"rgba(255,255,255,0.05)",borderRadius:"5px",padding:"6px 10px",textAlign:"center",flex:1}}>
                      <div style={{fontSize:"7px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif"}}>{m.bookB}</div>
                      <div style={{fontSize:"15px",fontWeight:900,color:"#a78bfa",fontFamily:"'Barlow Condensed',sans-serif"}}>-{m.spreadB}</div>
                    </div>
                  </div>
                  <div style={{fontSize:"9px",color:"#c4b5fd",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"3px",lineHeight:"1.4"}}><strong>Bet:</strong> {m.instruction}</div>
                  <div style={{fontSize:"9px",color:"#4ade80",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"2px"}}>✓ Win if: {m.winCondition}</div>
                  <div style={{fontSize:"8px",color:"#f87171",fontFamily:"'Barlow Condensed',sans-serif"}}>✗ Worst case: {m.worstCase}</div>
                  {m.isKeyNumber && (
                    <div style={{marginTop:"5px",padding:"5px 8px",background:"rgba(251,191,36,0.07)",border:"1px solid rgba(251,191,36,0.18)",borderRadius:"4px",fontSize:"9px",color:"#fbbf24",fontFamily:"'Barlow Condensed',sans-serif"}}>
                      ⭐ Key number in window — NFL games land on key numbers (3, 7, 6, 4) far more often than random chance. This middle has above-average hit probability.
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div style={{marginTop:"8px",fontSize:"8px",color:"#1a1a2a",fontFamily:"'Barlow Condensed',sans-serif"}}>
            Gaps auto-detected from market ensemble data · Line value strategy, not guaranteed profit · True arbitrage (risk-free) is rare but middles with key numbers approach it
          </div>
        </div>
      )}
    </Panel>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// THREE FREE SIGNAL ADDITIONS

export default SharpLineArbitragePanel;
