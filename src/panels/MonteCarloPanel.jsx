import { Panel, PanelTitle, Tag } from "../components/UIKit.jsx";

function MonteCarloPanel({ mcResult, running, homeTeam, awayTeam, lines }) {
  if(!mcResult&&!running) return null;
  const [tab, setTab] = useState("summary");
  if(running) return(
    <Panel border="rgba(168,85,247,0.22)" bg="rgba(168,85,247,0.03)" mb="10px">
      <div style={{display:"flex",alignItems:"center",gap:"9px",padding:"6px 0"}}>
        <Spinner/><span style={{fontSize:"10px",fontWeight:700,color:"#a855f7",fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:"0.1em"}}>Running {MC_ITERATIONS.toLocaleString()} Monte Carlo simulations…</span>
      </div>
    </Panel>
  );
  const {coverProb,pushProb,overProb,blowoutProb,oneScoreProb,medianMargin,marginP10,marginP25,marginP75,marginP90,totalP10,totalP25,totalMedian,totalP75,totalP90,scoreDistribution,params}=mcResult;
  const coverColor=coverProb>=55?"#4ade80":coverProb>=50?"#f59e0b":"#f87171";
  const overColor=overProb>=55?"#4ade80":overProb>=50?"#f59e0b":"#f87171";
  const maxDistPct=scoreDistribution?.length?Math.max(...scoreDistribution.map(d=>d.pct)):1;
  const favStr=lines?.favTeam?abb(lines.favTeam):"FAV";

  return(
    <Panel border="rgba(168,85,247,0.22)" bg="rgba(168,85,247,0.03)" mb="10px">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"12px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          <span style={{fontSize:"11px"}}>🎲</span>
          <span style={{fontSize:"10px",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"#a855f7",fontFamily:"'Barlow Condensed',sans-serif"}}>Monte Carlo Simulation</span>
          <Tag color="#a855f7">{MC_ITERATIONS.toLocaleString()} runs</Tag>
        </div>
        <div style={{display:"flex",gap:"4px"}}>
          {["summary","distribution","intervals"].map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{padding:"3px 8px",borderRadius:"4px",border:`1px solid ${tab===t?"rgba(168,85,247,0.4)":"rgba(255,255,255,0.08)"}`,background:tab===t?"rgba(168,85,247,0.12)":"transparent",color:tab===t?"#a855f7":"#444",fontSize:"8px",fontWeight:700,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",textTransform:"capitalize"}}>{t}</button>
          ))}
        </div>
      </div>

      {tab==="summary"&&(
        <>
          {/* Primary metrics */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:"5px",marginBottom:"10px"}}>
            {[
              ["Cover %",`${coverProb}%`,coverColor,`${favStr} covers ATS`,`+${pushProb}% push`],
              ["Over %",`${overProb}%`,overColor,"Total goes over",""],
              ["1-Score Game",`${oneScoreProb}%`,"#38bdf8","≤8 pt margin","high variance"],
              ["Blowout",`${blowoutProb}%`,blowoutProb>25?"#f87171":"#555","21+ pt margin",""],
            ].map(([l,v,c,sub,sub2])=>(
              <div key={l} style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${c}22`,borderRadius:"7px",padding:"8px 7px",textAlign:"center"}}>
                <div style={{fontSize:"7px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"3px"}}>{l}</div>
                <div style={{fontSize:"19px",fontWeight:900,color:c,fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{v}</div>
                <div style={{fontSize:"7px",color:`${c}88`,fontFamily:"'Barlow Condensed',sans-serif",marginTop:"2px"}}>{sub}</div>
                {sub2&&<div style={{fontSize:"6px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"1px"}}>{sub2}</div>}
              </div>
            ))}
          </div>
          {/* Margin fan */}
          <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"7px",padding:"10px 12px",marginBottom:"8px"}}>
            <div style={{fontSize:"8px",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#555",marginBottom:"8px",fontFamily:"'Barlow Condensed',sans-serif"}}>Margin Distribution Fan</div>
            <div style={{position:"relative",height:"32px",marginBottom:"6px"}}>
              {/* P10-P90 bar */}
              <div style={{position:"absolute",top:"50%",left:`${(parseFloat(marginP10)+35)/70*100}%`,right:`${100-(parseFloat(marginP90)+35)/70*100}%`,height:"8px",background:"rgba(168,85,247,0.18)",borderRadius:"4px",transform:"translateY(-50%)"}}/>
              {/* P25-P75 bar */}
              <div style={{position:"absolute",top:"50%",left:`${(parseFloat(marginP25)+35)/70*100}%`,right:`${100-(parseFloat(marginP75)+35)/70*100}%`,height:"14px",background:"rgba(168,85,247,0.32)",borderRadius:"4px",transform:"translateY(-50%)"}}/>
              {/* Median line */}
              <div style={{position:"absolute",top:"10%",left:`${(parseFloat(medianMargin)+35)/70*100}%`,width:"2px",height:"80%",background:"#a855f7",borderRadius:"1px"}}/>
              {/* Zero line */}
              <div style={{position:"absolute",top:"5%",left:"50%",width:"1px",height:"90%",background:"rgba(255,255,255,0.15)",borderRadius:"1px"}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:"7px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif"}}>
              <span>P10: {marginP10}</span><span>P25: {marginP25}</span><span style={{color:"#a855f7",fontWeight:700}}>Med: {medianMargin}</span><span>P75: {marginP75}</span><span>P90: {marginP90}</span>
            </div>
            <div style={{marginTop:"5px",fontSize:"8px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",textAlign:"center"}}>
              {abb(awayTeam)} @ {abb(homeTeam)} · σ margin = {params.marginSD} pts · {params.totalSD} pts total SD
            </div>
          </div>
        </>
      )}

      {tab==="distribution"&&scoreDistribution?.length>0&&(
        <div>
          <div style={{fontSize:"8px",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#555",marginBottom:"8px",fontFamily:"'Barlow Condensed',sans-serif"}}>Score Total Distribution (% of simulations)</div>
          <div style={{display:"flex",alignItems:"flex-end",gap:"3px",height:"80px",marginBottom:"6px"}}>
            {scoreDistribution.filter(d=>d.pct>0).map(d=>{
              const h=(d.pct/maxDistPct)*100;
              const isOver=d.range>parseFloat(lines?.total||44);
              return(
                <div key={d.range} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:"1px"}}>
                  <div style={{width:"100%",height:`${h}%`,background:isOver?"rgba(74,222,128,0.6)":"rgba(248,113,113,0.6)",borderRadius:"2px 2px 0 0",minHeight:"2px"}} title={`${d.range} pts: ${d.pct}%`}/>
                  <div style={{fontSize:"6px",color:"#333",fontFamily:"'Barlow Condensed',sans-serif",transform:"rotate(-45deg)",transformOrigin:"top left",marginTop:"2px",whiteSpace:"nowrap"}}>{d.range}</div>
                </div>
              );
            })}
          </div>
          <div style={{display:"flex",gap:"10px",justifyContent:"center",marginTop:"14px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"4px"}}><div style={{width:"8px",height:"8px",borderRadius:"1px",background:"rgba(248,113,113,0.6)"}}/><span style={{fontSize:"8px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif"}}>Under {lines?.total||44}</span></div>
            <div style={{display:"flex",alignItems:"center",gap:"4px"}}><div style={{width:"8px",height:"8px",borderRadius:"1px",background:"rgba(74,222,128,0.6)"}}/><span style={{fontSize:"8px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif"}}>Over {lines?.total||44}</span></div>
          </div>
        </div>
      )}

      {tab==="intervals"&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
          {[["Margin Confidence Intervals","margin",[[marginP10,marginP90,"80% CI"],[marginP25,marginP75,"50% CI"],[medianMargin,null,"Median"]]],["Total Confidence Intervals","total",[[totalP10,totalP90,"80% CI"],[totalP25,totalP75,"50% CI"],[totalMedian,null,"Median"]]]].map(([title,,rows])=>(
            <div key={title} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"6px",padding:"9px 10px"}}>
              <div style={{fontSize:"8px",fontWeight:700,color:"#555",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"7px"}}>{title}</div>
              {rows.map(([lo,hi,lbl])=>(
                <div key={lbl} style={{display:"flex",alignItems:"center",gap:"7px",marginBottom:"4px"}}>
                  <span style={{fontSize:"7px",color:"#444",fontFamily:"'Barlow Condensed',sans-serif",width:"40px"}}>{lbl}</span>
                  <div style={{flex:1,height:"4px",borderRadius:"2px",background:"rgba(255,255,255,0.06)",overflow:"hidden",position:"relative"}}>
                    <div style={{position:"absolute",left:hi?`${(parseFloat(lo)+40)/80*100}%`:"50%",right:hi?`${100-(parseFloat(hi)+40)/80*100}%`:"50%",top:0,bottom:0,background:"rgba(168,85,247,0.5)",borderRadius:"2px"}}/>
                  </div>
                  <span style={{fontSize:"8px",fontWeight:700,color:"#a855f7",fontFamily:"'Barlow Condensed',sans-serif",width:"60px",textAlign:"right"}}>{hi?`${lo} → ${hi}`:lo}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
      <div style={{marginTop:"7px",fontSize:"8px",color:"#1a1a2a",fontFamily:"'Barlow Condensed',sans-serif"}}>σ margin calibrated to NFL historical variance · Results are probabilistic not deterministic</div>
    </Panel>
  );
}

// ── Concept Drift Panel ───────────────────────────────────────────────────
function DriftDetectorPanel({ driftResult, onResetWeights }) {

export default MonteCarloPanel;
