import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, ComposedChart,
  FunnelChart, Funnel, LabelList, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts';
import {
  Building2, TicketCheck, Clock, CheckCircle, AlertCircle, TrendingUp,
  Users, Filter, RotateCcw, FileText, BarChart3, Activity, MapPin,
  Phone, Mail, User, ChevronRight, Search
} from 'lucide-react';
import data from './caseData.json';
import './App.css';

/* ─── Theme (same as last app) ─── */
const C = {
  blue:'#1e3a5f', blueLight:'#2c5282', blueAcc:'#3b82c4',
  brown:'#8b5e3c', brownLt:'#b07d56', brownDk:'#6b4226',
  gold:'#c49a3c', green:'#2d7a4f', rose:'#b8443a',
  teal:'#1a6b7a', purple:'#5b4a8a',
  text:'#1a1a1a', text2:'#5c4a3a', text3:'#8b7355',
};
const GRAD = {
  blue:  ['#3a6fd8','#1e3a5f'], brown: ['#d4955a','#6b4226'],
  rose:  ['#e86a5a','#8b2e26'], gold:  ['#e0b84a','#8b6820'],
  green: ['#48b87a','#1a5c36'], teal:  ['#3bbccc','#1a6b7a'],
  purple:['#9b71d4','#4a2880'],
};
const STATUS_COLOR = { 'Resolved':'#2d7a4f','Closed':'#1e3a5f','In Progress':'#c49a3c','Pending for Clarification':'#b8443a','Close':'#8b5e3c','New':'#3b82c4','Re-Open':'#b07d56' };
const PALETTE = ['#1e3a5f','#b07d56','#3b82c4','#c49a3c','#2d7a4f','#b8443a','#8b5e3c','#5b4a8a','#1a6b7a','#3bbccc'];

const TT_STYLE = { background:'rgba(255,255,255,0.97)', backdropFilter:'blur(12px)', border:'1px solid rgba(180,160,140,0.3)', borderRadius:12, fontSize:12, boxShadow:'0 10px 40px rgba(0,0,0,0.12)', padding:'10px 14px' };

