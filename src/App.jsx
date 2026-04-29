import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts';
import './App.css';

const PALETTE = ['#1e90ff','#00d4ff','#8b5cf6','#ec4899','#10b981','#f59e0b','#ef4444','#f97316','#06b6d4','#a855f7'];

const STATUS_COLORS = {
  Resolved: '#10b981', Closed: '#3b82f6', Close: '#3b82f6',
  'In Progress': '#f59e0b', New: '#8b5cf6',
  'Pending for Clarification': '#ef4444', 'Re-Open': '#f97316',
};

async function loadExcel() {
  const res = await fetch('./Case_Management.xlsx');
  const buf = await res.arrayBuffer();
  const wb  = XLSX.read(buf, { type: 'array', cellDates: true });
  const ws  = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { defval: '' });
}

function countBy(arr, key) {
  const m = {};
  arr.forEach(r => { const v = r[key] || 'Unknown'; m[v] = (m[v] || 0) + 1; });
  return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
}

function fmt(n) {
  if (n >= 1e6) return (n/1e6).toFixed(1)+'M';
  if (n >= 1e3) return (n/1e3).toFixed(1)+'K';
  return String(n);
}

function GlassCard({ children, className='', style={} }) {
  return <div className={`glass-card ${className}`} style={style}>{children}</div>;
}

function KpiCard({ label, value, color, icon, delay=0 }) {
  const [display, setDisplay] = useState(0);
  const target = parseInt(value) || 0;
  useEffect(() => {
    let cur = 0;
    const step = Math.max(1, Math.ceil(target / 60));
    const t = setInterval(() => {
      cur = Math.min(cur + step, target);
      setDisplay(cur);
      if (cur >= target) clearInterval(t);
    }, 16);
    return () => clearInterval(t);
  }, [target]);
  return (
    <GlassCard className="kpi-card" style={{ '--accent': color, animationDelay: `${delay}ms` }}>
      <div className="kpi-icon" style={{ background: `${color}25`, color }}>{icon}</div>
      <div className="kpi-body">
        <div className="kpi-val" style={{ color }}>{fmt(display)}</div>
        <div className="kpi-lbl">{label}</div>
      </div>
      <div className="kpi-glow" style={{ background: color }} />
    </GlassCard>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="tt">
      <p className="tt-label">{label}</p>
      {payload.map((p,i) => <p key={i} style={{ color: p.color || p.fill }}>{p.name||'Value'}: <b>{fmt(p.value)}</b></p>)}
    </div>
  );
}

function SectionHeader({ title, sub }) {
  return (
    <div className="sec-hdr">
      <span className="sec-title">{title}</span>
      {sub && <span className="sec-sub">{sub}</span>}
    </div>
  );
}

function HorizBar({ name, value, max, color, rank }) {
  const pct = max ? (value/max)*100 : 0;
  return (
    <div className="hbar" style={{ animationDelay: `${rank*60}ms` }}>
      <div className="hbar-name" title={name}>{name}</div>
      <div className="hbar-track"><div className="hbar-fill" style={{ width:`${pct}%`, background: color }} /></div>
      <div className="hbar-val">{fmt(value)}</div>
    </div>
  );
}

