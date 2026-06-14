import { useState } from "react";
import { calcTrueMarketPrice } from "../utils/sportsbookUtils.js";
import { Panel, PanelTitle, Tag } from "../components/UIKit.jsx";

function SportsbookProfilePanel({ ensemble, lines }) {
  const [open, setOpen]     = useState(false);
  const [selected, setSelected] = useState(null);
  const books = ensemble?.books || [];
  const truePrice = calcTrueMarketPrice(books);

  return (
    <Panel border="rgba(74,222,128,0.18)" bg="rgba(74,222,128,0.02)" mb="10px">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}} onClick={()=>setOpen(o=>!o)}>
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          <span style={{fontSize:"12px"}}>📚</span>
          <span style={{fontSize:"10px",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"#4ade80",fontFamily:"'Barlow Condensed',sans-serif"}}>Sportsbook Profiles</span>
          {truePrice && <Tag color="#4ade80">True Price: -{truePrice}</Tag>}
          {books.length > 0 && <Tag color="#888">{books.length} books tracked</Tag>}
        </div>
        <span style={{color:"#333",fontSize:"10px"}}>{open?"▲":"▼"}</span>
      </div>

      {open && (
        <div style={{marginTop:"12px"}}>
          {/* True market price explainer */}
          {truePrice && (
            <div style={{background:"rgba(74,222,128,0.06)",border:"1px solid rgba(74,222,128,0.15)",borderRadius:"7px",padding:"9px 12px",marginBottom:"12px"}}>
              <div style={{fontSize:"9px",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#4ade80",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"3px"}}>📐 True Market Price (Score-Weighted Consensus)</div>
              <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
                <div style={{fontSize:"24px",fontWeight:900,color:"#4ade80",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>-{truePrice}</div>
                <div style={{fontSize:"9px",color:"#6ee7b7",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.5"}}>Score weighted 2.8× over public books. This is where the US market actually thinks the line should be — not the inflated number your public book shows.</div>
              </div>
            </div>
          )}

          {/* Profile cards */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"5px",marginBottom:"12px"}}>
            {Object.entries(BOOK_PROFILES).map(([name, profile]) => {
              const bookData = books.find(b => b.book === name);
              const isAvailable = !!bookData;
              const isSelected = selected === name;
              return (
                <div key={name}
                  onClick={() => setSelected(isSelected ? null : name)}
                  style={{background:isSelected?`${profile.color}10`:"rgba(255,255,255,0.03)",border:`1px solid ${isSelected?profile.color+"35":"rgba(255,255,255,0.07)"}`,borderRadius:"7px",padding:"9px 10px",cursor:"pointer",transition:"all 0.15s",opacity:isAvailable?1:0.5}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"5px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:"5px"}}>
                      <span style={{fontSize:"13px"}}>{profile.icon}</span>
                      <span style={{fontSize:"10px",fontWeight:800,color:profile.color,fontFamily:"'Barlow Condensed',sans-serif"}}>{name}</span>
                    </div>
                    <Tag color={profile.type==="sharp"?"#4ade80":profile.type==="middle"?"#f59e0b":"#f87171"}>
                      {profile.type==="sharp"?"SHARP":profile.type==="middle"?"MID":"PUBLIC"}
                    </Tag>
                  </div>
                  {/* Sharpness bar */}
                  <div style={{marginBottom:"4px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:"2px"}}>
                      <span style={{fontSize:"7px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif"}}>SHARPNESS</span>
                      <span style={{fontSize:"9px",fontWeight:800,color:profile.color,fontFamily:"'Barlow Condensed',sans-serif"}}>{profile.sharpness}/100</span>
                    </div>
                    <div style={{height:"3px",borderRadius:"2px",background:"rgba(255,255,255,0.06)",overflow:"hidden"}}>
                      <div style={{width:`${profile.sharpness}%`,height:"100%",background:profile.color,borderRadius:"2px"}}/>
                    </div>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between"}}>
                    <span style={{fontSize:"8px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif"}}>Vig: {profile.vig}%</span>
                    <span style={{fontSize:"8px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif"}}>Weight: {profile.weight}×</span>
                    {bookData?.spread && <span style={{fontSize:"9px",fontWeight:700,color:"#ddd",fontFamily:"'Barlow Condensed',sans-serif"}}>-{bookData.spread}</span>}
                  </div>
                  {/* Expanded detail */}
                  {isSelected && (
                    <div style={{marginTop:"7px",paddingTop:"7px",borderTop:"1px solid rgba(255,255,255,0.07)"}}>
                      <div style={{fontSize:"9px",color:"#888",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.5",marginBottom:"5px"}}>{profile.desc}</div>
                      <div style={{display:"flex",gap:"4px",flexWrap:"wrap"}}>
                        {profile.strengths.map(s=><Tag key={s} color="#4ade80">✓ {s}</Tag>)}
                        {profile.weaknesses.map(s=><Tag key={s} color="#f87171">✗ {s}</Tag>)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
              <div style={{fontSize:"9px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"9px",lineHeight:"1.5"}}>
                Sharp books (Score) set the closest thing to a true market price in the US. Public books (DK, FD, Fanatics) are where value lives when they lag behind. Treat any Score vs Fanatics gap of 1.5+ pts as a strong signal.
              </div>
        </div>
      )}
    </Panel>
  );
}

// ── Sharp-Line Arbitrage Panel ────────────────────────────────────────────
function SharpLineArbitragePanel({ ensemble, lines, homeTeam, awayTeam }) {

export default SportsbookProfilePanel;
