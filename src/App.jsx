import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts';
import './App.css';

const BLUE    = '#2563eb';
const BLUE_LT = '#3b82f6';
const BLUE_SK = '#60a5fa';
const BROWN   = '#8b5e3c';
const BROWN_L = '#c49a6c';
const BROWN_D = '#4a2e14';
const WHITE   = '#f5f0ea';
const OFFWHT  = '#c9bfb2';

const PAL = [BLUE_LT,BROWN_L,BLUE_SK,BROWN,'#1d4ed8','#d97706','#93c5fd','#92400e',BLUE,'#fbbf24'];

const STATUS_C = {
  Resolved:'#3b82f6', Closed:'#1d4ed8', Close:'#1d4ed8',
  'In Progress':'#c49a6c', New:'#60a5fa',
  'Pending for Clarification':'#8b5e3c', 'Re-Open':'#92400e',
};

async function loadExcel() {
  const res = await fetch('./Case_Management.xlsx');
  const buf = await res.arrayBuffer();
  const wb  = XLSX.read(buf, { type:'array', cellDates:true });
  const ws  = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { defval:'' });
}

function countBy(arr, key) {
  const m={};
  arr.forEach(r=>{ const v=r[key]||'Unknown'; m[v]=(m[v]||0)+1; });
  return Object.entries(m).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);
}
function fmt(n) {
  const x=parseInt(n)||0;
  if(x>=1e6) return (x/1e6).toFixed(1)+'M';
  if(x>=1e3) return (x/1e3).toFixed(1)+'K';
  return String(x);
}

function useCounter(target,delay=0) {
  const [val,setVal]=useState(0);
  useEffect(()=>{
    const t=setTimeout(()=>{
      let cur=0; const step=Math.max(1,Math.ceil(target/70));
      const timer=setInterval(()=>{ cur=Math.min(cur+step,target); setVal(cur); if(cur>=target)clearInterval(timer); },14);
      return ()=>clearInterval(timer);
    },delay);
    return ()=>clearTimeout(t);
  },[target,delay]);
  return val;
}

function useVisible(ref) {
  const [vis,setVis]=useState(false);
  useEffect(()=>{
    const obs=new IntersectionObserver(([e])=>{ if(e.isIntersecting)setVis(true); },{threshold:0.1});
    if(ref.current)obs.observe(ref.current);
    return ()=>obs.disconnect();
  },[ref]);
  return vis;
}

function GlassCard({children,className='',style={}}) {
  return <div className={`glass-card ${className}`} style={style}>{children}</div>;
}

function SH({title,sub}) {
  return (
    <div className="sec-hdr">
      <div className="sec-dot"/>
      <span className="sec-title">{title}</span>
      {sub&&<span className="sec-sub">{sub}</span>}
    </div>
  );
}

function KpiCard({label,value,color,icon,delay=0}) {
  const count=useCounter(parseInt(value)||0,delay+200);
  return (
    <GlassCard className="kpi-card" style={{'--accent':color,animationDelay:`${delay}ms`}}>
      <div className="kpi-shimmer"/>
      <div className="kpi-icon" style={{background:`${color}20`,color}}>{icon}</div>
      <div className="kpi-body">
        <div className="kpi-val" style={{color}}>{fmt(count)}</div>
        <div className="kpi-lbl">{label}</div>
      </div>
      <div className="kpi-glow" style={{background:color}}/>
    </GlassCard>
  );
}

function HorizBar({name,value,max,color,rank}) {
  const ref=useRef(); const vis=useVisible(ref);
  const pct=max?(value/max)*100:0;
  return (
    <div ref={ref} className="hbar" style={{animationDelay:`${rank*55}ms`,animationPlayState:vis?'running':'paused'}}>
      <div className="hbar-name" title={name}>{name}</div>
      <div className="hbar-track">
        <div className="hbar-fill" style={{
          width:vis?`${pct}%`:'0%',
          background:`linear-gradient(90deg,${color}aa,${color})`,
          transition:`width 1s ${rank*0.06}s cubic-bezier(.16,1,.3,1)`
        }}/>
      </div>
      <div className="hbar-val">{fmt(value)}</div>
    </div>
  );
}

