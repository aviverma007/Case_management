import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, ComposedChart, Line, LabelList,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import {
  TicketCheck, Users, AlertCircle, CheckCircle2, MapPin,
  RotateCcw, BarChart3, PieChart as PieIcon, Activity,
  Building2, UserCheck, Zap, TrendingUp, Clock
} from 'lucide-react';
import D from './caseData.json';
import './App.css';

const C = {
  blue:'#1e3a5f', blueL:'#2c5282', blueA:'#3b82c4',
  brown:'#8b5e3c', brownL:'#b07d56', brownD:'#6b4226',
  gold:'#c49a3c', green:'#2d7a4f', rose:'#b8443a',
  teal:'#0e7490', purple:'#6d28d9', text:'#1a1a1a', text2:'#5c4a3a', text3:'#8b7355',
};
const G = {
  blue:['#3a6fd8','#1e3a5f'], brown:['#d4955a','#6b4226'],
  rose:['#e86a5a','#8b2e26'], gold:['#e0b84a','#8b6820'],
  green:['#48b87a','#1a5c36'], teal:['#2eb8cc','#0a6070'],
  purple:['#9b71d4','#4a2880'], blueA:['#5ba3f0','#1e5a9f'],
};
const GKEYS = Object.keys(G);
const STATUS_C = {'Resolved':'#2d7a4f','Closed':'#1e3a5f','In Progress':'#c49a3c','New':'#3b82c4','Pending for Clarification':'#b8443a','Re-Open':'#8b5e3c'};
const PRI_C = {'High':'#b8443a','Medium':'#c49a3c','Low':'#2d7a4f','Critical':'#6d28d9'};
const PIE_C = [C.blue,C.brownL,C.teal,C.gold,C.green,C.rose,C.purple,C.blueA];
const TT = {background:'rgba(255,255,255,0.97)',backdropFilter:'blur(12px)',border:'1px solid rgba(180,160,140,0.3)',borderRadius:12,fontSize:12,boxShadow:'0 10px 40px rgba(0,0,0,0.12)',padding:'10px 13px'};