function FilterSel({ label, options, value, onChange }) {
  return (
    <div className="flt-item">
      <label>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}>
        <option value="">All</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

export default function App() {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError]       = useState(null);

  const [fStatus,  setFStatus]  = useState('');
  const [fOwner,   setFOwner]   = useState('');
  const [fArea,    setFArea]    = useState('');
  const [fProject, setFProject] = useState('');
  const [fType,    setFType]    = useState('');
  const [fOrigin,  setFOrigin]  = useState('');
  const [fTL,      setFTL]      = useState('');
  const [fApply,   setFApply]   = useState('');

  useEffect(() => {
    let p = 0;
    const ticker = setInterval(() => { p = Math.min(p+2, 85); setProgress(p); }, 180);
    loadExcel()
      .then(data => { clearInterval(ticker); setProgress(100); setTimeout(() => { setRawData(data); setLoading(false); }, 200); })
      .catch(e  => { clearInterval(ticker); setError(e.message); setLoading(false); });
  }, []);

  const data = useMemo(() => rawData.filter(r => {
    if (fStatus  && r['Status']            !== fStatus)  return false;
    if (fOwner   && r['Case Owner']         !== fOwner)   return false;
    if (fArea    && r['Area']               !== fArea)    return false;
    if (fProject && r['Project']            !== fProject) return false;
    if (fType    && r['Case Type']          !== fType)    return false;
    if (fOrigin  && r['Case Origin']        !== fOrigin)  return false;
    if (fTL      && r['Team Leader']        !== fTL)      return false;
    if (fApply   && r['Case Applicability'] !== fApply)   return false;
    return true;
  }), [rawData, fStatus, fOwner, fArea, fProject, fType, fOrigin, fTL, fApply]);

  const opts = useMemo(() => {
    if (!rawData.length) return {};
    const u = k => [...new Set(rawData.map(r=>r[k]).filter(Boolean))].sort();
    return { status:u('Status'), owner:u('Case Owner'), area:u('Area'), project:u('Project'), caseType:u('Case Type'), origin:u('Case Origin'), tl:u('Team Leader'), apply:u('Case Applicability') };
  }, [rawData]);

  const kpis = useMemo(() => {
    const closed = data.filter(r => ['Closed','Close','Resolved'].includes(r['Status'])).length;
    const open   = data.filter(r => !['Closed','Close','Resolved'].includes(r['Status'])).length;
    return {
      total: data.length, closed, open,
      inProg: data.filter(r => r['Status']==='In Progress').length,
      reopen: data.filter(r => r['Status']==='Re-Open').length,
      hni:    data.filter(r => r['HNI Customer']===true||r['HNI Customer']==='Yes'||r['HNI Customer']==='TRUE').length,
    };
  }, [data]);

  const statusData   = useMemo(() => countBy(data, 'Status'), [data]);
  const originData   = useMemo(() => countBy(data, 'Case Origin').slice(0,8), [data]);
  const caseTypeData = useMemo(() => countBy(data, 'Case Type'), [data]);
  const ownerData    = useMemo(() => countBy(data, 'Case Owner').slice(0,12), [data]);
  const areaData     = useMemo(() => countBy(data, 'Area').slice(0,10), [data]);
  const projectData  = useMemo(() => countBy(data, 'Project').slice(0,8), [data]);
  const priorityData = useMemo(() => countBy(data, 'Priority'), [data]);
  const tlData       = useMemo(() => countBy(data,'Team Leader').filter(d=>d.name.trim()).slice(0,8), [data]);
  const applyData    = useMemo(() => countBy(data,'Case Applicability').filter(d=>d.name&&d.name!=='Unknown'), [data]);
  const respTime     = useMemo(() => countBy(data,'Response Time Category').filter(d=>d.name!=='Unknown'), [data]);
  const resTime      = useMemo(() => countBy(data,'Resolution Time Category').filter(d=>d.name!=='Unknown'), [data]);

  const subAreaData = useMemo(() => {
    const m = {};
    data.forEach(r => { if (r['Sub Area']) { const k=`${r['Area']} › ${r['Sub Area']}`; m[k]=(m[k]||0)+1; }});
    return Object.entries(m).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value).slice(0,10);
  }, [data]);

  const monthlyData = useMemo(() => {
    const m = {};
    data.forEach(r => {
      const dt = r['Date/Time Opened'];
      if (!dt) return;
      let key;
      if (dt instanceof Date) key = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`;
      else if (typeof dt==='string'&&dt.includes('/')) {
        const p=dt.split('/');
        if (p.length>=3) key=`${p[2]?.split(',')[0]?.trim()}-${String(p[0]).padStart(2,'0')}`;
      }
      if (key&&key.length>=7) m[key]=(m[key]||0)+1;
    });
    return Object.entries(m).sort((a,b)=>a[0].localeCompare(b[0])).slice(-18).map(([name,value])=>({name:name.slice(0,7),value}));
  }, [data]);

  const ageDist = useMemo(() => {
    const b={'1-7d':0,'8-30d':0,'31-90d':0,'90d+':0};
    data.forEach(r=>{ const a=Number(r['Age']); if(!isNaN(a)){if(a<=7)b['1-7d']++;else if(a<=30)b['8-30d']++;else if(a<=90)b['31-90d']++;else b['90d+']++;}});
    return Object.entries(b).map(([name,value])=>({name,value}));
  }, [data]);

  const reassignData = useMemo(() => {
    const m={'0':0,'1':0,'2':0,'3+':0};
    data.forEach(r=>{ const n=Number(r['Number of Reassigns']); if(!isNaN(n)){if(n===0)m['0']++;else if(n===1)m['1']++;else if(n===2)m['2']++;else m['3+']++;}});
    return Object.entries(m).map(([name,value])=>({name,value}));
  }, [data]);

  const hasFilter = fStatus||fOwner||fArea||fProject||fType||fOrigin||fTL||fApply;
  const clearAll  = () => { setFStatus('');setFOwner('');setFArea('');setFProject('');setFType('');setFOrigin('');setFTL('');setFApply(''); };

  if (loading) return (
    <div className="loading-screen">
      <div className="loader-orb"/>
      <div className="loader-title">SmartWorld CRM</div>
      <div className="loader-sub">Loading {progress<85?'Excel data':'charts'}…</div>
      <div className="progress-bar"><div className="progress-fill" style={{width:`${progress}%`}}/></div>
      <div className="progress-pct">{progress}%</div>
    </div>
  );

  if (error) return (
    <div className="loading-screen">
      <div className="loader-title" style={{color:'#ef4444'}}>⚠ Error</div>
      <div className="loader-sub">{error}</div>
    </div>
  );

  return (
    <div className="app">
      <div className="bg-layer">
        <div className="orb orb1"/><div className="orb orb2"/><div className="orb orb3"/>
        <div className="grid-overlay"/>
      </div>

      {/* Header */}
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
          <div className="hdr-stat"><span className="hdr-val">{fmt(data.length)}</span><span>Filtered</span></div>
          <div className="live-badge"><span className="live-dot"/>Live</div>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="filter-grid">
          <FilterSel label="Status"        options={opts.status}   value={fStatus}  onChange={setFStatus} />
          <FilterSel label="Case Type"     options={opts.caseType} value={fType}    onChange={setFType} />
          <FilterSel label="Origin"        options={opts.origin}   value={fOrigin}  onChange={setFOrigin} />
          <FilterSel label="Area"          options={opts.area}     value={fArea}    onChange={setFArea} />
          <FilterSel label="Project"       options={opts.project}  value={fProject} onChange={setFProject} />
          <FilterSel label="Case Owner"    options={opts.owner}    value={fOwner}   onChange={setFOwner} />
          <FilterSel label="Team Leader"   options={opts.tl}       value={fTL}      onChange={setFTL} />
          <FilterSel label="Applicability" options={opts.apply}    value={fApply}   onChange={setFApply} />
        </div>
        {hasFilter && <button className="clear-btn" onClick={clearAll}>✕ Clear Filters</button>}
      </div>

      <main className="content">

        {/* KPIs */}
        <div className="kpi-row">
          <KpiCard label="Total Tickets"    value={kpis.total}  color="#1e90ff" icon="🎫" delay={0} />
          <KpiCard label="Resolved/Closed"  value={kpis.closed} color="#10b981" icon="✅" delay={80} />
          <KpiCard label="Open Tickets"     value={kpis.open}   color="#f59e0b" icon="📂" delay={160} />
          <KpiCard label="In Progress"      value={kpis.inProg} color="#8b5cf6" icon="⚙️" delay={240} />
          <KpiCard label="Re-Opened"        value={kpis.reopen} color="#f97316" icon="🔄" delay={320} />
          <KpiCard label="HNI Customers"    value={kpis.hni}    color="#ec4899" icon="⭐" delay={400} />
        </div>

        {/* Row: Status + Type + Origin */}
        <div className="row-3">
          <GlassCard className="chart-card">
            <SectionHeader title="Status Distribution" />
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value" animationDuration={900}>
                  {statusData.map((d,i)=><Cell key={i} fill={STATUS_COLORS[d.name]||PALETTE[i%PALETTE.length]} stroke="rgba(255,255,255,0.08)" strokeWidth={2}/>)}
                </Pie>
                <Tooltip content={<CustomTooltip/>}/><Legend formatter={v=><span style={{fontSize:10}}>{v}</span>}/>
              </PieChart>
            </ResponsiveContainer>
          </GlassCard>

          <GlassCard className="chart-card">
            <SectionHeader title="Case Type Split" />
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={caseTypeData} cx="50%" cy="50%" outerRadius={90} paddingAngle={4} dataKey="value" animationDuration={900}
                  label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine>
                  {caseTypeData.map((d,i)=><Cell key={i} fill={PALETTE[i%PALETTE.length]} stroke="rgba(255,255,255,0.08)" strokeWidth={2}/>)}
                </Pie>
                <Tooltip content={<CustomTooltip/>}/>
              </PieChart>
            </ResponsiveContainer>
          </GlassCard>

          <GlassCard className="chart-card">
            <SectionHeader title="Case Origin" />
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={originData} layout="vertical" margin={{left:8,right:30}}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
                <XAxis type="number" tick={{fill:'#94a3b8',fontSize:10}} tickFormatter={fmt}/>
                <YAxis dataKey="name" type="category" width={115} tick={{fill:'#94a3b8',fontSize:10}}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Bar dataKey="value" radius={[0,4,4,0]} animationDuration={900}>
                  {originData.map((d,i)=><Cell key={i} fill={PALETTE[i%PALETTE.length]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>
        </div>

        {/* Monthly Trend */}
        {monthlyData.length>2 && (
          <GlassCard className="chart-card wide">
            <SectionHeader title="Monthly Case Volume Trend" sub="Cases opened per month" />
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={monthlyData} margin={{left:10,right:20}}>
                <defs>
                  <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#1e90ff" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="#1e90ff" stopOpacity={0.02}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
                <XAxis dataKey="name" tick={{fill:'#94a3b8',fontSize:10}}/>
                <YAxis tick={{fill:'#94a3b8',fontSize:10}} tickFormatter={fmt}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Area type="monotone" dataKey="value" name="Cases" stroke="#1e90ff" strokeWidth={2.5} fill="url(#ag)" animationDuration={1200}/>
              </AreaChart>
            </ResponsiveContainer>
          </GlassCard>
        )}

        {/* Case Owners */}
        <GlassCard className="chart-card wide">
          <SectionHeader title="Cases by Case Owner" sub={`Top ${ownerData.length}`} />
          <div className="hbars">
            {ownerData.map((d,i)=><HorizBar key={d.name} name={d.name} value={d.value} max={ownerData[0]?.value} color={PALETTE[i%PALETTE.length]} rank={i}/>)}
          </div>
        </GlassCard>

        {/* Area + Sub Area */}
        <div className="row-2">
          <GlassCard className="chart-card">
            <SectionHeader title="Cases by Area" sub="Top 10" />
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={areaData} margin={{left:5,right:5,bottom:55}}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
                <XAxis dataKey="name" tick={{fill:'#94a3b8',fontSize:9}} angle={-35} textAnchor="end" interval={0}/>
                <YAxis tick={{fill:'#94a3b8',fontSize:10}} tickFormatter={fmt}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Bar dataKey="value" radius={[4,4,0,0]} animationDuration={900}>
                  {areaData.map((d,i)=><Cell key={i} fill={PALETTE[i%PALETTE.length]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>

          <GlassCard className="chart-card">
            <SectionHeader title="Top Sub-Areas" sub="Area › Sub Area" />
            <div className="hbars">
              {subAreaData.map((d,i)=><HorizBar key={d.name} name={d.name} value={d.value} max={subAreaData[0]?.value} color={PALETTE[i%PALETTE.length]} rank={i}/>)}
            </div>
          </GlassCard>
        </div>

        {/* Project + TL + TAT */}
        <div className="row-3">
          <GlassCard className="chart-card">
            <SectionHeader title="Cases by Project" />
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={projectData} cx="50%" cy="50%" innerRadius={45} outerRadius={85} paddingAngle={3} dataKey="value" animationDuration={900}>
                  {projectData.map((d,i)=><Cell key={i} fill={PALETTE[i%PALETTE.length]} stroke="rgba(255,255,255,0.08)" strokeWidth={2}/>)}
                </Pie>
                <Tooltip content={<CustomTooltip/>}/><Legend formatter={v=><span style={{fontSize:10}}>{v}</span>}/>
              </PieChart>
            </ResponsiveContainer>
          </GlassCard>

          <GlassCard className="chart-card">
            <SectionHeader title="Team Leader Workload" />
            <div className="hbars">
              {tlData.filter(d=>d.name.trim()).map((d,i)=><HorizBar key={d.name} name={d.name.trim()} value={d.value} max={tlData[0]?.value} color={PALETTE[(i+3)%PALETTE.length]} rank={i}/>)}
            </div>
          </GlassCard>

          <GlassCard className="chart-card">
            <SectionHeader title="TAT: Response & Resolution" />
            <p className="tat-lbl">Response Time</p>
            <ResponsiveContainer width="100%" height={105}>
              <PieChart>
                <Pie data={respTime} cx="50%" cy="50%" outerRadius={42} dataKey="value" animationDuration={900} label={({name,percent})=>`${name}: ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={9}>
                  {respTime.map((d,i)=><Cell key={i} fill={i===0?'#10b981':'#ef4444'}/>)}
                </Pie>
                <Tooltip content={<CustomTooltip/>}/>
              </PieChart>
            </ResponsiveContainer>
            <p className="tat-lbl">Resolution Time</p>
            <ResponsiveContainer width="100%" height={105}>
              <PieChart>
                <Pie data={resTime} cx="50%" cy="50%" outerRadius={42} dataKey="value" animationDuration={1100} label={({name,percent})=>`${name}: ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={9}>
                  {resTime.map((d,i)=><Cell key={i} fill={i===0?'#3b82f6':'#f59e0b'}/>)}
                </Pie>
                <Tooltip content={<CustomTooltip/>}/>
              </PieChart>
            </ResponsiveContainer>
          </GlassCard>
        </div>

        {/* Mini charts row */}
        <div className="row-4">
          <GlassCard className="chart-card">
            <SectionHeader title="Priority"/>
            <ResponsiveContainer width="100%" height={190}>
              <PieChart>
                <Pie data={priorityData} cx="50%" cy="50%" outerRadius={70} dataKey="value" animationDuration={900} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                  <Cell fill="#ef4444"/><Cell fill="#f59e0b"/><Cell fill="#10b981"/><Cell fill="#8b5cf6"/>
                </Pie>
                <Tooltip content={<CustomTooltip/>}/>
              </PieChart>
            </ResponsiveContainer>
          </GlassCard>

          <GlassCard className="chart-card">
            <SectionHeader title="Case Age"/>
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={ageDist}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
                <XAxis dataKey="name" tick={{fill:'#94a3b8',fontSize:11}}/>
                <YAxis tick={{fill:'#94a3b8',fontSize:10}} tickFormatter={fmt}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Bar dataKey="value" radius={[4,4,0,0]} animationDuration={900}>
                  <Cell fill="#10b981"/><Cell fill="#f59e0b"/><Cell fill="#ef4444"/><Cell fill="#8b5cf6"/>
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>

          <GlassCard className="chart-card">
            <SectionHeader title="Reassignments"/>
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={reassignData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
                <XAxis dataKey="name" tick={{fill:'#94a3b8',fontSize:11}}/>
                <YAxis tick={{fill:'#94a3b8',fontSize:10}} tickFormatter={fmt}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Bar dataKey="value" radius={[4,4,0,0]} animationDuration={900}>
                  <Cell fill="#1e90ff"/><Cell fill="#8b5cf6"/><Cell fill="#f59e0b"/><Cell fill="#ef4444"/>
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>

          <GlassCard className="chart-card">
            <SectionHeader title="Applicability"/>
            <ResponsiveContainer width="100%" height={190}>
              <PieChart>
                <Pie data={applyData} cx="50%" cy="50%" outerRadius={70} dataKey="value" animationDuration={900} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                  {applyData.map((d,i)=><Cell key={i} fill={PALETTE[(i+2)%PALETTE.length]}/>)}
                </Pie>
                <Tooltip content={<CustomTooltip/>}/>
              </PieChart>
            </ResponsiveContainer>
          </GlassCard>
        </div>

        {/* Data Table */}
        <GlassCard className="chart-card wide">
          <SectionHeader title="Case Records" sub={`First 50 of ${fmt(data.length)} records`} />
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>{['Case #','Owner','HOD','Team Leader','Area','Sub Area','Status','Type','Origin','Priority','Age','Project'].map(h=><th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {data.slice(0,50).map((r,i)=>(
                  <tr key={i}>
                    <td className="mono">{r['Case Number']}</td>
                    <td>{r['Case Owner']}</td>
                    <td>{r['HOD 1']}</td>
                    <td>{String(r['Team Leader']).trim()}</td>
                    <td>{r['Area']}</td>
                    <td className="muted">{r['Sub Area']}</td>
                    <td><span className="pill" style={{background:`${STATUS_COLORS[r['Status']]||'#64748b'}20`,color:STATUS_COLORS[r['Status']]||'#94a3b8',borderColor:STATUS_COLORS[r['Status']]||'#64748b'}}>{r['Status']}</span></td>
                    <td>{r['Case Type']}</td>
                    <td className="muted">{r['Case Origin']}</td>
                    <td>{r['Priority']}</td>
                    <td className="mono">{r['Age']}</td>
                    <td className="muted">{r['Project']}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        <div className="footer">
          SmartWorld CRM Dashboard &nbsp;·&nbsp; Data: Case_Management.xlsx — replace file to refresh &nbsp;·&nbsp; {fmt(rawData.length)} records loaded
        </div>
      </main>
    </div>
  );
}