/* ─── Gradient defs ─── */
function GradDefs() {
  return (
    <svg width={0} height={0} style={{position:'absolute',pointerEvents:'none'}}>
      <defs>
        {Object.entries(GRAD).map(([id,[top,bot]])=>(
          <linearGradient key={id} id={`cg-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={top} stopOpacity={0.92}/>
            <stop offset="100%" stopColor={bot} stopOpacity={0.72}/>
          </linearGradient>
        ))}
        <linearGradient id="cg-area-blue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#1e3a5f" stopOpacity={0.3}/>
          <stop offset="95%" stopColor="#1e3a5f" stopOpacity={0}/>
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ─── ChartLegend ─── */
function CL({ items }) {
  return (
    <div style={{display:'flex',flexWrap:'wrap',justifyContent:'center',gap:'6px 14px',paddingTop:8}}>
      {items.map((it,i)=>(
        <span key={i} style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:C.text2,fontWeight:600}}>
          <span style={{width:10,height:10,borderRadius:3,background:it.color,display:'inline-block',boxShadow:`0 1px 4px ${it.color}55`}}/>
          {it.label}
        </span>
      ))}
    </div>
  );
}

/* ─── KPI Card ─── */
function Kpi({ icon, label, value, sub, color, delay=0, ring }) {
  const [h,setH]=useState(false);
  const ref=useRef(null);
  const [tilt,setTilt]=useState({x:0,y:0});
  const onMove=useCallback(e=>{
    if(!ref.current)return;
    const r=ref.current.getBoundingClientRect();
    setTilt({x:((e.clientY-r.top)/r.height-0.5)*-10,y:((e.clientX-r.left)/r.width-0.5)*10});
  },[]);
  return (
    <div ref={ref} className="kpi-card"
      style={{'--acc':color,'--gc':`${color}18`,animationDelay:`${delay*0.07}s`,
        border:`1.5px solid ${h?color+'50':'var(--bg-border)'}`,
        transform:`perspective(600px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) ${h?'translateY(-6px) scale(1.02)':''}`,
        boxShadow:h?`0 20px 50px ${color}25,inset 0 1px 0 rgba(255,255,255,0.6)`:`0 3px 12px ${color}10,inset 0 1px 0 rgba(255,255,255,0.6)`,
      }}
      onMouseEnter={()=>setH(true)} onMouseMove={onMove} onMouseLeave={()=>{setH(false);setTilt({x:0,y:0});}}>
      <div className="kpi-shimmer" style={{animationDelay:`${delay*0.12}s`}}/>
      <div className="kpi-corner" style={{background:`radial-gradient(circle,${color}25 0%,transparent 65%)`}}/>
      {ring!=null && (
        <svg width="30" height="30" style={{position:'absolute',top:8,right:8}} viewBox="0 0 30 30">
          <circle cx="15" cy="15" r="11" fill="none" stroke={`${color}20`} strokeWidth="3"/>
          <circle cx="15" cy="15" r="11" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"
            strokeDasharray={`${(ring/100)*69.1} 69.1`} transform="rotate(-90 15 15)"
            style={{transition:'stroke-dasharray 1.2s ease'}}/>
          <text x="15" y="16" textAnchor="middle" dominantBaseline="central" fill={color} fontSize="6" fontWeight="700">{Math.round(ring)}%</text>
        </svg>
      )}
      <div className="kpi-icon-w" style={{background:`linear-gradient(145deg,${color}18,${color}08)`,border:`1.5px solid ${color}22`,color}}>{icon}</div>
      <div>
        <div className="kpi-lbl">{label}</div>
        <div className="kpi-val">{value}</div>
        {sub && <div className="kpi-sub">{sub}</div>}
      </div>
    </div>
  );
}

/* ─── Glass Chart Card ─── */
function CC({ title, icon, color=C.blue, wide, delay=0, children }) {
  const [h,setH]=useState(false);
  return (
    <div className={`chart-card${wide?' wide':''}`}
      style={{'--cc':color,animationDelay:`${delay}s`,
        borderColor:h?'rgba(30,58,95,0.22)':'var(--bg-border)',
        boxShadow:h?'0 16px 45px rgba(30,58,95,0.13),inset 0 1px 0 rgba(255,255,255,0.6)':'0 3px 14px rgba(30,58,95,0.06),inset 0 1px 0 rgba(255,255,255,0.6)',
        transform:h?'perspective(800px) rotateX(-1deg) translateY(-3px)':'none',
      }}
      onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}>
      <div className="cc-head">
        <span className="cc-icon" style={{color,background:`${color}12`,borderColor:`${color}20`,transform:h?'scale(1.1)':'scale(1)'}}>{icon}</span>
        <span className="cc-title">{title}</span>
      </div>
      {children}
    </div>
  );
}

/* ─── Case Detail Modal ─── */
function CaseModal({ cases, title, onClose }) {
  useEffect2(onClose);
  return (
    <div className="modal-back" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-box2">
        <div className="modal-hdr2" style={{background:'linear-gradient(135deg,#0f1f3a,#1e3a5f)'}}>
          <div><h2>{title}</h2><p>{cases.length} cases</p></div>
          <button className="modal-x" onClick={onClose}>✕</button>
        </div>
        <div className="modal-tbl-wrap">
          <table className="modal-tbl">
            <thead><tr><th>#</th><th>Case #</th><th>Owner</th><th>Area</th><th>Sub Area</th><th>Status</th><th>Priority</th><th>Project</th><th>Date</th></tr></thead>
            <tbody>
              {cases.map((c,i)=>(
                <tr key={i} className={i%2===0?'ev':'od'}>
                  <td style={{color:'#aaa',fontSize:11}}>{i+1}</td>
                  <td style={{fontFamily:"'Space Mono',monospace",fontWeight:700,color:C.blue}}>{c.caseNumber}</td>
                  <td>{c.owner}</td>
                  <td>{c.area}</td>
                  <td style={{color:C.text2}}>{c.subArea}</td>
                  <td><span className="st-chip" style={{background:STATUS_COLOR[c.status]??C.brown}}>{c.status}</span></td>
                  <td style={{fontWeight:600,color:c.priority==='High'?C.rose:c.priority==='Medium'?C.gold:C.green}}>{c.priority}</td>
                  <td style={{fontSize:11,color:C.text3}}>{c.project}</td>
                  <td style={{fontSize:11,color:C.text3}}>{c.dateOpened?.split(',')[0]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
import { useEffect } from 'react';
function useEffect2(onClose) {
  useEffect(()=>{
    document.body.style.overflow='hidden';
    const h=e=>{if(e.key==='Escape')onClose();};
    window.addEventListener('keydown',h);
    return()=>{document.body.style.overflow='';window.removeEventListener('keydown',h);};
  },[]);
}

/* ─── MAIN APP ─── */
export default function App() {
  const [tab, setTab]       = useState('overview');
  const [filters, setFilters]= useState({status:'',caseType:'',area:'',owner:'',project:'',priority:''});
  const [modal, setModal]   = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage]     = useState(0);
  const PER = 15;

  // Filtered cases
  const filtered = useMemo(()=>{
    let rows = data.sampleCases;
    if(filters.status)   rows=rows.filter(r=>r.status===filters.status);
    if(filters.caseType) rows=rows.filter(r=>r.caseType===filters.caseType);
    if(filters.area)     rows=rows.filter(r=>r.area===filters.area);
    if(filters.owner)    rows=rows.filter(r=>r.owner===filters.owner);
    if(filters.project)  rows=rows.filter(r=>r.project===filters.project);
    if(filters.priority) rows=rows.filter(r=>r.priority===filters.priority);
    if(search) rows=rows.filter(r=>r.caseNumber?.includes(search)||r.owner?.toLowerCase().includes(search.toLowerCase()));
    return rows;
  },[filters, search]);

  const paged = filtered.slice(page*PER,(page+1)*PER);
  const pages = Math.ceil(filtered.length/PER);
  const reset = ()=>{setFilters({status:'',caseType:'',area:'',owner:'',project:'',priority:''});setSearch('');setPage(0);};

  const s = data.summary;
  const closedPct = ((s.closed/s.total)*100).toFixed(1);

  return (
    <div className="app">
      <GradDefs/>
      {/* Orbs */}
      <div className="orbs">
        <div className="orb o1"/><div className="orb o2"/><div className="orb o3"/>
        <svg className="bg-grid" width="100%" height="100%">
          <defs><pattern id="g" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#1e3a5f" strokeWidth="0.5"/>
          </pattern></defs>
          <rect width="100%" height="100%" fill="url(#g)"/>
        </svg>
      </div>

      {/* ── HEADER ── */}
      <header className="app-header">
        <div className="hdr-l">
          <div className="brand"><Building2 size={20} color="#fff"/></div>
          <div>
            <div className="hdr-title">Case Management Dashboard</div>
            <div className="hdr-sub">Smartworld · Customer Service Analytics</div>
          </div>
        </div>
        <div className="hdr-r">
          <div className="stat-pill"><span className="sdot"/>LIVE</div>
          <span className="hdr-meta">{s.total.toLocaleString()} total cases</span>
        </div>
      </header>

      {/* ── FILTERS ── */}
      <div className="filters-bar">
        <Filter size={13} color={C.text3}/>
        <Sel label="Status"    val={filters.status}   opts={data.options.status}   onChange={v=>setFilters(f=>({...f,status:v}))}/>
        <Sel label="Case Type" val={filters.caseType} opts={data.options.caseType} onChange={v=>setFilters(f=>({...f,caseType:v}))}/>
        <Sel label="Area"      val={filters.area}     opts={data.options.area}     onChange={v=>setFilters(f=>({...f,area:v}))}/>
        <Sel label="Project"   val={filters.project}  opts={data.options.project}  onChange={v=>setFilters(f=>({...f,project:v}))}/>
        <Sel label="Priority"  val={filters.priority} opts={data.options.priority} onChange={v=>setFilters(f=>({...f,priority:v}))}/>
        <button className="reset-btn" onClick={reset}><RotateCcw size={12}/> Reset</button>
      </div>

      {/* ── TABS ── */}
      <div className="tab-nav">
        {[['overview','Overview'],['tickets','Ticket Analysis'],['agents','Agents & Owners'],['cases','Case Table']].map(([id,lbl])=>(
          <button key={id} className={`tab-btn${tab===id?' active':''}`} onClick={()=>setTab(id)}>{lbl}</button>
        ))}
      </div>

      {/* ── KPI ROW ── */}
      <section className="kpi-grid">
        <Kpi icon={<TicketCheck size={18}/>} label="TOTAL TICKETS"  value={s.total.toLocaleString()}  sub="All cases"           color={C.blue}    delay={0}/>
        <Kpi icon={<AlertCircle size={18}/>} label="OPEN TICKETS"   value={s.open.toLocaleString()}   sub="Active cases"        color={C.rose}    delay={1}/>
        <Kpi icon={<CheckCircle size={18}/>} label="CLOSED TICKETS" value={s.closed.toLocaleString()} sub={`${closedPct}% closed`} color={C.green} delay={2} ring={parseFloat(closedPct)}/>
        <Kpi icon={<Clock size={18}/>}       label="IN PROGRESS"    value={s.inProgress.toLocaleString()} sub="Being handled"   color={C.gold}    delay={3}/>
        <Kpi icon={<Users size={18}/>}       label="CASE OWNERS"    value={data.ownerDist.length}     sub="Active agents"       color={C.brown}   delay={4}/>
        <Kpi icon={<MapPin size={18}/>}      label="AREAS"          value={data.areaDist.length}      sub="Service areas"       color={C.teal}    delay={5}/>
        <Kpi icon={<TrendingUp size={18}/>}  label="PROJECTS"       value={data.projectDist.length}   sub="Properties"         color={C.purple}  delay={6}/>
      </section>

      {/* ── OVERVIEW TAB ── */}
      {tab==='overview' && (
        <div className="tab-content">
          <div className="cgrid">
            {/* Status Distribution */}
            <CC title="Status Distribution" icon={<BarChart3 size={14}/>} color={C.blue} delay={0.1} wide>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.statusDist} margin={{top:20,right:20,left:0,bottom:0}}>
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(30,58,95,0.07)" vertical={false}/>
                  <XAxis dataKey="name" tick={{fill:C.text3,fontSize:10,fontWeight:600}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:C.text3,fontSize:10}} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={TT_STYLE}/>
                  <Bar dataKey="count" name="Cases" radius={[8,8,0,0]} animationDuration={1200}>
                    {data.statusDist.map((e,i)=><Cell key={i} fill={STATUS_COLOR[e.name]??PALETTE[i%PALETTE.length]}/>)}
                    <LabelList dataKey="count" position="top" style={{fontSize:10,fontWeight:700,fill:C.text}} formatter={v=>v.toLocaleString()}/>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <CL items={data.statusDist.map((e,i)=>({label:e.name,color:STATUS_COLOR[e.name]??PALETTE[i%PALETTE.length]}))}/>
            </CC>

            {/* Monthly Trend */}
            <CC title="Monthly Case Trend" icon={<Activity size={14}/>} color={C.brownDk} delay={0.15} wide>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={data.monthly} margin={{top:18,right:20,left:0,bottom:0}}>
                  <defs>
                    <linearGradient id="aBlue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={C.blue} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={C.blue} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(30,58,95,0.07)" vertical={false}/>
                  <XAxis dataKey="month" tick={{fill:C.text3,fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:C.text3,fontSize:10}} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={TT_STYLE}/>
                  <Area type="monotone" dataKey="count" name="Cases" stroke={C.blue} fill="url(#aBlue)" strokeWidth={2.5}
                    dot={{r:3,fill:'#fff',stroke:C.blue,strokeWidth:2}} animationDuration={1400}/>
                </AreaChart>
              </ResponsiveContainer>
              <CL items={[{label:'Monthly Cases',color:C.blue}]}/>
            </CC>

            {/* Case Type Pie */}
            <CC title="Case Type" icon={<PieIcon2 size={14}/>} color={C.brown} delay={0.2}>
              <ResponsiveContainer width="100%" height={230}>
                <PieChart>
                  <Pie data={data.caseTypeDist} cx="50%" cy="48%" outerRadius={88} innerRadius={44}
                    dataKey="count" nameKey="name" paddingAngle={4} stroke="#fff" strokeWidth={2} animationDuration={1200}
                    label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}>
                    {data.caseTypeDist.map((_,i)=><Cell key={i} fill={PALETTE[i%PALETTE.length]}/>)}
                  </Pie>
                  <Tooltip contentStyle={TT_STYLE}/>
                </PieChart>
              </ResponsiveContainer>
              <CL items={data.caseTypeDist.map((e,i)=>({label:e.name,color:PALETTE[i%PALETTE.length]}))}/>
            </CC>

            {/* Case Origin */}
            <CC title="Case Origin" icon={<Phone size={14}/>} color={C.teal} delay={0.25}>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={data.caseOriginDist} layout="vertical" margin={{top:5,right:60,left:5,bottom:5}}>
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(30,58,95,0.07)" horizontal={false}/>
                  <XAxis type="number" tick={{fill:C.text3,fontSize:9}} axisLine={false} tickLine={false}/>
                  <YAxis type="category" dataKey="name" width={120} tick={{fill:C.text,fontSize:10,fontWeight:600}} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={TT_STYLE}/>
                  <Bar dataKey="count" name="Cases" fill={`url(#cg-teal)`} radius={[0,8,8,0]} animationDuration={1400}>
                    <LabelList dataKey="count" position="right" style={{fontSize:10,fontWeight:700,fill:C.teal}} formatter={v=>v.toLocaleString()}/>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CC>

            {/* Priority Distribution */}
            <CC title="Priority Distribution" icon={<AlertCircle size={14}/>} color={C.rose} delay={0.3}>
              <ResponsiveContainer width="100%" height={230}>
                <PieChart>
                  <Pie data={data.priorityDist} cx="50%" cy="48%" outerRadius={85} innerRadius={42}
                    dataKey="count" nameKey="name" paddingAngle={4} stroke="#fff" strokeWidth={2} animationDuration={1200}
                    label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}>
                    {data.priorityDist.map((_,i)=><Cell key={i} fill={[C.rose,C.gold,C.green,C.blue,C.brown][i%5]}/>)}
                  </Pie>
                  <Tooltip contentStyle={TT_STYLE}/>
                </PieChart>
              </ResponsiveContainer>
              <CL items={data.priorityDist.map((e,i)=>({label:e.name,color:[C.rose,C.gold,C.green,C.blue,C.brown][i%5]}))}/>
            </CC>

            {/* Area Distribution */}
            <CC title="Top Areas" icon={<MapPin size={14}/>} color={C.purple} delay={0.35}>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={data.areaDist.slice(0,8)} layout="vertical" margin={{top:5,right:60,left:5,bottom:5}}>
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(30,58,95,0.07)" horizontal={false}/>
                  <XAxis type="number" tick={{fill:C.text3,fontSize:9}} axisLine={false} tickLine={false}/>
                  <YAxis type="category" dataKey="name" width={130} tick={{fill:C.text,fontSize:10,fontWeight:600}} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={TT_STYLE}/>
                  <Bar dataKey="count" name="Cases" fill={`url(#cg-purple)`} radius={[0,8,8,0]} animationDuration={1400}>
                    <LabelList dataKey="count" position="right" style={{fontSize:10,fontWeight:700,fill:C.purple}} formatter={v=>v.toLocaleString()}/>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CC>

            {/* Project Distribution */}
            <CC title="Cases by Project" icon={<Building2 size={14}/>} color={C.blue} delay={0.4} wide>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.projectDist.slice(0,8)} margin={{top:18,right:20,left:0,bottom:40}}>
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(30,58,95,0.07)" vertical={false}/>
                  <XAxis dataKey="name" tick={{fill:C.text3,fontSize:10}} angle={-25} textAnchor="end" axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:C.text3,fontSize:10}} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={TT_STYLE}/>
                  <Bar dataKey="count" name="Cases" radius={[6,6,0,0]} animationDuration={1200}>
                    {data.projectDist.slice(0,8).map((_,i)=><Cell key={i} fill={`url(#cg-${['blue','brown','teal','gold','green','rose','purple','blue'][i]})`}/>)}
                    <LabelList dataKey="count" position="top" style={{fontSize:10,fontWeight:700,fill:C.text}} formatter={v=>v.toLocaleString()}/>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <CL items={data.projectDist.slice(0,8).map((e,i)=>({label:e.name,color:PALETTE[i%PALETTE.length]}))}/>
            </CC>
          </div>
        </div>
      )}

      {/* ── TICKET ANALYSIS TAB ── */}
      {tab==='tickets' && (
        <div className="tab-content">
          <div className="cgrid">
            {/* Area vs SubArea table */}
            <CC title="Area → Sub Area Breakdown" icon={<FileText size={14}/>} color={C.blue} delay={0.1} wide>
              <div className="area-tbl-wrap">
                <table className="area-tbl">
                  <thead><tr><th>Area</th><th>Sub Area</th><th>Cases</th><th>Share</th></tr></thead>
                  <tbody>
                    {data.areaSubTable.map((r,i)=>{
                      const pct = ((r.count/s.total)*100).toFixed(1);
                      return (
                        <tr key={i} className={i%2===0?'ev':'od'}>
                          <td style={{fontWeight:700,color:C.blue}}>{r.area}</td>
                          <td style={{color:C.text2}}>{r.sub}</td>
                          <td style={{fontFamily:"'Space Mono',monospace",fontWeight:700}}>{r.count.toLocaleString()}</td>
                          <td>
                            <div style={{display:'flex',alignItems:'center',gap:6}}>
                              <div style={{flex:1,background:'rgba(30,58,95,0.1)',borderRadius:99,height:5,overflow:'hidden'}}>
                                <div style={{height:'100%',background:`linear-gradient(90deg,${C.blue},${C.blueAcc})`,width:`${Math.min(100,r.count/data.areaSubTable[0].count*100)}%`,borderRadius:99}}/>
                              </div>
                              <span style={{fontSize:11,fontWeight:700,color:C.blue,minWidth:36}}>{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CC>

            {/* Sub Area bar */}
            <CC title="Top Sub Areas" icon={<BarChart3 size={14}/>} color={C.brown} delay={0.15} wide>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.subAreaDist.slice(0,10)} layout="vertical" margin={{top:5,right:70,left:5,bottom:5}}>
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(30,58,95,0.07)" horizontal={false}/>
                  <XAxis type="number" tick={{fill:C.text3,fontSize:9}} axisLine={false} tickLine={false}/>
                  <YAxis type="category" dataKey="name" width={160} tick={{fill:C.text,fontSize:9,fontWeight:600}} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={TT_STYLE}/>
                  <Bar dataKey="count" name="Cases" fill={`url(#cg-brown)`} radius={[0,8,8,0]} animationDuration={1400}>
                    <LabelList dataKey="count" position="right" style={{fontSize:10,fontWeight:700,fill:C.brownDk}} formatter={v=>v.toLocaleString()}/>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CC>

            {/* Category Distribution */}
            <CC title="Category Breakdown" icon={<Filter size={14}/>} color={C.teal} delay={0.2}>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.categoryDist.filter(d=>d.name!=='Unknown').slice(0,8)} layout="vertical" margin={{top:5,right:60,left:5,bottom:5}}>
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(30,58,95,0.07)" horizontal={false}/>
                  <XAxis type="number" tick={{fill:C.text3,fontSize:9}} axisLine={false} tickLine={false}/>
                  <YAxis type="category" dataKey="name" width={130} tick={{fill:C.text,fontSize:9,fontWeight:600}} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={TT_STYLE}/>
                  <Bar dataKey="count" name="Cases" fill={`url(#cg-teal)`} radius={[0,8,8,0]} animationDuration={1200}>
                    <LabelList dataKey="count" position="right" style={{fontSize:10,fontWeight:700,fill:C.teal}} formatter={v=>v.toLocaleString()}/>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CC>

            {/* Open vs Closed Donut */}
            <CC title="Open vs Closed" icon={<CheckCircle size={14}/>} color={C.green} delay={0.25}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',alignItems:'center',height:240}}>
                <div style={{textAlign:'center'}}>
                  <div style={{fontFamily:"'Space Mono',monospace",fontSize:28,fontWeight:800,color:C.blue}}>{s.total.toLocaleString()}</div>
                  <div style={{fontSize:10,color:C.text3,fontWeight:700,textTransform:'uppercase',letterSpacing:1}}>Total Cases</div>
                  <div style={{marginTop:12,fontSize:12,color:C.green,fontWeight:700}}>{closedPct}% Closed</div>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={[{name:'Closed',value:s.closed,color:C.blue},{name:'Open',value:s.open,color:C.gold}]}
                      cx="50%" cy="50%" innerRadius="55%" outerRadius="80%"
                      dataKey="value" nameKey="name" paddingAngle={5} stroke="#fff" strokeWidth={3} animationDuration={1200}>
                      <Cell fill={C.blue}/><Cell fill={C.gold}/>
                    </Pie>
                    <Tooltip contentStyle={TT_STYLE}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <CL items={[{label:'Closed',color:C.blue},{label:'Open',color:C.gold}]}/>
            </CC>
          </div>
        </div>
      )}

      {/* ── AGENTS TAB ── */}
      {tab==='agents' && (
        <div className="tab-content">
          <div className="cgrid">
            {/* Top Case Owners */}
            <CC title="Cases by Owner (Top 12)" icon={<User size={14}/>} color={C.blue} delay={0.1} wide>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.ownerDist} layout="vertical" margin={{top:5,right:80,left:10,bottom:5}}>
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(30,58,95,0.07)" horizontal={false}/>
                  <XAxis type="number" tick={{fill:C.text3,fontSize:9}} axisLine={false} tickLine={false}/>
                  <YAxis type="category" dataKey="name" width={130} tick={{fill:C.text,fontSize:9,fontWeight:600}} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={TT_STYLE}/>
                  <Bar dataKey="count" name="Cases" fill={`url(#cg-blue)`} radius={[0,8,8,0]} animationDuration={1400}>
                    <LabelList dataKey="count" position="right" style={{fontSize:10,fontWeight:700,fill:C.blue}} formatter={v=>v.toLocaleString()}/>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CC>

            {/* HOD Distribution */}
            <CC title="Cases by HOD" icon={<Users size={14}/>} color={C.brownLt} delay={0.15}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.hodDist} margin={{top:18,right:10,left:0,bottom:40}}>
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(30,58,95,0.07)" vertical={false}/>
                  <XAxis dataKey="name" tick={{fill:C.text3,fontSize:9}} angle={-30} textAnchor="end" axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:C.text3,fontSize:10}} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={TT_STYLE}/>
                  <Bar dataKey="count" name="Cases" fill={`url(#cg-brown)`} radius={[6,6,0,0]} animationDuration={1200}>
                    <LabelList dataKey="count" position="top" style={{fontSize:10,fontWeight:700,fill:C.brownDk}} formatter={v=>v.toLocaleString()}/>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CC>

            {/* Team Leader Distribution */}
            <CC title="Cases by Team Leader" icon={<Users size={14}/>} color={C.purple} delay={0.2}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.teamLeaderDist} layout="vertical" margin={{top:5,right:70,left:10,bottom:5}}>
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(30,58,95,0.07)" horizontal={false}/>
                  <XAxis type="number" tick={{fill:C.text3,fontSize:9}} axisLine={false} tickLine={false}/>
                  <YAxis type="category" dataKey="name" width={110} tick={{fill:C.text,fontSize:9,fontWeight:600}} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={TT_STYLE}/>
                  <Bar dataKey="count" name="Cases" fill={`url(#cg-purple)`} radius={[0,8,8,0]} animationDuration={1400}>
                    <LabelList dataKey="count" position="right" style={{fontSize:10,fontWeight:700,fill:C.purple}} formatter={v=>v.toLocaleString()}/>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CC>

            {/* HNI Customer */}
            <CC title="HNI Customer Cases" icon={<TrendingUp size={14}/>} color={C.gold} delay={0.25}>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={data.hniDist.filter(d=>d.name&&d.name!=='FALSE'&&d.name!=='TRUE'?true:true)}
                    cx="50%" cy="48%" outerRadius={95} innerRadius={45}
                    dataKey="count" nameKey="name" paddingAngle={4} stroke="#fff" strokeWidth={2} animationDuration={1200}
                    label={({name,percent})=>`${name==='TRUE'?'HNI':'Non-HNI'} ${(percent*100).toFixed(0)}%`}>
                    <Cell fill={C.gold}/><Cell fill={C.blue}/>
                  </Pie>
                  <Tooltip contentStyle={TT_STYLE} formatter={(v,n,p)=>[v.toLocaleString(), p.payload.name==='TRUE'?'HNI':'Non-HNI']}/>
                </PieChart>
              </ResponsiveContainer>
              <CL items={[{label:'HNI Customer',color:C.gold},{label:'Regular',color:C.blue}]}/>
            </CC>
          </div>
        </div>
      )}

      {/* ── CASE TABLE TAB ── */}
      {tab==='cases' && (
        <div className="tab-content">
          <div className="tbl-controls">
            <div className="search-box">
              <Search size={14} color={C.text3}/>
              <input placeholder="Search case number or owner..." value={search} onChange={e=>setSearch(e.target.value)} style={{background:'none',border:'none',outline:'none',fontFamily:'inherit',fontSize:12,color:C.text,width:'100%'}}/>
            </div>
            <span style={{fontSize:12,color:C.text3,fontWeight:600}}>{filtered.length} results</span>
          </div>
          <div className="cases-tbl-wrap">
            <table className="cases-tbl">
              <thead>
                <tr><th>#</th><th>Case #</th><th>Owner</th><th>HOD</th><th>Team Leader</th><th>Area</th><th>Sub Area</th><th>Status</th><th>Priority</th><th>Origin</th><th>Project</th><th>Date Opened</th></tr>
              </thead>
              <tbody>
                {paged.map((c,i)=>(
                  <tr key={i} className={i%2===0?'ev':'od'}>
                    <td style={{color:'#aaa',fontSize:11}}>{page*PER+i+1}</td>
                    <td style={{fontFamily:"'Space Mono',monospace",fontWeight:700,color:C.blue,fontSize:11}}>{c.caseNumber}</td>
                    <td style={{fontWeight:600}}>{c.owner}</td>
                    <td style={{fontSize:11,color:C.text2}}>{c.hod}</td>
                    <td style={{fontSize:11,color:C.text2}}>{c.teamLeader}</td>
                    <td style={{fontWeight:600,color:C.blue}}>{c.area}</td>
                    <td style={{fontSize:11,color:C.text2}}>{c.subArea}</td>
                    <td><span className="st-chip" style={{background:STATUS_COLOR[c.status]??C.brown}}>{c.status}</span></td>
                    <td style={{fontWeight:600,fontSize:11,color:c.priority==='High'?C.rose:c.priority==='Medium'?C.gold:C.green}}>{c.priority}</td>
                    <td style={{fontSize:11,color:C.text3}}>{c.origin}</td>
                    <td style={{fontSize:11,color:C.text3}}>{c.project}</td>
                    <td style={{fontSize:11,color:C.text3}}>{c.dateOpened?.split(',')[0]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            <button className="pg-btn" disabled={page===0} onClick={()=>setPage(p=>p-1)}>← Prev</button>
            <span style={{fontSize:12,fontWeight:600,color:C.text2}}>Page {page+1} / {Math.max(1,pages)} · {filtered.length} cases</span>
            <button className="pg-btn" disabled={page>=pages-1} onClick={()=>setPage(p=>p+1)}>Next →</button>
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && <CaseModal cases={modal.cases} title={modal.title} onClose={()=>setModal(null)}/>}

      {/* Footer */}
      <footer className="app-footer">
        Smartworld Case Management · {s.total.toLocaleString()} cases · {new Date().toLocaleDateString('en-IN',{year:'numeric',month:'long',day:'numeric'})}
      </footer>
    </div>
  );
}

function PieIcon2({ size }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>; }
function Sel({ label, val, opts, onChange }) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:3,flex:1,minWidth:100}}>
      <label style={{fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:.7,color:'var(--text3)'}}>{label}</label>
      <select value={val} onChange={e=>onChange(e.target.value)} className="filter-select">
        <option value="">All</option>
        {opts.map(o=><option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