function Defs() {
  return (
    <svg width={0} height={0} style={{position:'absolute',pointerEvents:'none'}}>
      <defs>
        {Object.entries(G).map(([id,[t,b]])=>(
          <React.Fragment key={id}>
            <linearGradient id={`g-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={t} stopOpacity={0.95}/><stop offset="100%" stopColor={b} stopOpacity={0.7}/>
            </linearGradient>
            <linearGradient id={`gh-${id}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={t} stopOpacity={0.95}/><stop offset="100%" stopColor={b} stopOpacity={0.7}/>
            </linearGradient>
          </React.Fragment>
        ))}
      </defs>
    </svg>
  );
}

function Leg({ items }) {
  return (
    <div className="legend">
      {items.map((it,i)=>(
        <span key={i} className="leg-item">
          <span className="leg-dot" style={{background:it.color}}/>{it.label}
        </span>
      ))}
    </div>
  );
}

function CT({ active, payload, label }) {
  if (!active||!payload?.length) return null;
  return (
    <div className="tt">
      <div className="tt-label">{label}</div>
      {payload.map((p,i)=>(
        <div key={i} style={{display:'flex',alignItems:'center',gap:6,fontSize:11,marginTop:3}}>
          <span style={{width:8,height:8,borderRadius:2,background:p.fill||p.color,flexShrink:0,display:'inline-block'}}/>
          <span>{p.name}:</span>
          <strong style={{color:p.fill||p.color}}>{typeof p.value==='number'?p.value.toLocaleString():p.value}</strong>
        </div>
      ))}
    </div>
  );
}

function Kpi({ icon, label, value, sub, color, delay=0 }) {
  const [hov,setHov]=useState(false);
  const ref=useRef(null);
  const [tilt,setTilt]=useState({x:0,y:0});
  const onMove=useCallback(e=>{
    if(!ref.current)return;
    const rc=ref.current.getBoundingClientRect();
    setTilt({x:(e.clientY-rc.top)/rc.height-.5,y:(e.clientX-rc.left)/rc.width-.5});
  },[]);
  return (
    <div ref={ref} className="kpi"
      style={{'--kc':color,'--glow-color':`${color}18`,animationDelay:`${delay*.08}s`,
        border:`1.5px solid ${hov?color+'40':'var(--border-glass)'}`,
        transform:`perspective(600px) rotateX(${tilt.x*-10}deg) rotateY(${tilt.y*10}deg) ${hov?'translateY(-5px) scale(1.02)':''}`,
        boxShadow:hov?`0 20px 50px ${color}25,inset 0 1px 0 rgba(255,255,255,0.6)`:`0 3px 12px ${color}10,inset 0 1px 0 rgba(255,255,255,0.6)`,
      }}
      onMouseEnter={()=>setHov(true)} onMouseMove={onMove} onMouseLeave={()=>{setHov(false);setTilt({x:0,y:0})}}>
      <div className="kpi-shimmer"/>
      <div className="kpi-icon" style={{background:`linear-gradient(145deg,${color}20,${color}0a)`,border:`1.5px solid ${color}25`,color,boxShadow:hov?`0 6px 20px ${color}30`:`0 2px 8px ${color}15`}}>{icon}</div>
      <div>
        <div className="kpi-label">{label}</div>
        <div className="kpi-value" style={{animationDelay:`${.3+delay*.08}s`}}>{value}</div>
        {sub&&<div className="kpi-sub">{sub}</div>}
      </div>
    </div>
  );
}

function Card({ title, icon, color=C.blue, children, cls='', delay=0 }) {
  const [hov,setHov]=useState(false);
  return (
    <div className={`card ${cls}`} style={{'--cc':color,animationDelay:`${delay}s`,
      border:`1.5px solid ${hov?'rgba(30,58,95,0.22)':'var(--border-glass)'}`,
      boxShadow:hov?'0 14px 40px rgba(30,58,95,0.12),inset 0 1px 0 rgba(255,255,255,0.6)':'0 3px 14px rgba(30,58,95,0.06),inset 0 1px 0 rgba(255,255,255,0.6)',
      transform:hov?'perspective(800px) rotateX(-1deg) translateY(-3px)':'none'}}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}>
      <div className="card-title">
        <span className="card-icon" style={{color,background:`${color}12`,borderColor:`${color}20`,transform:hov?'scale(1.1)':'scale(1)'}}>{icon}</span>
        {title}
      </div>
      {children}
    </div>
  );
}

