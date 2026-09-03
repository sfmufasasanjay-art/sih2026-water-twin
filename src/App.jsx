import React, { useState, useEffect, useRef } from 'react';
import { Activity, Droplets, AlertTriangle, CheckCircle, Power, SlidersHorizontal, Info, Play, Square, FastForward, ShieldCheck, List, Cpu, Settings } from 'lucide-react';
import WaterTreatmentSimulation from './components/WaterTreatmentSimulation';

const MODULE_SPECS = {
  sediment: { title: 'Sedimentation Tank', purpose: 'Removes large suspended solids, sand, and turbidity from raw water.', spec: 'Flow Rate: 50L/m | Media: Silica Sand / Gravel' },
  carbon: { title: 'Activated Carbon', purpose: 'Removes chlorine, organic compounds, and unwanted odor/taste.', spec: 'Media: Granular Activated Carbon (GAC)' },
  membrane: { title: 'Reverse Osmosis', purpose: 'Forces water through a semi-permeable membrane to remove dissolved solids (TDS).', spec: 'Rejection rate: 99.2% | Pressure: 15 bar' },
  phCorrection: { title: 'Chemical Dosing Unit', purpose: 'Neutralizes pH to acceptable drinking water levels (6.5 - 8.5).', spec: 'Dosing Pump: Diaphragm | Reagent: NaOH/HCl' },
  disinfection: { title: 'UV Disinfection', purpose: 'Inactivates pathogens using ultraviolet light.', spec: 'Wavelength: 254 nm | Dose: 40 mJ/cm²' },
};

