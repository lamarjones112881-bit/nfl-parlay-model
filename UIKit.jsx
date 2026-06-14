import { useState } from "react";

// ── Shared UI Primitives ────────────────────────────────────────────────────
function Spinner(){return <span style={{width:"10px",height:"10px",border:"1.5px solid rgba(255,255,255,0.2)",borderTopColor:"#aaa",borderRadius:"50%",display:"inline-block",animation:"spin 0.7s linear infinite"}}/>;}
function Tag({children,color="#555"}){return <span style={{fontSize:"9px",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color,background:`${color}18`,border:`1px solid ${color}33`,borderRadius:"4px",padding:"2px 6px",fontFamily:"'Barlow Condensed',sans-serif"}}>{children}</span>;}
function Panel({children,mb="12px",border="rgba(255,255,255,0.07)",bg="rgba(255,255,255,0.03)"}){return <div style={{background:bg,border:`1px solid ${border}`,borderRadius:"12px",padding:"16px",marginBottom:mb}}>{children}</div>;}
function PanelTitle({icon,title,tag,tagColor="#4ade80"}){return <div style={{fontSize:"10px",fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",color:"#666",marginBottom:"12px",fontFamily:"'Barlow Condensed',sans-serif",display:"flex",alignItems:"center",gap:"7px"}}>{icon} {title}{tag&&<Tag color={tagColor}>{tag}</Tag>}</div>;}
function Skel({cols=3}){return <div style={{display:"grid",gridTemplateColumns:`repeat(${cols},1fr)`,gap:"6px"}}>{Array(cols).fill(0).map((_,i)=><div key={i} style={{background:"rgba(255,255,255,0.04)",borderRadius:"6px",padding:"10px",textAlign:"center"}}><div style={{height:"7px",width:"55%",background:"rgba(255,255,255,0.07)",borderRadius:"3px",margin:"0 auto 5px",animation:"pulse 1s infinite"}}/><div style={{height:"16px",width:"70%",background:"rgba(255,255,255,0.07)",borderRadius:"3px",margin:"0 auto",animation:"pulse 1s infinite"}}/></div>)}</div>;}
function WinBar({homeWin,awayWin,homeTeam,awayTeam}){
  const [a,setA]=useState(false);
  useEffect(()=>{setTimeout(()=>setA(true),120);},[homeWin,awayWin]);
  return(<div><div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}><span style={{fontSize:"11px",color:"#aaa",fontFamily:"'Barlow Condensed',sans-serif"}}>{abb(awayTeam)} {awayWin}%</span><span style={{fontSize:"11px",color:"#aaa",fontFamily:"'Barlow Condensed',sans-serif"}}>{homeWin}% {abb(homeTeam)}</span></div><div style={{height:"9px",borderRadius:"5px",background:"rgba(255,255,255,0.06)",overflow:"hidden",display:"flex"}}><div style={{width:a?`${awayWin}%`:"50%",background:tc(awayTeam),transition:"width 1.2s cubic-bezier(0.16,1,0.3,1)",opacity:0.9}}/><div style={{width:a?`${homeWin}%`:"50%",background:tc(homeTeam),transition:"width 1.2s cubic-bezier(0.16,1,0.3,1)",opacity:0.9}}/></div></div>);
}
function StatFld({label,value,onChange,hl}){return(<div><label style={{display:"block",fontSize:"9px",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:hl?"#6ee7b7":"#444",marginBottom:"3px",fontFamily:"'Barlow Condensed',sans-serif",transition:"color 0.4s"}}>{label}</label><input type="number" value={value} onChange={e=>onChange(e.target.value)} placeholder="—" style={{width:"100%",padding:"7px 9px",background:hl?"rgba(74,222,128,0.06)":"rgba(255,255,255,0.04)",border:`1px solid ${hl?"rgba(74,222,128,0.25)":"rgba(255,255,255,0.08)"}`,borderRadius:"5px",color:hl?"#d1fae5":"#ddd",fontSize:"12px",outline:"none",fontFamily:"'Barlow Condensed',sans-serif",boxSizing:"border-box",transition:"all 0.4s"}}/></div>);}

// ── Logit Transform Panel ─────────────────────────────────────────────────────
function LogitPanel({lines,homeTeam,awayTeam,modelWinProb}){

export { Spinner, Tag, Panel, PanelTitle, Skel, WinBar, StatFld };