export default function App() {
  const [tab,setTab]=useState('overview');
  const [fStatus,setFS]=useState('');
  const [fOwner,setFO]=useState('');
  const [fArea,setFA]=useState('');
  const [search,setSrch]=useState('');
  const [page,setPage]=useState(0);
  const PER=15;
  const s=D.summary;

  const filtered=useMemo(()=>{
    let r=D.sampleCases;
    if(fStatus) r=r.filter(x=>x.Status===fStatus);
    if(fOwner)  r=r.filter(x=>x['Case Owner']===fOwner);
    if(fArea)   r=r.filter(x=>x.Area===fArea);
    if(search)  r=r.filter(x=>Object.values(x).some(v=>v.toLowerCase().includes(search.toLowerCase())));
    return r;
  },[fStatus,fOwner,fArea,search]);

  const pages=Math.ceil(filtered.length/PER);
  const pageRows=filtered.slice(page*PER,(page+1)*PER);
  const statusOpts=[...new Set(D.sampleCases.map(r=>r.Status))].filter(Boolean);
  const ownerOpts=[...new Set(D.sampleCases.map(r=>r['Case Owner']))].filter(Boolean).slice(0,20);
  const areaOpts=[...new Set(D.sampleCases.map(r=>r.Area))].filter(Boolean);
  const resPct=((s.closed/s.total)*100).toFixed(1);

  return (
    <div className="app">
      <Defs/>
      <div className="bg-orbs">
        <div className="orb orb1"/><div className="orb orb2"/><div className="orb orb3"/>
        <svg className="bg-grid" width="100%" height="100%">
          <defs><pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#1e3a5f" strokeWidth=".5"/>
          </pattern></defs>
          <rect width="100%" height="100%" fill="url(#grid)"/>
        </svg>
      </div>

      {/* HEADER */}
      <header className="header">
        <div className="header-left">
          <div className="brand"><Building2 size={20} color="#fff"/></div>
          <div>
            <div className="h-title">Case Management Dashboard</div>
            <div className="h-sub">Smartworld · Ticket &amp; Support Analytics</div>
          </div>
        </div>
        <div className="header-right">
          <span className="live-badge">● LIVE</span>
          <span className="h-meta">{s.total.toLocaleString()} cases · {s.owners} agents</span>
        </div>
      </header>

      {/* FILTERS */}
      <div className="filters">
        <div className="fg"><label>Status</label>
          <select value={fStatus} onChange={e=>{setFS(e.target.value);setPage(0)}}>
            <option value="">All</option>{statusOpts.map(o=><option key={o}>{o}</option>)}
          </select>
        </div>
        <div className="fg"><label>Case Owner</label>
          <select value={fOwner} onChange={e=>{setFO(e.target.value);setPage(0)}}>
            <option value="">All</option>{ownerOpts.map(o=><option key={o}>{o}</option>)}
          </select>
        </div>
        <div className="fg"><label>Area</label>
          <select value={fArea} onChange={e=>{setFA(e.target.value);setPage(0)}}>
            <option value="">All</option>{areaOpts.map(o=><option key={o}>{o}</option>)}
          </select>
        </div>
        <button className="reset-btn" onClick={()=>{setFS('');setFO('');setFA('');setSrch('');setPage(0)}}>
          <RotateCcw size={13}/> Reset
        </button>
      </div>

      {/* TABS */}
      <div className="tabs">
        {[['overview','Overview'],['agents','Agents & Areas'],['trends','Trends'],['cases','Case Table']].map(([id,lbl])=>(
          <button key={id} className={`tab-btn${tab===id?' active':''}`} onClick={()=>setTab(id)}>{lbl}</button>
        ))}
      </div>

      {/* KPIs */}
      <div className="kpi-row">
        <Kpi icon={<TicketCheck size={18}/>}  label="Total Tickets"  value={s.total.toLocaleString()}    sub="All cases"             color={C.blue}   delay={0}/>
        <Kpi icon={<AlertCircle size={18}/>}   label="Open Tickets"   value={s.open.toLocaleString()}     sub="Active cases"          color={C.rose}   delay={1}/>
        <Kpi icon={<CheckCircle2 size={18}/>}  label="Resolved"       value={s.closed.toLocaleString()}   sub={`${resPct}% rate`}     color={C.green}  delay={2}/>
        <Kpi icon={<Users size={18}/>}          label="Case Owners"    value={s.owners}                    sub="Active agents"         color={C.brownL} delay={3}/>
        <Kpi icon={<MapPin size={18}/>}         label="Areas"          value={s.areas}                     sub="Service areas"         color={C.teal}   delay={4}/>
        <Kpi icon={<Zap size={18}/>}            label="Escalated"      value={s.escalated.toLocaleString()} sub="Flagged cases"        color={C.gold}   delay={5}/>
      </div>

      {/* ── OVERVIEW ── */}
      {tab==='overview'&&(
        <div className="content">
          <div className="grid-3">
            {/* 1 Status Donut */}
            <Card title="Case Status Distribution" icon={<PieIcon size={14}/>} color={C.blue} delay={0.1}>
              <ResponsiveContainer width="100%" height={230}>
                <PieChart>
                  <Pie data={D.statusDist} cx="50%" cy="46%" outerRadius={82} innerRadius={40}
                    dataKey="value" nameKey="name" paddingAngle={3} stroke="#fff" strokeWidth={2} animationDuration={1200}>
                    {D.statusDist.map((e,i)=><Cell key={i} fill={STATUS_C[e.name]||PIE_C[i%PIE_C.length]}/>)}
                  </Pie>
                  <Tooltip contentStyle={TT} formatter={(v,n)=>[v.toLocaleString(),n]}/>
                </PieChart>
              </ResponsiveContainer>
              <Leg items={D.statusDist.map((e,i)=>({label:`${e.name} (${e.value.toLocaleString()})`,color:STATUS_C[e.name]||PIE_C[i%PIE_C.length]}))}/>
            </Card>

            {/* 2 Case Origin horizontal bar */}
            <Card title="Case Origin" icon={<Activity size={14}/>} color={C.teal} delay={0.15}>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={D.originDist} layout="vertical" margin={{top:4,right:60,left:4,bottom:4}}>
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(30,58,95,0.07)" horizontal={false}/>
                  <XAxis type="number" tick={{fill:C.text3,fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis type="category" dataKey="name" width={105} tick={{fill:C.text,fontSize:9,fontWeight:600}} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={TT} formatter={v=>[v.toLocaleString(),'Cases']}/>
                  <Bar dataKey="value" name="Cases" radius={[0,7,7,0]} animationDuration={1200}>
                    {D.originDist.map((_,i)=><Cell key={i} fill={`url(#gh-${GKEYS[i%GKEYS.length]})`}/>)}
                    <LabelList dataKey="value" position="right" style={{fontSize:10,fontWeight:700,fill:C.text}} formatter={v=>v.toLocaleString()}/>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* 3 Priority */}
            <Card title="Priority Breakdown" icon={<AlertCircle size={14}/>} color={C.rose} delay={0.2}>
              <ResponsiveContainer width="100%" height={230}>
                <PieChart>
                  <Pie data={D.priorityDist} cx="50%" cy="46%" outerRadius={82} innerRadius={40}
                    dataKey="value" nameKey="name" paddingAngle={4} stroke="#fff" strokeWidth={2} animationDuration={1200}>
                    {D.priorityDist.map((e,i)=><Cell key={i} fill={PRI_C[e.name]||PIE_C[i]}/>)}
                  </Pie>
                  <Tooltip contentStyle={TT} formatter={(v,n)=>[v.toLocaleString(),n]}/>
                </PieChart>
              </ResponsiveContainer>
              <Leg items={D.priorityDist.map(e=>({label:`${e.name} (${e.value.toLocaleString()})`,color:PRI_C[e.name]||C.blue}))}/>
            </Card>
          </div>

          <div className="grid-2">
            {/* 4 Top Case Owners */}
            <Card title="No. of Cases by Case Owner" icon={<UserCheck size={14}/>} color={C.blue} delay={0.25}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={D.ownerDist.slice(0,10)} layout="vertical" margin={{top:4,right:70,left:4,bottom:4}}>
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(30,58,95,0.07)" horizontal={false}/>
                  <XAxis type="number" tick={{fill:C.text3,fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis type="category" dataKey="name" width={135} tick={{fill:C.text,fontSize:9,fontWeight:600}} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={TT} formatter={v=>[v.toLocaleString(),'Cases']}/>
                  <Bar dataKey="value" name="Cases" radius={[0,8,8,0]} animationDuration={1400}>
                    {D.ownerDist.slice(0,10).map((_,i)=><Cell key={i} fill={`url(#gh-${GKEYS[i%GKEYS.length]})`}/>)}
                    <LabelList dataKey="value" position="right" style={{fontSize:10,fontWeight:700,fill:C.text}} formatter={v=>v.toLocaleString()}/>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* 5 Area × Sub Area table */}
            <Card title="Area × Sub Area Breakdown" icon={<MapPin size={14}/>} color={C.brownL} delay={0.3}>
              <div className="table-wrap" style={{maxHeight:280,overflowY:'auto'}}>
                <table className="data-table">
                  <thead><tr><th>Area</th><th>Sub Area</th><th style={{textAlign:'right'}}>Cases</th></tr></thead>
                  <tbody>
                    {D.areaSubTable.map((r,i)=>(
                      <tr key={i}>
                        <td style={{fontWeight:600,color:C.blue}}>{r.area}</td>
                        <td>{r.sub_area}</td>
                        <td style={{textAlign:'right',fontWeight:700,color:C.brownL,fontFamily:"'Space Mono',monospace"}}>{r.count.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ── AGENTS & AREAS ── */}
      {tab==='agents'&&(
        <div className="content">
          <div className="grid-2">
            {/* 6 HOD */}
            <Card title="Cases by HOD" icon={<Users size={14}/>} color={C.blue} delay={0.1}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={D.hodDist} layout="vertical" margin={{top:4,right:65,left:4,bottom:4}}>
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(30,58,95,0.07)" horizontal={false}/>
                  <XAxis type="number" tick={{fill:C.text3,fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis type="category" dataKey="name" width={120} tick={{fill:C.text,fontSize:9,fontWeight:600}} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={TT} formatter={v=>[v.toLocaleString(),'Cases']}/>
                  <Bar dataKey="value" name="Cases" fill="url(#gh-blue)" radius={[0,8,8,0]} animationDuration={1200}>
                    <LabelList dataKey="value" position="right" style={{fontSize:10,fontWeight:700,fill:C.text}} formatter={v=>v.toLocaleString()}/>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* 7 Team Leader */}
            <Card title="Cases by Team Leader" icon={<UserCheck size={14}/>} color={C.teal} delay={0.15}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={D.tlDist} layout="vertical" margin={{top:4,right:65,left:4,bottom:4}}>
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(30,58,95,0.07)" horizontal={false}/>
                  <XAxis type="number" tick={{fill:C.text3,fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis type="category" dataKey="name" width={110} tick={{fill:C.text,fontSize:9,fontWeight:600}} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={TT} formatter={v=>[v.toLocaleString(),'Cases']}/>
                  <Bar dataKey="value" name="Cases" radius={[0,8,8,0]} animationDuration={1200}>
                    {D.tlDist.map((_,i)=><Cell key={i} fill={`url(#gh-${GKEYS[i%GKEYS.length]})`}/>)}
                    <LabelList dataKey="value" position="right" style={{fontSize:10,fontWeight:700,fill:C.text}} formatter={v=>v.toLocaleString()}/>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* 8 Area Distribution */}
            <Card title="Cases by Area" icon={<MapPin size={14}/>} color={C.brownL} delay={0.2}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={D.areaDist} margin={{top:20,right:10,left:0,bottom:30}}>
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(30,58,95,0.07)" vertical={false}/>
                  <XAxis dataKey="name" tick={{fill:C.text3,fontSize:9,fontWeight:600}} axisLine={false} tickLine={false} angle={-30} textAnchor="end" interval={0}/>
                  <YAxis tick={{fill:C.text3,fontSize:10}} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={TT} formatter={v=>[v.toLocaleString(),'Cases']}/>
                  <Bar dataKey="value" name="Cases" radius={[6,6,0,0]} animationDuration={1300}>
                    {D.areaDist.map((_,i)=><Cell key={i} fill={`url(#g-${GKEYS[i%GKEYS.length]})`}/>)}
                    <LabelList dataKey="value" position="top" style={{fontSize:9,fontWeight:700,fill:C.text}} formatter={v=>v.toLocaleString()}/>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* 9 Response Radar */}
            <Card title="Response & Resolution Time Categories" icon={<Clock size={14}/>} color={C.gold} delay={0.25}>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart cx="50%" cy="50%" outerRadius="65%"
                  data={D.responseDist.map((r,i)=>({subject:r.name,resp:r.value,resol:(D.resolDist[i]||{value:0}).value}))}>
                  <PolarGrid stroke="rgba(30,58,95,0.1)"/>
                  <PolarAngleAxis dataKey="subject" tick={{fill:C.text2,fontSize:9,fontWeight:600}}/>
                  <PolarRadiusAxis angle={30} tick={{fontSize:8}} axisLine={false} tickLine={false}/>
                  <Radar name="Response" dataKey="resp" stroke={C.blue} fill={C.blue} fillOpacity={0.15} strokeWidth={2}/>
                  <Radar name="Resolution" dataKey="resol" stroke={C.brownL} fill={C.brownL} fillOpacity={0.15} strokeWidth={2}/>
                  <Tooltip contentStyle={TT} formatter={v=>v.toLocaleString()}/>
                </RadarChart>
              </ResponsiveContainer>
              <Leg items={[{label:'Response Time',color:C.blue},{label:'Resolution Time',color:C.brownL}]}/>
            </Card>
          </div>
        </div>
      )}

      {/* ── TRENDS ── */}
      {tab==='trends'&&(
        <div className="content">
          {/* 10 Monthly Trend - full width */}
          <div style={{marginBottom:12}}>
            <Card title="Monthly Case Volume Trend" icon={<TrendingUp size={14}/>} color={C.blue} delay={0.1}>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={D.monthly} margin={{top:18,right:20,left:4,bottom:20}}>
                  <defs>
                    <linearGradient id="ga-mon" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.blue} stopOpacity={0.25}/><stop offset="95%" stopColor={C.blue} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(30,58,95,0.07)" vertical={false}/>
                  <XAxis dataKey="month" tick={{fill:C.text3,fontSize:10,fontWeight:600}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:C.text3,fontSize:10}} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={TT} formatter={(v,n)=>[v.toLocaleString(),n]}/>
                  <Bar dataKey="opened" name="Cases Opened" fill="url(#g-blue)" radius={[6,6,0,0]} barSize={22} animationDuration={1200}/>
                  <Line type="monotone" dataKey="opened" name="Trend" stroke={C.brownL} strokeWidth={3} dot={{r:4,fill:'#fff',stroke:C.brownL,strokeWidth:2}} activeDot={{r:7}} animationDuration={1600}/>
                </ComposedChart>
              </ResponsiveContainer>
              <Leg items={[{label:'Cases Opened',color:C.blue},{label:'Trend Line',color:C.brownL}]}/>
            </Card>
          </div>

          <div className="grid-2">
            {/* Case Type */}
            <Card title="Case Type Breakdown" icon={<BarChart3 size={14}/>} color={C.purple} delay={0.2}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={D.typeDist} layout="vertical" margin={{top:4,right:65,left:4,bottom:4}}>
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(30,58,95,0.07)" horizontal={false}/>
                  <XAxis type="number" tick={{fill:C.text3,fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis type="category" dataKey="name" width={90} tick={{fill:C.text,fontSize:9,fontWeight:600}} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={TT} formatter={v=>[v.toLocaleString(),'Cases']}/>
                  <Bar dataKey="value" name="Cases" fill="url(#gh-purple)" radius={[0,8,8,0]} animationDuration={1200}>
                    <LabelList dataKey="value" position="right" style={{fontSize:10,fontWeight:700,fill:C.text}} formatter={v=>v.toLocaleString()}/>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Sub Area */}
            <Card title="Top Sub Areas" icon={<MapPin size={14}/>} color={C.teal} delay={0.25}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={D.subareaDistList.slice(0,8)} layout="vertical" margin={{top:4,right:65,left:4,bottom:4}}>
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(30,58,95,0.07)" horizontal={false}/>
                  <XAxis type="number" tick={{fill:C.text3,fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis type="category" dataKey="name" width={125} tick={{fill:C.text,fontSize:9,fontWeight:600}} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={TT} formatter={v=>[v.toLocaleString(),'Cases']}/>
                  <Bar dataKey="value" name="Cases" radius={[0,8,8,0]} animationDuration={1300}>
                    {D.subareaDistList.slice(0,8).map((_,i)=><Cell key={i} fill={`url(#gh-${GKEYS[i%GKEYS.length]})`}/>)}
                    <LabelList dataKey="value" position="right" style={{fontSize:10,fontWeight:700,fill:C.text}} formatter={v=>v.toLocaleString()}/>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </div>
      )}

      {/* ── CASE TABLE ── */}
      {tab==='cases'&&(
        <div className="content">
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10,flexWrap:'wrap',gap:8}}>
            <span style={{fontSize:13,fontWeight:700,color:C.blue}}>
              {filtered.length.toLocaleString()} cases {search||fStatus||fOwner||fArea?'(filtered)':'(sample of 300)'}
            </span>
            <input className="search-box" placeholder="🔍 Search cases…" value={search} onChange={e=>{setSrch(e.target.value);setPage(0)}}/>
          </div>
          <div className="table-wrap" style={{maxHeight:'62vh',overflowY:'auto',overflowX:'auto'}}>
            <table className="data-table">
              <thead><tr>
                <th>Case #</th><th>Case Owner</th><th>HOD</th><th>Team Leader</th>
                <th>Priority</th><th>Origin</th><th>Type</th><th>Status</th>
                <th>Area</th><th>Sub Area</th><th>Age</th>
              </tr></thead>
              <tbody>
                {pageRows.map((r,i)=>(
                  <tr key={i}>
                    <td style={{fontFamily:"'Space Mono',monospace",fontSize:11,color:C.blue,fontWeight:700}}>{r['Case Number']}</td>
                    <td style={{fontWeight:600}}>{r['Case Owner']}</td>
                    <td style={{fontSize:11}}>{r['HOD 1']}</td>
                    <td style={{fontSize:11}}>{r['Team Leader']}</td>
                    <td><span className="priority-pill" style={{background:`${PRI_C[r.Priority]||C.blue}18`,color:PRI_C[r.Priority]||C.blue,border:`1px solid ${PRI_C[r.Priority]||C.blue}30`}}>{r.Priority}</span></td>
                    <td style={{fontSize:11}}>{r['Case Origin']}</td>
                    <td style={{fontSize:11}}>{r['Case Type']}</td>
                    <td><span className="status-pill" style={{background:STATUS_C[r.Status]||'#888',fontSize:10}}>{r.Status}</span></td>
                    <td style={{fontSize:11}}>{r.Area}</td>
                    <td style={{fontSize:11}}>{r['Sub Area']}</td>
                    <td style={{fontFamily:"'Space Mono',monospace",fontSize:11,textAlign:'right'}}>{r.Age}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            <span className="pg-info">Page {page+1} of {Math.max(pages,1)} · {filtered.length} rows</span>
            <div className="pg-btns">
              <button className="pg-btn" disabled={page===0} onClick={()=>setPage(p=>p-1)}>← Prev</button>
              {[...Array(Math.min(5,pages))].map((_,i)=>{
                const p=Math.max(0,Math.min(page-2,pages-5))+i;
                return p<pages?<button key={p} className="pg-btn" style={p===page?{background:C.blue,color:'#fff'}:{}} onClick={()=>setPage(p)}>{p+1}</button>:null;
              })}
              <button className="pg-btn" disabled={page>=pages-1} onClick={()=>setPage(p=>p+1)}>Next →</button>
            </div>
          </div>
        </div>
      )}

      <footer className="footer">
        Smartworld Case Management · Ticket Analytics Dashboard · {new Date().toLocaleDateString('en-IN',{year:'numeric',month:'long',day:'numeric'})}
      </footer>
    </div>
  );
}
