import React, { useState, useEffect } from 'react';
import { Activity, Droplets, Settings, AlertTriangle, CheckCircle, Power, BarChart3, SlidersHorizontal, Info, Menu, Bell, Search, LayoutDashboard, Cpu, X, Play, Square } from 'lucide-react';
import WaterTreatmentSimulation from './components/WaterTreatmentSimulation';

const MODULE_SPECS = {
  sediment: { title: 'Sedimentation Tank', purpose: 'Removes large suspended solids, sand, and turbidity from raw water.', spec: 'Flow Rate: 50L/m | Media: Silica Sand / Gravel | Pressure drop: 0.2 bar' },
  carbon: { title: 'Activated Carbon Adsorption', purpose: 'Removes chlorine, organic compounds, and unwanted odor/taste.', spec: 'Media: Granular Activated Carbon (GAC) | Contact time: 10 mins' },
  membrane: { title: 'Reverse Osmosis (RO) Membrane', purpose: 'Forces water through a semi-permeable membrane to remove dissolved solids (TDS) and heavy metals.', spec: 'Type: Thin-film composite (TFC) | Rejection rate: 99.2% | Pressure: 15 bar' },
  phCorrection: { title: 'Chemical Dosing Unit', purpose: 'Neutralizes pH to acceptable drinking water levels (6.5 - 8.5) by injecting safe chemicals.', spec: 'Dosing Pump: Diaphragm | Reagent: NaOH / HCl based on required shift' },
  disinfection: { title: 'UV Disinfection', purpose: 'Inactivates bacteria, viruses, and pathogens using ultraviolet light.', spec: 'Wavelength: 254 nm | Dose: 40 mJ/cm² | Bulb Life: 9,000 hrs' },
  s1: { title: 'Influent Sensor Array', purpose: 'Monitors raw water quality in real-time to feed data to the Edge Decision Engine.', spec: 'Sensors: pH, TDS (Conductivity), Turbidity (NTU), Temperature' },
  s2: { title: 'Effluent Verification Sensor', purpose: 'Post-treatment verification. If water fails, triggers diversion valve.', spec: 'Sensors: pH, TDS, Flow Rate | Auto-divert response time: < 200ms' }
};