function FilterSel({label,options,value,onChange}) {
  return (
    <div className="flt-item">
      <label>{label}</label>
      <select value={value} onChange={e=>onChange(e.target.value)}>
        <option value="">All</option>
        {options.map(o=><option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function TT({active,payload,label}) {
  if(!active||!payload?.length) return null;
  return (
    <div className="tt">
      <p className="tt-label">{label}</p>
      {payload.map((p,i)=><p key={i} style={{color:p.fill||p.color||BLUE_LT}}>{p.name||'Value'}: <b>{fmt(p.value)}</b></p>)}
    </div>
  );
}

function RadialProgress({pct,color,label,size=90}) {
  const ref=useRef(); const vis=useVisible(ref);
  const [drawn,setDrawn]=useState(0);
  useEffect(()=>{
    if(!vis)return;
    let f=0;
    const timer=setInterval(()=>{ f=Math.min(f+2,pct); setDrawn(f); if(f>=pct)clearInterval(timer); },12);
    return ()=>clearInterval(timer);
  },[vis,pct]);
  const r=35; const circ=2*Math.PI*r; const dash=(drawn/100)*circ;
  return (
    <div ref={ref} style={{display:'flex',alignItems:'center',gap:14}}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,248,240,0.07)" strokeWidth="8"/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{transformOrigin:'center',transform:'rotate(-90deg)',transition:'stroke-dasharray 0.5s ease'}}
        />
        <text x={size/2} y={size/2+1} textAnchor="middle" dominantBaseline="middle"
          fill={WHITE} fontSize="14" fontWeight="800" fontFamily="JetBrains Mono,monospace">
          {drawn}%
        </text>
      </svg>
      <div>
        <div style={{fontSize:12,color:WHITE,fontWeight:600}}>{label}</div>
        <div style={{fontSize:10,color:'var(--muted)',marginTop:2}}>{drawn}% within target</div>
      </div>
    </div>
  );
}

export default function App() {
  const [rawData,setRawData]=useState([]);
  const [loading,setLoading]=useState(true);
  const [progress,setProgress]=useState(0);
  const [error,setError]=useState(null);

  const [fStatus,setFStatus]=useState('');
  const [fOwner,setFOwner]=useState('');
  const [fArea,setFArea]=useState('');
  const [fProject,setFProject]=useState('');
  const [fType,setFType]=useState('');
  const [fOrigin,setFOrigin]=useState('');
  const [fTL,setFTL]=useState('');
  const [fApply,setFApply]=useState('');

  useEffect(()=>{
    let p=0;
    const tick=setInterval(()=>{ p=Math.min(p+2,85); setProgress(p); },180);
    loadExcel()
      .then(d=>{ clearInterval(tick); setProgress(100); setTimeout(()=>{ setRawData(d); setLoading(false); },300); })
      .catch(e=>{ clearInterval(tick); setError(e.message); setLoading(false); });
  },[]);

  const data=useMemo(()=>rawData.filter(r=>{
    if(fStatus  &&r['Status']           !==fStatus)  return false;
    if(fOwner   &&r['Case Owner']        !==fOwner)   return false;
    if(fArea    &&r['Area']              !==fArea)    return false;
    if(fProject &&r['Project']           !==fProject) return false;
    if(fType    &&r['Case Type']         !==fType)    return false;
    if(fOrigin  &&r['Case Origin']       !==fOrigin)  return false;
    if(fTL      &&r['Team Leader']       !==fTL)      return false;
    if(fApply   &&r['Case Applicability']!==fApply)   return false;
    return true;
  }),[rawData,fStatus,fOwner,fArea,fProject,fType,fOrigin,fTL,fApply]);

  const opts=useMemo(()=>{
    if(!rawData.length)return{};
    const u=k=>[...new Set(rawData.map(r=>r[k]).filter(Boolean))].sort();
    return{status:u('Status'),owner:u('Case Owner'),area:u('Area'),project:u('Project'),
           caseType:u('Case Type'),origin:u('Case Origin'),tl:u('Team Leader'),apply:u('Case Applicability')};
  },[rawData]);

  const kpis=useMemo(()=>{
    const closed=data.filter(r=>['Closed','Close','Resolved'].includes(r['Status'])).length;
    return{total:data.length,closed,open:data.filter(r=>!['Closed','Close','Resolved'].includes(r['Status'])).length,
           inProg:data.filter(r=>r['Status']==='In Progress').length,
           reopen:data.filter(r=>r['Status']==='Re-Open').length,
           hni:data.filter(r=>r['HNI Customer']===true||r['HNI Customer']==='Yes'||r['HNI Customer']==='TRUE').length};
  },[data]);

  const statusData  =useMemo(()=>countBy(data,'Status'),[data]);
  const originData  =useMemo(()=>countBy(data,'Case Origin').slice(0,8),[data]);
  const caseTypeData=useMemo(()=>countBy(data,'Case Type'),[data]);
  const ownerData   =useMemo(()=>countBy(data,'Case Owner').slice(0,12),[data]);
  const areaData    =useMemo(()=>countBy(data,'Area').slice(0,10),[data]);
  const projectData =useMemo(()=>countBy(data,'Project').slice(0,8),[data]);
  const priorityData=useMemo(()=>countBy(data,'Priority'),[data]);
  const tlData      =useMemo(()=>countBy(data,'Team Leader').filter(d=>d.name.trim()).slice(0,8),[data]);
  const applyData   =useMemo(()=>countBy(data,'Case Applicability').filter(d=>d.name&&d.name!=='Unknown'),[data]);
  const respTime    =useMemo(()=>countBy(data,'Response Time Category').filter(d=>d.name!=='Unknown'),[data]);
  const resTime     =useMemo(()=>countBy(data,'Resolution Time Category').filter(d=>d.name!=='Unknown'),[data]);

  const subAreaData=useMemo(()=>{
    const m={};
    data.forEach(r=>{ if(r['Sub Area']){const k=`${r['Area']} › ${r['Sub Area']}`;m[k]=(m[k]||0)+1;} });
    return Object.entries(m).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value).slice(0,10);
  },[data]);

  const monthlyData=useMemo(()=>{
    const m={};
    data.forEach(r=>{
      const dt=r['Date/Time Opened']; if(!dt)return;
      let key;
      if(dt instanceof Date)key=`${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`;
      else if(typeof dt==='string'&&dt.includes('/')){
        const p=dt.split('/');
        if(p.length>=3)key=`${p[2]?.split(',')[0]?.trim()}-${String(p[0]).padStart(2,'0')}`;
      }
      if(key&&key.length>=7)m[key]=(m[key]||0)+1;
    });
    return Object.entries(m).sort((a,b)=>a[0].localeCompare(b[0])).slice(-18).map(([name,value])=>({name:name.slice(0,7),value}));
  },[data]);

  const ageDist=useMemo(()=>{
    const b={'1-7d':0,'8-30d':0,'31-90d':0,'90d+':0};
    data.forEach(r=>{ const a=Number(r['Age']); if(!isNaN(a)){if(a<=7)b['1-7d']++;else if(a<=30)b['8-30d']++;else if(a<=90)b['31-90d']++;else b['90d+']++;} });
    return Object.entries(b).map(([name,value])=>({name,value}));
  },[data]);

  const reassignData=useMemo(()=>{
    const m={'0':0,'1':0,'2':0,'3+':0};
    data.forEach(r=>{ const n=Number(r['Number of Reassigns']); if(!isNaN(n)){if(n===0)m['0']++;else if(n===1)m['1']++;else if(n===2)m['2']++;else m['3+']++;} });
    return Object.entries(m).map(([name,value])=>({name,value}));
  },[data]);

  const respWithin=useMemo(()=>{ const w=respTime.find(d=>d.name==='Within 24 Hrs')?.value||0; const t=respTime.reduce((s,d)=>s+d.value,0); return t?Math.round((w/t)*100):0; },[respTime]);
  const resWithin =useMemo(()=>{ const w=resTime.find(d=>d.name==='Within 24 Hrs')?.value||0;  const t=resTime.reduce((s,d)=>s+d.value,0); return t?Math.round((w/t)*100):0; },[resTime]);

  const hasFilter=fStatus||fOwner||fArea||fProject||fType||fOrigin||fTL||fApply;
  const clearAll=()=>{setFStatus('');setFOwner('');setFArea('');setFProject('');setFType('');setFOrigin('');setFTL('');setFApply('');};

  if(loading) return (
    <div className="loading-screen">
      <div className="loader-ring"><div className="loader-inner">SW</div></div>
      <div className="loader-title">SmartWorld CRM</div>
      <div className="loader-sub">Loading {progress<85?'Excel dataset':'visuals'}…</div>
      <div className="progress-bar"><div className="progress-fill" style={{width:`${progress}%`}}/></div>
      <div className="progress-pct">{progress}%</div>
    </div>
  );

  if(error) return (
    <div className="loading-screen">
      <div className="loader-title" style={{color:BROWN_L}}>⚠ Error loading data</div>
      <div className="loader-sub">{error}</div>
    </div>
  );

  const A=(begin=200,dur=1000)=>({animationBegin:begin,animationDuration:dur,isAnimationActive:true});

  return (
    <div className="app">
      <div className="bg-layer">
        <div className="bg-noise"/>
        <div className="orb orb1"/><div className="orb orb2"/><div className="orb orb3"/>
        <div className="grid-overlay"/>
      </div>

      <header className="hdr">
        <div className="hdr-left">
          <div className="logo">SW</div>
          <div>
            <h1>SmartWorld CRM</h1>
            <p>Case Management Intelligence Dashboard</p>
          </div>
        </div>
        <div className="hdr-right">
          <div className="hdr-stat"><span className="hdr-val">{fmt(rawData.length)}</span><span>Total Records</span></div>
          <div className="hdr-stat"><span className="hdr-val" style={{color:BROWN_L}}>{fmt(data.length)}</span><span>Filtered</span></div>
          <div className="live-badge"><div className="live-dot"/>Live</div>
        </div>
      </header>

      <div className="filter-bar">
        <div className="filter-grid">
          <FilterSel label="Status"        options={opts.status}   value={fStatus}  onChange={setFStatus}/>
          <FilterSel label="Case Type"     options={opts.caseType} value={fType}    onChange={setFType}/>
          <FilterSel label="Origin"        options={opts.origin}   value={fOrigin}  onChange={setFOrigin}/>
          <FilterSel label="Area"          options={opts.area}     value={fArea}    onChange={setFArea}/>
          <FilterSel label="Project"       options={opts.project}  value={fProject} onChange={setFProject}/>
          <FilterSel label="Case Owner"    options={opts.owner}    value={fOwner}   onChange={setFOwner}/>
          <FilterSel label="Team Leader"   options={opts.tl}       value={fTL}      onChange={setFTL}/>
          <FilterSel label="Applicability" options={opts.apply}    value={fApply}   onChange={setFApply}/>
        </div>
        {hasFilter&&<button className="clear-btn" onClick={clearAll}>✕ Clear</button>}
      </div>

      <main className="content">

        <div className="kpi-row">
          <KpiCard label="Total Tickets"   value={kpis.total}  color={BLUE_LT} icon="🎫" delay={0}/>
          <KpiCard label="Resolved/Closed" value={kpis.closed} color={BLUE}    icon="✅" delay={80}/>
          <KpiCard label="Open Tickets"    value={kpis.open}   color={BROWN_L} icon="📂" delay={160}/>
          <KpiCard label="In Progress"     value={kpis.inProg} color={BROWN}   icon="⚙️" delay={240}/>
          <KpiCard label="Re-Opened"       value={kpis.reopen} color={BLUE_SK} icon="🔄" delay={320}/>
          <KpiCard label="HNI Customers"   value={kpis.hni}    color={WHITE}   icon="⭐" delay={400}/>
        </div>

        <div className="row-3">
          <GlassCard className="chart-card">
            <SH title="Status Distribution"/>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={52} outerRadius={92} paddingAngle={3} dataKey="value" {...A(100,1100)}>
                  {statusData.map((d,i)=><Cell key={i} fill={STATUS_C[d.name]||PAL[i%PAL.length]} stroke="rgba(13,13,13,0.6)" strokeWidth={2}/>)}
                </Pie>
                <Tooltip content={<TT/>}/><Legend formatter={v=><span style={{fontSize:10,color:OFFWHT}}>{v}</span>}/>
              </PieChart>
            </ResponsiveContainer>
          </GlassCard>

          <GlassCard className="chart-card">
            <SH title="Case Type Split"/>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={caseTypeData} cx="50%" cy="50%" outerRadius={92} paddingAngle={4} dataKey="value"
                  label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine {...A(300,1000)}>
                  {caseTypeData.map((d,i)=><Cell key={i} fill={PAL[i%PAL.length]} stroke="rgba(13,13,13,0.5)" strokeWidth={2}/>)}
                </Pie>
                <Tooltip content={<TT/>}/>
              </PieChart>
            </ResponsiveContainer>
          </GlassCard>

          <GlassCard className="chart-card">
            <SH title="Case Origin"/>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={originData} layout="vertical" margin={{left:8,right:32}}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(180,140,100,0.07)"/>
                <XAxis type="number" tick={{fill:'var(--muted)',fontSize:10}} tickFormatter={fmt}/>
                <YAxis dataKey="name" type="category" width={118} tick={{fill:'var(--muted)',fontSize:10}}/>
                <Tooltip content={<TT/>}/>
                <Bar dataKey="value" radius={[0,5,5,0]} {...A(100,900)}>
                  {originData.map((d,i)=><Cell key={i} fill={PAL[i%PAL.length]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>
        </div>

        {monthlyData.length>2&&(
          <GlassCard className="chart-card wide">
            <SH title="Monthly Case Volume Trend" sub="Cases opened per month"/>
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={monthlyData} margin={{left:10,right:20}}>
                <defs>
                  <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={BLUE_LT} stopOpacity={0.45}/>
                    <stop offset="95%" stopColor={BLUE}    stopOpacity={0.03}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(180,140,100,0.07)"/>
                <XAxis dataKey="name" tick={{fill:'var(--muted)',fontSize:10}}/>
                <YAxis tick={{fill:'var(--muted)',fontSize:10}} tickFormatter={fmt}/>
                <Tooltip content={<TT/>}/>
                <Area type="monotone" dataKey="value" name="Cases" stroke={BLUE_LT} strokeWidth={2.5} fill="url(#ag)" dot={false} {...A(0,1400)}/>
              </AreaChart>
            </ResponsiveContainer>
          </GlassCard>
        )}

        <GlassCard className="chart-card wide">
          <SH title="Cases by Case Owner" sub={`Top ${ownerData.length}`}/>
          <div className="hbars">
            {ownerData.map((d,i)=><HorizBar key={d.name} name={d.name} value={d.value} max={ownerData[0]?.value} color={PAL[i%PAL.length]} rank={i}/>)}
          </div>
        </GlassCard>

        <div className="row-2">
          <GlassCard className="chart-card">
            <SH title="Cases by Area" sub="Top 10"/>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={areaData} margin={{left:4,right:4,bottom:60}}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(180,140,100,0.07)"/>
                <XAxis dataKey="name" tick={{fill:'var(--muted)',fontSize:9}} angle={-35} textAnchor="end" interval={0}/>
                <YAxis tick={{fill:'var(--muted)',fontSize:10}} tickFormatter={fmt}/>
                <Tooltip content={<TT/>}/>
                <Bar dataKey="value" radius={[5,5,0,0]} {...A(100,1000)}>
                  {areaData.map((d,i)=><Cell key={i} fill={PAL[i%PAL.length]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>

          <GlassCard className="chart-card">
            <SH title="Top Sub-Areas" sub="Area › Sub Area"/>
            <div className="hbars" style={{marginTop:4}}>
              {subAreaData.map((d,i)=><HorizBar key={d.name} name={d.name} value={d.value} max={subAreaData[0]?.value} color={PAL[(i+2)%PAL.length]} rank={i}/>)}
            </div>
          </GlassCard>
        </div>

        <div className="row-3">
          <GlassCard className="chart-card">
            <SH title="Cases by Project"/>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={projectData} cx="50%" cy="50%" innerRadius={46} outerRadius={90} paddingAngle={3} dataKey="value" {...A(200,1100)}>
                  {projectData.map((d,i)=><Cell key={i} fill={PAL[i%PAL.length]} stroke="rgba(13,13,13,0.5)" strokeWidth={2}/>)}
                </Pie>
                <Tooltip content={<TT/>}/><Legend formatter={v=><span style={{fontSize:10,color:OFFWHT}}>{v}</span>}/>
              </PieChart>
            </ResponsiveContainer>
          </GlassCard>

          <GlassCard className="chart-card">
            <SH title="Team Leader Workload"/>
            <div className="hbars" style={{marginTop:4}}>
              {tlData.filter(d=>d.name.trim()).map((d,i)=><HorizBar key={d.name} name={d.name.trim()} value={d.value} max={tlData[0]?.value} color={PAL[(i+1)%PAL.length]} rank={i}/>)}
            </div>
          </GlassCard>

          <GlassCard className="chart-card">
            <SH title="Response & Resolution TAT"/>
            <div style={{display:'flex',flexDirection:'column',gap:20,paddingTop:16}}>
              <RadialProgress pct={respWithin} color={BLUE_LT} label="Response within 24 Hrs"/>
              <RadialProgress pct={resWithin}  color={BROWN_L} label="Resolution within 24 Hrs"/>
            </div>
          </GlassCard>
        </div>

        <div className="row-4">
          <GlassCard className="chart-card">
            <SH title="Priority"/>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={priorityData} cx="50%" cy="50%" outerRadius={72} dataKey="value"
                  label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false} style={{fontSize:9}} {...A(0,900)}>
                  <Cell fill={BLUE}/><Cell fill={BROWN_L}/><Cell fill={BLUE_SK}/><Cell fill={BROWN_D}/>
                </Pie>
                <Tooltip content={<TT/>}/>
              </PieChart>
            </ResponsiveContainer>
          </GlassCard>

          <GlassCard className="chart-card">
            <SH title="Case Age"/>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ageDist}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(180,140,100,0.07)"/>
                <XAxis dataKey="name" tick={{fill:'var(--muted)',fontSize:11}}/>
                <YAxis tick={{fill:'var(--muted)',fontSize:10}} tickFormatter={fmt}/>
                <Tooltip content={<TT/>}/>
                <Bar dataKey="value" radius={[5,5,0,0]} {...A(0,900)}>
                  <Cell fill={BLUE_SK}/><Cell fill={BROWN_L}/><Cell fill={BROWN}/><Cell fill={BLUE_LT}/>
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>

          <GlassCard className="chart-card">
            <SH title="Reassignments"/>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={reassignData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(180,140,100,0.07)"/>
                <XAxis dataKey="name" tick={{fill:'var(--muted)',fontSize:11}}/>
                <YAxis tick={{fill:'var(--muted)',fontSize:10}} tickFormatter={fmt}/>
                <Tooltip content={<TT/>}/>
                <Bar dataKey="value" radius={[5,5,0,0]} {...A(0,900)}>
                  <Cell fill={BLUE}/><Cell fill={BLUE_LT}/><Cell fill={BROWN_L}/><Cell fill={BROWN}/>
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>

          <GlassCard className="chart-card">
            <SH title="Applicability"/>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={applyData} cx="50%" cy="50%" outerRadius={72} dataKey="value"
                  label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false} style={{fontSize:9}} {...A(0,900)}>
                  {applyData.map((d,i)=><Cell key={i} fill={PAL[(i+1)%PAL.length]}/>)}
                </Pie>
                <Tooltip content={<TT/>}/>
              </PieChart>
            </ResponsiveContainer>
          </GlassCard>
        </div>

        <GlassCard className="chart-card wide">
          <SH title="Case Records" sub={`First 50 of ${fmt(data.length)} filtered records`}/>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr>{['Case #','Owner','HOD','Team Leader','Area','Sub Area','Status','Type','Origin','Priority','Age','Project'].map(h=><th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {data.slice(0,50).map((r,i)=>(
                  <tr key={i}>
                    <td className="mono">{r['Case Number']}</td>
                    <td>{r['Case Owner']}</td>
                    <td>{r['HOD 1']}</td>
                    <td>{String(r['Team Leader']).trim()}</td>
                    <td>{r['Area']}</td>
                    <td className="muted-cell">{r['Sub Area']}</td>
                    <td><span className="pill" style={{background:`${STATUS_C[r['Status']]||BROWN}18`,color:STATUS_C[r['Status']]||OFFWHT,borderColor:`${STATUS_C[r['Status']]||BROWN}55`}}>{r['Status']}</span></td>
                    <td>{r['Case Type']}</td>
                    <td className="muted-cell">{r['Case Origin']}</td>
                    <td>{r['Priority']}</td>
                    <td className="mono">{r['Age']}</td>
                    <td className="muted-cell">{r['Project']}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        <div className="footer">
          SmartWorld CRM Dashboard &nbsp;·&nbsp;
          Replace <strong style={{color:BROWN_L}}>public/Case_Management.xlsx</strong> to refresh &nbsp;·&nbsp;
          {fmt(rawData.length)} records loaded
        </div>
      </main>
    </div>
  );
}
