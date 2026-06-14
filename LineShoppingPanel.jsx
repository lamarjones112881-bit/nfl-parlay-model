import { Panel, PanelTitle, Tag } from "../components/UIKit.jsx";

function LineShoppingPanel({ ensemble, lines, gameResult, homeTeam, awayTeam }) {
  if(!ensemble?.books?.length) return null;
  const books=ensemble.books;
  const pickDir = gameResult?.winner ? (gameResult.winner===homeTeam?"home":"away") : null;
  // Best spread for each side
  const bestHomeSpread = pickDir==="home" ? books.reduce((best,b)=>b.spread<(best?.spread||99)?b:best,null) : null;
  const bestAwaySpread = pickDir==="away" ? books.reduce((best,b)=>b.spread>(best?.spread||-99)?b:best,null) : null;
  const bestTotal = books.reduce((best,b)=>b.total>(best?.total||0)?b:best,null);
  const spreadRange = books.length>1?Math.max(...books.map(b=>b.spread||0))-Math.min(...books.map(b=>b.spread||0)):0;
  const halfPtValue = spreadRange>=0.5?"Worth shopping":null;
  return(
    <Panel border="rgba(16,185,129,0.18)" bg="rgba(16,185,129,0.02)" mb="10px">
      <PanelTitle icon="🛒" title="Line Shopping" tag={spreadRange>=0.5?"Best Line Available":undefined} tagColor="#10b981"/>
      <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(books.length,4)},1fr)`,gap:"5px",marginBottom:"8px"}}>
        {books.map((b,i)=>{
          const isBestSpread=(pickDir==="home"&&b===bestHomeSpread)||(pickDir==="away"&&b===bestAwaySpread);
          const isBestTotal=b===bestTotal;
          return(
            <div key={i} style={{background:isBestSpread||isBestTotal?"rgba(16,185,129,0.08)":"rgba(255,255,255,0.04)",border:`1px solid ${isBestSpread||isBestTotal?"rgba(16,185,129,0.25)":"rgba(255,255,255,0.06)"}`,borderRadius:"7px",padding:"8px 7px",textAlign:"center",position:"relative"}}>
              {(isBestSpread||isBestTotal)&&<div style={{position:"absolute",top:"-6px",left:"50%",transform:"translateX(-50%)",background:"#10b981",borderRadius:"3px",padding:"1px 5px",fontSize:"6px",fontWeight:700,color:"#000",fontFamily:"'Barlow Condensed',sans-serif",whiteSpace:"nowrap"}}>{isBestSpread?"BEST SPREAD":"BEST TOTAL"}</div>}
              <div style={{fontSize:"8px",fontWeight:700,color:isBestSpread||isBestTotal?"#10b981":"#555",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"4px"}}>{b.book}</div>
              <div style={{fontSize:"13px",fontWeight:900,color:"#4ade80",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{b.favTeam?abb(b.favTeam):""} -{b.spread||"?"}</div>
              <div style={{fontSize:"11px",fontWeight:700,color:"#c084fc",fontFamily:"'Barlow Condensed',sans-serif",marginTop:"2px"}}>{b.total||"—"}</div>
            </div>
          );
        })}
      </div>
      {/* Shopping edge */}
      <div style={{display:"flex",gap:"7px",flexWrap:"wrap"}}>
        {spreadRange>=0.5&&<div style={{flex:1,background:"rgba(16,185,129,0.05)",border:"1px solid rgba(16,185,129,0.14)",borderRadius:"6px",padding:"7px 10px"}}>
          <div style={{fontSize:"8px",fontWeight:700,color:"#10b981",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"2px",textTransform:"uppercase",letterSpacing:"0.08em"}}>Spread Divergence: {spreadRange.toFixed(1)} pts</div>
          <div style={{fontSize:"9px",color:"#6ee7b7",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:"1.4"}}>{spreadRange>=1?"Significant divergence — shop for best number. A half-point off a key number is worth +3-4% cover rate.":"Get the best available spread. Even 0.5pt matters on key numbers -3/-7."}</div>
        </div>}
        {pickDir&&(bestHomeSpread||bestAwaySpread)&&<div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"6px",padding:"7px 10px",textAlign:"center",flexShrink:0}}>
          <div style={{fontSize:"8px",color:"#555",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:"2px"}}>BEST BOOK FOR YOUR PICK</div>
          <div style={{fontSize:"13px",fontWeight:900,color:"#10b981",fontFamily:"'Barlow Condensed',sans-serif"}}>{(bestHomeSpread||bestAwaySpread)?.book}</div>
          <div style={{fontSize:"9px",color:"#4ade80",fontFamily:"'Barlow Condensed',sans-serif"}}>{pickDir==="home"?abb(homeTeam):abb(awayTeam)} -{(bestHomeSpread||bestAwaySpread)?.spread}</div>
        </div>}
      </div>
    </Panel>
  );
}

// ── Injury Impact Panel ───────────────────────────────────────────────────
function InjuryImpactPanel({ injuries, homeTeam, awayTeam, lines }) {
  if(!injuries||(!homeTeam&&!awayTeam)) return null;

export default LineShoppingPanel;