function App() {
  const [sensors, setSensors] = useState({
    pH: 7.2,
    tds: 350,
    turbidity: 8,
    temp: 24.5
  });

  const [activeModules, setActiveModules] = useState({
    sediment: false,
    carbon: false,
    membrane: false,
    phCorrection: false,
    disinfection: true
  });

  const [systemStatus, setSystemStatus] = useState('Idle');
  const [outputStatus, setOutputStatus] = useState('Acceptable');
  const [flowRate, setFlowRate] = useState(0);
  const [selectedModule, setSelectedModule] = useState(null);
  
  // New State for Simulation
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    let modules = {
      sediment: false,
      carbon: false,
      membrane: false,
      phCorrection: false,
      disinfection: true
    };

    let status = isSimulating ? 'Active' : 'Idle';

    if (sensors.turbidity > 10) modules.sediment = true;
    if (sensors.tds > 500) {
      modules.membrane = true;
      modules.carbon = true;
    }
    if (sensors.pH < 6.5 || sensors.pH > 8.5) modules.phCorrection = true;

    setActiveModules(modules);

    if (modules.membrane && sensors.tds > 2000) {
       setOutputStatus('Non-Compliant: Re-treat');
       if (isSimulating) status = 'Warning';
    } else if (modules.phCorrection && (sensors.pH < 5 || sensors.pH > 10)) {
       setOutputStatus('Critical: Divert');
       if (isSimulating) status = 'Critical';
    } else {
       setOutputStatus('Acceptable');
    }

    setSystemStatus(status);
    
    if (isSimulating) {
      setFlowRate(120);
      const interval = setInterval(() => {
          setFlowRate(prev => Math.max(0, 120 + (Math.random() * 4 - 2)));
      }, 2000);
      return () => clearInterval(interval);
    } else {
      setFlowRate(0);
    }
  }, [sensors, isSimulating]);

  const handleSensorChange = (e) => {
    const { name, value } = e.target;
    setSensors(prev => ({ ...prev, [name]: parseFloat(value) }));
  };

  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-300 flex font-sans selection:bg-blue-500/30 relative">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[#0f172a] border-r border-slate-800 flex flex-col hidden md:flex z-20 shadow-xl">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <Droplets className="text-blue-500 h-6 w-6 mr-3" />
          <span className="text-slate-100 font-bold tracking-wider text-sm">AQUA-TWIN PRO</span>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-1">
          <NavItem icon={<LayoutDashboard size={18} />} label="Dashboard" active />
          <NavItem icon={<Activity size={18} />} label="Live Analytics" />
          <NavItem icon={<Cpu size={18} />} label="ESP32 Edge Config" />
          <NavItem icon={<BarChart3 size={18} />} label="Compliance Reports" />
          <NavItem icon={<Settings size={18} />} label="System Settings" />
        </nav>
        
        <div className="p-4 border-t border-slate-800">
          <div className="bg-[#1e293b] rounded-lg p-4 border border-slate-700">
            <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider mb-2">System Uptime</p>
            <p className="text-lg text-slate-100 font-mono">99.98%</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        <header className="h-16 bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-slate-400 hover:text-white">
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-medium text-slate-100">Process Overview</h1>
          </div>
          
          <div className="flex items-center gap-5">
            <button 
               onClick={() => setIsSimulating(!isSimulating)}
               className={`flex items-center gap-2 px-4 py-2 rounded-md font-bold text-sm shadow-lg transition-all ${
                 isSimulating 
                   ? 'bg-rose-500/20 text-rose-400 border border-rose-500 hover:bg-rose-500/30' 
                   : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500 hover:bg-emerald-500/30'
               }`}
            >
               {isSimulating ? <><Square size={16} fill="currentColor"/> STOP PROCESS</> : <><Play size={16} fill="currentColor"/> START PROCESS</>}
            </button>
            
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 p-[2px] ml-4">
              <div className="h-full w-full rounded-full bg-[#0f172a] flex items-center justify-center text-xs font-bold text-white">OP</div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 relative">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard title="System Status" value={systemStatus} type={statusToColor(systemStatus)} icon={<Activity size={20} />} />
            <StatCard title="Current Flow Rate" value={`${flowRate.toFixed(1)} L/m`} subtitle={isSimulating ? "Nominal" : "Zero Flow"} icon={<Droplets size={20} />} />
            <StatCard title="Active Modules" value={Object.values(activeModules).filter(Boolean).length} subtitle="Out of 5 total" icon={<Cpu size={20} />} />
            <StatCard title="Final Output Quality" value={outputStatus} type={outputToColor(outputStatus)} icon={<CheckCircle size={20} />} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 relative">
            
            <div className="xl:col-span-1 space-y-6">
              
              <div className="bg-[#1e293b] rounded-xl border border-slate-700 overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-slate-700/50 flex items-center justify-between bg-[#0f172a]/50">
                  <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2 tracking-wide">
                    <SlidersHorizontal size={16} className="text-blue-400" />
                    INFLUENT PARAMETERS
                  </h2>
                </div>
                
                <div className="p-5 space-y-6">
                  <RangeSlider label="pH Level" name="pH" value={sensors.pH} min={0} max={14} step={0.1} unit="" normalRange={[6.5, 8.5]} color="text-emerald-400" />
                  <RangeSlider label="TDS" name="tds" value={sensors.tds} min={0} max={3000} step={10} unit="ppm" normalRange={[0, 500]} color="text-blue-400" />
                  <RangeSlider label="Turbidity" name="turbidity" value={sensors.turbidity} min={0} max={100} step={1} unit="NTU" normalRange={[0, 10]} color="text-amber-400" />
                  <RangeSlider label="Temperature" name="temp" value={sensors.temp} min={0} max={50} step={0.5} unit="°C" normalRange={[10, 35]} color="text-rose-400" />
                </div>
              </div>

              <div className="bg-[#1e293b] rounded-xl border border-slate-700 overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-slate-700/50 flex items-center justify-between bg-[#0f172a]/50">
                  <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2 tracking-wide">
                    <Cpu size={16} className="text-indigo-400" />
                    EDGE ROUTING DECISIONS
                  </h2>
                </div>
                <div className="p-5 space-y-1">
                  <LogicRow name="Coagulation & Sedimentation" active={activeModules.sediment} condition="Turbidity > 10 NTU" />
                  <LogicRow name="Activated Carbon Adsorption" active={activeModules.carbon} condition="TDS > 500 ppm" />
                  <LogicRow name="Membrane / Reverse Osmosis" active={activeModules.membrane} condition="TDS > 500 ppm" />
                  <LogicRow name="Chemical pH Correction" active={activeModules.phCorrection} condition="pH < 6.5 or pH > 8.5" />
                  <LogicRow name="UV Disinfection Stage" active={activeModules.disinfection} condition="Always Active" alwaysOn />
                </div>
              </div>

            </div>

            <div className="xl:col-span-2 flex flex-col h-[600px] xl:h-auto min-h-[600px] bg-[#0f172a] rounded-xl border border-slate-700 overflow-hidden relative shadow-inner">
              
              <div className="absolute top-4 left-4 z-10 flex gap-2">
                 <div className="bg-[#0b1120]/80 backdrop-blur-md px-3 py-1.5 rounded-md border border-slate-700/50 flex items-center gap-2 shadow-lg cursor-pointer">
                   <div className={`w-2 h-2 rounded-full ${isSimulating ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`}></div>
                   <span className="text-xs font-semibold text-slate-200 tracking-wider">LIVE DIGITAL TWIN (CLICK MODULES)</span>
                 </div>
              </div>

              {/* Module Details Pop-up Overlay */}
              {selectedModule && MODULE_SPECS[selectedModule] && (
                 <div className="absolute top-4 right-4 z-20 w-80 bg-[#1e293b]/95 backdrop-blur-lg border border-blue-500/50 rounded-xl shadow-2xl p-5 transform transition-all animate-in fade-in slide-in-from-right-8">
                    <div className="flex justify-between items-start mb-3">
                       <h3 className="font-bold text-slate-100">{MODULE_SPECS[selectedModule].title}</h3>
                       <button onClick={() => setSelectedModule(null)} className="text-slate-400 hover:text-white bg-slate-800 rounded p-1">
                          <X size={14} />
                       </button>
                    </div>
                    
                    <div className="space-y-4">
                       <div>
                          <p className="text-xs text-blue-400 font-semibold uppercase tracking-wider mb-1 flex items-center gap-1"><Info size={12}/> Purpose</p>
                          <p className="text-sm text-slate-300 leading-relaxed">{MODULE_SPECS[selectedModule].purpose}</p>
                       </div>
                       <div className="bg-[#0f172a] p-3 rounded-lg border border-slate-700/50">
                          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Technical Specs</p>
                          <p className="text-xs text-slate-300 font-mono leading-loose">{MODULE_SPECS[selectedModule].spec.split('|').map((s, i) => <span key={i} className="block border-b border-slate-800 last:border-0 pb-1 mb-1">{s.trim()}</span>)}</p>
                       </div>
                    </div>
                 </div>
              )}

              <div className="flex-1 w-full h-full cursor-move">
                <WaterTreatmentSimulation activeModules={activeModules} sensors={sensors} outputStatus={outputStatus} onSelectModule={setSelectedModule} isSimulating={isSimulating} />
              </div>
              
              <div className="absolute bottom-4 left-4 right-4 z-10 flex justify-between items-end pointer-events-none">
                 <div className="bg-[#0b1120]/80 backdrop-blur-md p-3 rounded-lg border border-slate-700/50 pointer-events-auto">
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Process Analytics</p>
                    <div className="flex gap-4">
                       <div>
                          <p className="text-xs text-slate-500">Est. Energy Usage</p>
                          <p className="text-sm font-mono text-slate-200">{isSimulating ? calculateEnergy(activeModules) : '0.00'} kWh</p>
                       </div>
                       <div>
                          <p className="text-xs text-slate-500">Water Recovery</p>
                          <p className="text-sm font-mono text-slate-200">{isSimulating ? (activeModules.membrane ? '65%' : '98%') : '--'}</p>
                       </div>
                    </div>
                 </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );

  function statusToColor(status) {
    if (status === 'Idle') return 'text-slate-400 bg-slate-400/10 border-slate-500/20';
    if (status === 'Active') return 'text-emerald-400 bg-emerald-400/10 border-emerald-500/20';
    if (status === 'Warning') return 'text-amber-400 bg-amber-400/10 border-amber-500/20';
    return 'text-rose-400 bg-rose-400/10 border-rose-500/20';
  }

  function outputToColor(out) {
    if (out.includes('Acceptable')) return 'text-emerald-400 bg-emerald-400/10 border-emerald-500/20';
    if (out.includes('Re-treat')) return 'text-amber-400 bg-amber-400/10 border-amber-500/20';
    return 'text-rose-400 bg-rose-400/10 border-rose-500/20';
  }

  function calculateEnergy(modules) {
    let base = 2.5; 
    if (modules.membrane) base += 8.0; 
    if (modules.disinfection) base += 1.2; 
    if (modules.sediment) base += 0.5;
    if (modules.phCorrection) base += 0.3; 
    return base.toFixed(2);
  }

  function NavItem({ icon, label, active }) {
    return (
      <a href="#" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
        active ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' : 'text-slate-400 hover:text-slate-200 hover:bg-[#1e293b]'
      }`}>
        {icon}
        {label}
      </a>
    );
  }

  function StatCard({ title, value, subtitle, type, icon }) {
    return (
      <div className="bg-[#1e293b] p-5 rounded-xl border border-slate-700 shadow-sm flex items-start justify-between">
        <div>
          <h3 className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">{title}</h3>
          <div className="flex items-baseline gap-2 mt-2">
            <span className={`text-xl font-bold ${type ? type.split(' ')[0] : 'text-slate-100'}`}>{value}</span>
          </div>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-2.5 rounded-lg ${type ? type.split(' ').slice(1).join(' ') : 'bg-slate-700/50 text-slate-400'}`}>
          {icon}
        </div>
      </div>
    );
  }

  function RangeSlider({ label, name, value, min, max, step, unit, normalRange, color }) {
    const isNormal = value >= normalRange[0] && value <= normalRange[1];
    
    return (
      <div className="group mb-4">
        <div className="flex justify-between items-end mb-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">{label}</label>
          <div className="flex items-center gap-2">
             {!isNormal && <AlertTriangle size={12} className="text-amber-500" />}
             <span className={`font-mono text-sm font-bold ${isNormal ? color : 'text-amber-500'}`}>
               {value.toFixed(step < 1 ? 1 : 0)} <span className="text-slate-500 text-xs ml-0.5">{unit}</span>
             </span>
          </div>
        </div>
        
        <input 
          type="range" name={name} min={min} max={max} step={step} value={value} 
          onChange={handleSensorChange} 
          className={`w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer ${isNormal ? 'accent-blue-500' : 'accent-amber-500'}`} 
        />
        
        <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
          <span>{min}</span>
          <span>Normal: {normalRange[0]}-{normalRange[1]}</span>
          <span>{max}</span>
        </div>
      </div>
    );
  }

  function LogicRow({ name, active, condition, alwaysOn }) {
    return (
      <div className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
        active ? 'bg-blue-500/10 border-blue-500/30' : 'bg-transparent border-transparent hover:bg-slate-800/50'
      }`}>
        <div>
          <span className={`text-sm font-medium ${active ? 'text-slate-200' : 'text-slate-500'}`}>{name}</span>
          <p className="text-[10px] text-slate-500 font-mono mt-0.5">{condition}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {active ? (
            <span className="flex items-center gap-1 text-[10px] font-bold tracking-wider text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded border border-blue-400/20">
              <Power size={10} /> {alwaysOn ? 'ALWAYS ON' : 'ACTIVE'}
            </span>
          ) : (
            <span className="text-[10px] font-bold tracking-wider text-slate-500 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              BYPASS
            </span>
          )}
        </div>
      </div>
    );
  }
}

export default App;