function App() {
  const [sensors, setSensors] = useState({ pH: 7.2, tds: 350, turbidity: 5, temp: 24.5 });
  const [sensor2, setSensor2] = useState({ pH: 7.2, tds: 340, turbidity: 2, temp: 24.5 });
  const [activeModules, setActiveModules] = useState({ sediment: false, carbon: false, membrane: false, phCorrection: false, disinfection: true });
  
  const [verificationStatus, setVerificationStatus] = useState('ACCEPT'); // ACCEPT, RE-TREAT, DIVERT
  const [flowRate, setFlowRate] = useState(0);
  const [selectedModule, setSelectedModule] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [decisionLog, setDecisionLog] = useState([]);
  const [activeScenarioName, setActiveScenarioName] = useState('MANUAL MODE');
  
  const [isAutoDemo, setIsAutoDemo] = useState(false);
  const [autoDemoStep, setAutoDemoStep] = useState(0);
  const autoDemoTimer = useRef(null);

  const addLog = (msg) => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' });
    setDecisionLog(prev => [{ time, msg, id: Math.random() }, ...prev].slice(0, 15));
  };

  const runScenario = (name) => {
    setActiveScenarioName(name);
    setIsSimulating(true);
    addLog(`--- SCENARIO: ${name.toUpperCase()} ---`);
    
    let s1 = { ...sensors };
    let s2 = { ...sensor2 };
    let vStatus = 'ACCEPT';
    
    if (name === 'Normal Water') {
      s1 = { pH: 7.2, tds: 350, turbidity: 5, temp: 24.5 };
      s2 = { pH: 7.2, tds: 340, turbidity: 2, temp: 24.5 };
      vStatus = 'ACCEPT';
      addLog('Sensor 1 -> Water parameters NORMAL');
    } else if (name === 'High Turbidity') {
      s1 = { pH: 7.2, tds: 350, turbidity: 64, temp: 24.5 };
      s2 = { pH: 7.2, tds: 340, turbidity: 3, temp: 24.5 };
      vStatus = 'ACCEPT';
      addLog('Sensor 1 -> Turbidity HIGH (64 NTU)');
      addLog('ESP32 -> Sedimentation ACTIVATED');
    } else if (name === 'High TDS') {
      s1 = { pH: 7.2, tds: 800, turbidity: 5, temp: 24.5 };
      s2 = { pH: 7.1, tds: 150, turbidity: 2, temp: 24.5 };
      vStatus = 'ACCEPT';
      addLog('Sensor 1 -> TDS HIGH (800 ppm)');
      addLog('ESP32 -> RO Membrane ACTIVATED');
    } else if (name === 'Multiple Abnormal') {
      s1 = { pH: 5.5, tds: 800, turbidity: 64, temp: 24.5 };
      s2 = { pH: 7.2, tds: 150, turbidity: 3, temp: 24.5 };
      vStatus = 'ACCEPT';
      addLog('Sensor 1 -> MULTIPLE ABNORMALITIES');
      addLog('ESP32 -> Multi-stage routing ACTIVATED');
    } else if (name === 'Abnormal pH') {
      s1 = { pH: 5.5, tds: 350, turbidity: 5, temp: 24.5 };
      s2 = { pH: 7.1, tds: 350, turbidity: 2, temp: 24.5 };
      vStatus = 'ACCEPT';
      addLog('Sensor 1 -> pH LOW (5.5)');
      addLog('ESP32 -> pH Correction ACTIVATED');
    } else if (name === 'Post-Treatment Failure (Re-treat)') {
      s1 = { pH: 7.2, tds: 350, turbidity: 5, temp: 24.5 };
      s2 = { pH: 7.2, tds: 350, turbidity: 15, temp: 24.5 }; 
      vStatus = 'RE-TREAT';
      addLog('Sensor 2 -> Verification FAILED (Turbidity > 10)');
      addLog('ESP32 -> Initiating RE-TREATMENT LOOP');
    } else if (name === 'Second Verification Failure (Divert)') {
      s1 = { pH: 7.2, tds: 350, turbidity: 5, temp: 24.5 };
      s2 = { pH: 7.2, tds: 350, turbidity: 18, temp: 24.5 }; 
      vStatus = 'DIVERT';
      addLog('Sensor 2 -> Verification FAILED AGAIN');
      addLog('ESP32 -> DIVERTING TO REJECT TANK');
      addLog('SYSTEM -> DO NOT RELEASE');
    }

    setSensors(s1);
    setSensor2(s2);
    setVerificationStatus(vStatus);
  };

  useEffect(() => {
    let modules = { sediment: false, carbon: false, membrane: false, phCorrection: false, disinfection: true };
    
    if (sensors.turbidity > 10) modules.sediment = true;
    if (sensors.tds > 500) { modules.membrane = true; modules.carbon = true; }
    if (sensors.pH < 6.5 || sensors.pH > 8.5) modules.phCorrection = true;
    
    if (verificationStatus === 'RE-TREAT' || verificationStatus === 'DIVERT') {
       modules.sediment = true;
    }
    
    setActiveModules(modules);
    
    if (isSimulating) {
      setFlowRate(120);
      const interval = setInterval(() => { setFlowRate(prev => Math.max(0, 120 + (Math.random() * 4 - 2))); }, 2000);
      return () => clearInterval(interval);
    } else {
      setFlowRate(0);
    }
  }, [sensors, isSimulating, verificationStatus]);

  const DEMO_STEPS = [
    'Normal Water', 'High Turbidity', 'High TDS', 'Multiple Abnormal', 
    'Abnormal pH', 'Post-Treatment Failure (Re-treat)', 'Second Verification Failure (Divert)'
  ];

  useEffect(() => {
    if (isAutoDemo) {
      runScenario(DEMO_STEPS[autoDemoStep]);
      autoDemoTimer.current = setTimeout(() => {
        setAutoDemoStep(prev => (prev + 1) % DEMO_STEPS.length);
      }, 8000);
    }
    return () => clearTimeout(autoDemoTimer.current);
  }, [isAutoDemo, autoDemoStep]);

  const handleSensorChange = (e) => {
    setActiveScenarioName('MANUAL MODE');
    const { name, value } = e.target;
    setSensors(prev => ({ ...prev, [name]: parseFloat(value) }));
    if (!isSimulating) setIsSimulating(true);
  };

  const getReasonForModule = (id) => {
    if (id === 'sediment') return sensors.turbidity > 10 ? `Turbidity (${sensors.turbidity} NTU) > 10 NTU` : (verificationStatus !== 'ACCEPT' ? 'Re-treatment active' : 'N/A');
    if (id === 'carbon' || id === 'membrane') return sensors.tds > 500 ? `TDS (${sensors.tds} ppm) > 500 ppm` : 'N/A';
    if (id === 'phCorrection') return (sensors.pH < 6.5 || sensors.pH > 8.5) ? `pH (${sensors.pH}) outside 6.5-8.5` : 'N/A';
    if (id === 'disinfection') return 'Always Active (Final Stage)';
    return 'N/A';
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 font-sans selection:bg-blue-500/30 overflow-x-hidden">
      
      <header className="h-16 bg-[#0f172a] border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-3">
          <Droplets className="text-blue-500 h-6 w-6" />
          <span className="text-slate-100 font-bold tracking-widest text-sm">AQUA-TWIN PRO</span>
        </div>
        <div className="flex gap-4">
           <button onClick={() => { setIsAutoDemo(!isAutoDemo); if(!isAutoDemo) setAutoDemoStep(0); }} className={`flex items-center gap-2 px-4 py-2 rounded font-bold text-xs ${isAutoDemo ? 'bg-purple-500/20 text-purple-400 border border-purple-500' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
              <FastForward size={14} /> {isAutoDemo ? 'STOP AUTO DEMO' : 'START AUTO DEMO'}
           </button>
           <button onClick={() => setIsSimulating(!isSimulating)} className={`flex items-center gap-2 px-4 py-2 rounded font-bold text-xs ${isSimulating ? 'bg-rose-500/20 text-rose-400 border border-rose-500' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500'}`}>
              {isSimulating ? <><Square size={14}/> STOP PROCESS</> : <><Play size={14}/> START PROCESS</>}
           </button>
        </div>
      </header>

      <main className="p-6 max-w-[1920px] mx-auto">
        <div className="flex flex-col xl:flex-row gap-6">
          
          <div className="xl:w-1/4 space-y-6 xl:sticky xl:top-24 xl:h-[calc(100vh-8rem)] overflow-y-auto pr-2 custom-scrollbar">
             
             <Panel title="SIMULATION SCENARIOS" icon={<Activity />}>
                <div className="grid grid-cols-1 gap-2">
                   {DEMO_STEPS.map(s => (
                     <button key={s} onClick={() => { setIsAutoDemo(false); runScenario(s); }} className={`text-left px-3 py-2 text-xs font-semibold rounded border ${activeScenarioName === s && !isAutoDemo ? 'bg-blue-500/20 border-blue-500 text-blue-300' : 'bg-[#0f172a] border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                        {s.toUpperCase()}
                     </button>
                   ))}
                </div>
             </Panel>

             <Panel title="INFLUENT SENSOR 1" icon={<SlidersHorizontal />}>
                <RangeSlider label="pH Level" name="pH" value={sensors.pH} min={0} max={14} step={0.1} normalRange={[6.5, 8.5]} color="text-emerald-400" onChange={handleSensorChange} />
                <RangeSlider label="TDS (ppm)" name="tds" value={sensors.tds} min={0} max={1500} step={10} normalRange={[0, 500]} color="text-blue-400" onChange={handleSensorChange} />
                <RangeSlider label="Turbidity (NTU)" name="turbidity" value={sensors.turbidity} min={0} max={100} step={1} normalRange={[0, 10]} color="text-amber-400" onChange={handleSensorChange} />
             </Panel>

             <Panel title="EDGE ROUTING DECISIONS" icon={<Cpu />}>
                <p className="text-[10px] text-slate-500 mb-3 uppercase tracking-wider">Configurable Prototype Thresholds</p>
                <div className="space-y-2">
                   <LogicRow name="Coagulation/Sediment" active={activeModules.sediment} condition="Turbidity > 10 NTU" />
                   <LogicRow name="Carbon Adsorption" active={activeModules.carbon} condition="TDS > 500 ppm" />
                   <LogicRow name="Membrane / RO" active={activeModules.membrane} condition="TDS > 500 ppm" />
                   <LogicRow name="pH Correction" active={activeModules.phCorrection} condition="pH < 6.5 OR pH > 8.5" />
                   <LogicRow name="UV Disinfection" active={true} condition="Final Stage" alwaysOn />
                </div>
             </Panel>
             
          </div>

          <div className="xl:w-3/4 space-y-6">
             
             <div className="bg-[#0f172a] border border-slate-700 rounded-xl p-5 flex flex-col md:flex-row justify-between items-center gap-4 shadow-lg">
                <div>
                   <h2 className="text-xl font-bold text-white flex items-center gap-2">
                     <span className={`w-3 h-3 rounded-full ${isSimulating ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`}></span>
                     SYSTEM STATUS: {isSimulating ? (isAutoDemo ? 'AUTO DEMO ACTIVE' : 'ADAPTIVE TREATMENT ACTIVE') : 'IDLE'}
                   </h2>
                   <p className="text-sm text-slate-400 mt-1">Scenario: <span className="text-blue-400 font-semibold">{activeScenarioName}</span></p>
                </div>
                <div className="flex gap-6 text-sm">
                   <div>
                     <p className="text-slate-500 uppercase text-[10px] font-bold tracking-wider mb-1">Selected Path</p>
                     <p className="text-emerald-400 font-semibold">{Object.entries(activeModules).filter(([k,v])=>v).map(([k])=>k).join(' → ')}</p>
                   </div>
                   <div>
                     <p className="text-slate-500 uppercase text-[10px] font-bold tracking-wider mb-1">Final Result</p>
                     <p className={`font-bold ${verificationStatus==='ACCEPT' ? 'text-emerald-400' : verificationStatus==='RE-TREAT' ? 'text-amber-400' : 'text-rose-500'}`}>{verificationStatus}</p>
                   </div>
                </div>
             </div>

             <div className="h-[600px] w-full bg-[#0b1120] rounded-xl border border-slate-700 relative shadow-inner overflow-hidden">
                <WaterTreatmentSimulation activeModules={activeModules} sensors={sensors} verificationStatus={verificationStatus} onSelectModule={setSelectedModule} isSimulating={isSimulating} />
                
                {selectedModule && MODULE_SPECS[selectedModule] && (
                   <div className="absolute top-4 right-4 z-20 w-80 bg-[#0f172a]/95 backdrop-blur border border-blue-500/50 rounded-xl p-5 shadow-2xl">
                      <div className="flex justify-between items-start mb-3">
                         <h3 className="font-bold text-slate-100">{MODULE_SPECS[selectedModule].title}</h3>
                         <button onClick={() => setSelectedModule(null)} className="text-slate-400 hover:text-white"><Square size={14}/></button>
                      </div>
                      <div className="space-y-3">
                         <div className="bg-slate-800/50 p-2 rounded border border-slate-700">
                           <p className="text-[10px] text-blue-400 font-bold uppercase mb-1">Why was this selected?</p>
                           <p className="text-xs text-slate-300">{getReasonForModule(selectedModule)}</p>
                           <p className="text-xs text-emerald-400 font-bold mt-1 uppercase text-[10px]">{activeModules[selectedModule] ? 'Action: Module Activated' : 'Action: Module Bypassed'}</p>
                         </div>
                         <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Purpose</p>
                            <p className="text-xs text-slate-300">{MODULE_SPECS[selectedModule].purpose}</p>
                         </div>
                      </div>
                   </div>
                )}
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                <Panel title="POST-TREATMENT VERIFICATION" icon={<ShieldCheck />}>
                   <div className="grid grid-cols-2 gap-3 mb-4">
                      <MetricBox label="pH" value={sensor2.pH.toFixed(1)} isWarning={sensor2.pH < 6.5 || sensor2.pH > 8.5} />
                      <MetricBox label="TDS (ppm)" value={sensor2.tds.toFixed(0)} isWarning={sensor2.tds > 500} />
                      <MetricBox label="Turbidity (NTU)" value={sensor2.turbidity.toFixed(1)} isWarning={sensor2.turbidity > 10} />
                      <MetricBox label="Temp (°C)" value={sensor2.temp.toFixed(1)} />
                   </div>
                   <div className={`p-3 rounded border ${verificationStatus==='ACCEPT' ? 'bg-emerald-500/10 border-emerald-500/30' : verificationStatus==='RE-TREAT' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-rose-500/10 border-rose-500/50'}`}>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Verification Result</p>
                      {verificationStatus === 'ACCEPT' && <p className="text-emerald-400 font-bold text-sm">✓ WITHIN CONFIGURED LIMITS</p>}
                      {verificationStatus === 'RE-TREAT' && <p className="text-amber-400 font-bold text-sm">⚠ QUALITY FAILED: RE-TREATMENT REQUIRED</p>}
                      {verificationStatus === 'DIVERT' && <p className="text-rose-500 font-bold text-sm">⛔ DO NOT RELEASE: VERIFICATION FAILED</p>}
                   </div>
                </Panel>

                <Panel title="LIVE DECISION LOG" icon={<List />}>
                   <div className="h-48 overflow-y-auto flex flex-col gap-2 font-mono text-[10px] custom-scrollbar">
                     {decisionLog.map(log => (
                       <div key={log.id} className="text-slate-300 border-l-2 border-blue-500/30 pl-2 py-0.5">
                         <span className="text-slate-500 mr-2">[{log.time}]</span>
                         <span className={log.msg.includes('FAIL') || log.msg.includes('DIVERT') ? 'text-rose-400' : log.msg.includes('ACCEPT') ? 'text-emerald-400' : ''}>{log.msg}</span>
                       </div>
                     ))}
                   </div>
                </Panel>

                <Panel title="SYSTEM COMPONENTS" icon={<Settings />}>
                   <div className="h-48 overflow-y-auto grid grid-cols-1 gap-1 custom-scrollbar pr-2">
                     <StatusRow name="ESP32 EDGE ENGINE" state="ONLINE" color="text-blue-400" />
                     <StatusRow name="Sensor Unit 1" state="ONLINE" color="text-blue-400" />
                     <StatusRow name="Smart Valve Manifold" state="ONLINE" color="text-blue-400" />
                     <StatusRow name="Main Water Pump" state={isSimulating ? "RUNNING" : "STOPPED"} color={isSimulating ? "text-emerald-400" : "text-slate-500"} />
                     <StatusRow name="Sedimentation" state={activeModules.sediment ? "ACTIVE" : "BYPASS"} color={activeModules.sediment ? "text-emerald-400" : "text-slate-500"} />
                     <StatusRow name="Carbon Adsorption" state={activeModules.carbon ? "ACTIVE" : "BYPASS"} color={activeModules.carbon ? "text-emerald-400" : "text-slate-500"} />
                     <StatusRow name="RO Membrane" state={activeModules.membrane ? "ACTIVE" : "BYPASS"} color={activeModules.membrane ? "text-emerald-400" : "text-slate-500"} />
                     <StatusRow name="pH Correction" state={activeModules.phCorrection ? "ACTIVE" : "BYPASS"} color={activeModules.phCorrection ? "text-emerald-400" : "text-slate-500"} />
                     <StatusRow name="UV Disinfection" state="ACTIVE" color="text-emerald-400" />
                     <StatusRow name="Sensor Unit 2" state="ONLINE" color="text-blue-400" />
                   </div>
                </Panel>

                <div className="lg:col-span-3 bg-gradient-to-br from-[#0f172a] to-[#020617] border border-blue-900/50 rounded-xl p-6 shadow-2xl">
                   <h3 className="text-blue-400 font-bold tracking-widest text-sm mb-4">WHY IS THIS SYSTEM DIFFERENT?</h3>
                   <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                      <NoveltyPoint num="1" title="ADAPTIVE" text="Treatment pathway changes automatically according to measured water quality." />
                      <NoveltyPoint num="2" title="MODULAR" text="Treatment modules can be hot-swapped and configured according to local requirements." />
                      <NoveltyPoint num="3" title="CLOSED-LOOP" text="Treated water is re-sensed and verified before final release." />
                      <NoveltyPoint num="4" title="FAIL-SAFE" text="Failed water is re-treated or diverted instead of being released to the public." />
                   </div>
                   <div className="border-t border-slate-800 pt-4 text-center">
                     <p className="text-slate-300 italic text-sm max-w-4xl mx-auto">"The novelty is not simply using multiple filters; it is intelligently orchestrating modular treatment through sensor-based routing and post-treatment verification."</p>
                     <p className="text-slate-500 text-[10px] mt-4 font-mono uppercase">Note: PASS = Within Configured Prototype Criteria. Real deployment requires laboratory calibration and validation.</p>
                   </div>
                </div>

             </div>
          </div>
        </div>
      </main>
    </div>
  );

  function Panel({ title, icon, children }) {
    return (
      <div className="bg-[#0f172a] rounded-xl border border-slate-700/80 shadow-md flex flex-col h-full">
        <div className="px-4 py-3 border-b border-slate-700/50 flex items-center gap-2 bg-[#1e293b]/30">
          <span className="text-blue-400">{icon}</span>
          <h2 className="text-xs font-bold text-slate-200 tracking-wider">{title}</h2>
        </div>
        <div className="p-4 flex-1">
          {children}
        </div>
      </div>
    );
  }

  function RangeSlider({ label, name, value, min, max, step, normalRange, color, onChange }) {
    const isNormal = value >= normalRange[0] && value <= normalRange[1];
    return (
      <div className="mb-4">
        <div className="flex justify-between items-end mb-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</label>
          <span className={`font-mono text-sm font-bold ${isNormal ? color : 'text-rose-400'}`}>{value}</span>
        </div>
        <input type="range" name={name} min={min} max={max} step={step} value={value} onChange={onChange} className={`w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer ${isNormal ? 'accent-blue-500' : 'accent-rose-500'}`} />
      </div>
    );
  }

  function LogicRow({ name, active, condition, alwaysOn }) {
    return (
      <div className={`flex items-center justify-between p-2.5 rounded border transition-colors ${active ? 'bg-blue-500/10 border-blue-500/30' : 'bg-transparent border-transparent hover:bg-slate-800/50'}`}>
        <div>
          <span className={`text-xs font-bold ${active ? 'text-slate-200' : 'text-slate-500'}`}>{name}</span>
          <p className="text-[9px] text-slate-500 font-mono mt-0.5">{condition}</p>
        </div>
        <div>
          {active ? <span className="text-[9px] font-bold tracking-wider text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded border border-blue-400/20">{alwaysOn ? 'ALWAYS ON' : 'ACTIVE'}</span> : <span className="text-[9px] font-bold tracking-wider text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">BYPASS</span>}
        </div>
      </div>
    );
  }

  function MetricBox({ label, value, isWarning }) {
    return (
      <div className={`p-2 rounded border ${isWarning ? 'bg-rose-500/10 border-rose-500/30' : 'bg-slate-800/50 border-slate-700'}`}>
         <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">{label}</p>
         <p className={`font-mono font-bold text-lg ${isWarning ? 'text-rose-400' : 'text-slate-200'}`}>{value}</p>
      </div>
    )
  }

  function StatusRow({ name, state, color }) {
    return (
      <div className="flex justify-between items-center py-1.5 border-b border-slate-800 last:border-0">
        <span className="text-xs text-slate-300 font-medium">{name}</span>
        <span className={`text-[10px] font-bold uppercase tracking-wider ${color}`}>● {state}</span>
      </div>
    )
  }
  
  function NoveltyPoint({ num, title, text }) {
    return (
      <div className="bg-[#1e293b]/50 p-4 rounded-lg border border-slate-800">
         <div className="flex items-center gap-2 mb-2">
           <span className="bg-blue-500/20 text-blue-400 text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border border-blue-500/30">{num}</span>
           <h4 className="font-bold text-slate-200 tracking-wider text-sm">{title}</h4>
         </div>
         <p className="text-xs text-slate-400 leading-relaxed">{text}</p>
      </div>
    )
  }
}

export default App;
