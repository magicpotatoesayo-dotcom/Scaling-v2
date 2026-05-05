import { useState, useEffect } from 'react';
import { Calculator, Table, Activity, Zap, ArrowRightLeft, ChevronDown, Clock, Trash2, History, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Unit conversion configuration
const UNIT_CATEGORIES: Record<string, { base: string, units: Record<string, any> }> = {
  'Pressure': {
    base: 'bar',
    units: {
      'bar': 1,
      'psi': 14.5038,
      'kPa': 100,
      'MPa': 0.1,
      'Pa': 100000,
      'mbar': 1000
    }
  },
  'Temperature': {
    base: '°C',
    units: {
      '°C': { toBase: (v: number) => v, fromBase: (v: number) => v },
      '°F': { toBase: (v: number) => (v - 32) * 5/9, fromBase: (v: number) => (v * 9/5) + 32 },
      'K': { toBase: (v: number) => v - 273.15, fromBase: (v: number) => v + 273.15 }
    }
  },
  'Flow': {
    base: 'm³/h',
    units: {
      'm³/h': 1,
      'L/s': 0.277778,
      'L/min': 16.6667,
      'US gal/m': 4.40287
    }
  },
  'Level': {
    base: 'm',
    units: {
      'm': 1,
      'cm': 100,
      'mm': 1000,
      'in': 39.3701,
      'ft': 3.28084
    }
  },
  'Signal': {
    base: '%',
    units: {
      '%': 1,
      'mA': { toBase: (v: number) => (v - 4) / 16 * 100, fromBase: (v: number) => (v / 100) * 16 + 4 },
      'V': { toBase: (v: number) => v * 10, fromBase: (v: number) => v / 10 }
    }
  }
};

const convertValue = (val: number, fromUnit: string, toUnit: string): number => {
  if (fromUnit === toUnit) return val;

  let category: string | null = null;
  for (const cat in UNIT_CATEGORIES) {
    if (UNIT_CATEGORIES[cat].units[fromUnit] && UNIT_CATEGORIES[cat].units[toUnit]) {
      category = cat;
      break;
    }
  }

  if (!category) return val;

  const catData = UNIT_CATEGORIES[category];
  const fromData = catData.units[fromUnit];
  const toData = catData.units[toUnit];

  // Convert to base
  let baseVal: number;
  if (typeof fromData === 'number') {
    baseVal = val / fromData;
  } else {
    baseVal = fromData.toBase(val);
  }

  // Convert from base
  if (typeof toData === 'number') {
    return baseVal * toData;
  } else {
    return toData.fromBase(baseVal);
  }
};

interface HistoryEntry {
  id: string;
  timestamp: number;
  input: {
    val: string;
    unit: string;
    lrv: string;
    urv: string;
  };
  output: {
    val: string;
    unit: string;
    lrv: string;
    urv: string;
    pct: string;
  };
}

const ALL_PRESETS = {
  'sigs': {
    label: 'Standard Signals',
    items: {
      '4-20': { lrv: '4', urv: '20', unit: 'mA', label: '4 – 20 mA' },
      '0-20': { lrv: '0', urv: '20', unit: 'mA', label: '0 – 20 mA' },
      '0-10': { lrv: '0', urv: '10', unit: 'V', label: '0 – 10 V' },
      '0-100': { lrv: '0', urv: '100', unit: '%', label: '0 – 100 %' },
    }
  },
  'phys': {
    label: 'Physical Scales',
    items: {
      'pression': { lrv: '0', urv: '10', unit: 'bar', label: 'Pressure (bar)' },
      'temperature': { lrv: '0', urv: '300', unit: '°C', label: 'Temperature (°C)' },
      'debit': { lrv: '0', urv: '500', unit: 'm³/h', label: 'Flow (m³/h)' },
      'niveau': { lrv: '0', urv: '5', unit: 'm', label: 'Level (m)' },
    }
  }
};

export default function App() {
  const [lrv1, setLrv1] = useState<string>('0');
  const [urv1, setUrv1] = useState<string>('10');
  const [unit1, setUnit1] = useState<string>('bar');
  const [val1, setVal1] = useState<string>('5');

  const [lrv2, setLrv2] = useState<string>('4');
  const [urv2, setUrv2] = useState<string>('20');
  const [unit2, setUnit2] = useState<string>('mA');

  const [lrv3, setLrv3] = useState<string>('0');
  const [urv3, setUrv3] = useState<string>('100');
  const [unit3, setUnit3] = useState<string>('%');

  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('scaler_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('scaler_history', JSON.stringify(history));
  }, [history]);

  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  const handleApplyPreset = (side: 1 | 2 | 3, presetKey: string) => {
    triggerHaptic();
    if (presetKey === 'custom') return;
    
    let found;
    for (const group of Object.values(ALL_PRESETS)) {
      if (group.items[presetKey as keyof typeof group.items]) {
        found = group.items[presetKey as keyof typeof group.items];
        break;
      }
    }

    if (found) {
      if (side === 1) {
        setLrv1(found.lrv);
        setUrv1(found.urv);
        setUnit1(found.unit);
        setVal1(((parseFloat(found.lrv) + parseFloat(found.urv)) / 2).toString());
      } else if (side === 2) {
        setLrv2(found.lrv);
        setUrv2(found.urv);
        setUnit2(found.unit);
      } else {
        setLrv3(found.lrv);
        setUrv3(found.urv);
        setUnit3(found.unit);
      }
    }
  };

  const handleUnitChange = (side: 1 | 2 | 3, newUnit: string) => {
    const oldUnit = side === 1 ? unit1 : side === 2 ? unit2 : unit3;
    if (oldUnit === newUnit) return;

    // Check if we can convert
    let sameCategory = false;
    for (const cat in UNIT_CATEGORIES) {
      if (UNIT_CATEGORIES[cat].units[oldUnit] && UNIT_CATEGORIES[cat].units[newUnit]) {
        sameCategory = true;
        break;
      }
    }

    if (side === 1) {
      if (sameCategory) {
        setLrv1(convertValue(parseFloat(lrv1), oldUnit, newUnit).toFixed(4));
        setUrv1(convertValue(parseFloat(urv1), oldUnit, newUnit).toFixed(4));
        setVal1(convertValue(parseFloat(val1), oldUnit, newUnit).toFixed(4));
      }
      setUnit1(newUnit);
    } else if (side === 2) {
      if (sameCategory) {
        setLrv2(convertValue(parseFloat(lrv2), oldUnit, newUnit).toFixed(4));
        setUrv2(convertValue(parseFloat(urv2), oldUnit, newUnit).toFixed(4));
      }
      setUnit2(newUnit);
    } else if (side === 3) {
      if (sameCategory) {
        setLrv3(convertValue(parseFloat(lrv3), oldUnit, newUnit).toFixed(4));
        setUrv3(convertValue(parseFloat(urv3), oldUnit, newUnit).toFixed(4));
      }
      setUnit3(newUnit);
    }
  };

  const handleSwap = () => {
    triggerHaptic();
    const s_lrv1 = lrv1;
    const s_urv1 = urv1;
    const s_unit1 = unit1;
    const s_val1 = val1;
    
    // We compute the current result to use as the new input
    const numLrv1 = parseFloat(lrv1);
    const numUrv1 = parseFloat(urv1);
    const numVal1 = parseFloat(val1);
    const numLrv2 = parseFloat(lrv2);
    const numUrv2 = parseFloat(urv2);
    
    const span1 = numUrv1 - numLrv1;
    let nextVal1 = s_val1;
    
    if (span1 !== 0 && !isNaN(numVal1)) {
      const p = (numVal1 - numLrv1) / span1;
      const result = numLrv2 + (p * (numUrv2 - numLrv2));
      nextVal1 = result.toFixed(4);
    }

    setLrv1(lrv2);
    setUrv1(urv2);
    setUnit1(unit2);
    setVal1(nextVal1);

    setLrv2(s_lrv1);
    setUrv2(s_urv1);
    setUnit2(s_unit1);
  };

  const handleCommit = () => {
    triggerHaptic();
    const entry: HistoryEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      input: { val: val1, unit: unit1, lrv: lrv1, urv: urv1 },
      output: { val: xrvStr, unit: unit2, lrv: lrv2, urv: urv2, pct: percentageStr }
    };
    setHistory([entry, ...history.slice(0, 19)]); // Keep last 20
  };

  const clearHistory = () => setHistory([]);

  const numLrv1 = parseFloat(lrv1);
  const numUrv1 = parseFloat(urv1);
  const numVal1 = parseFloat(val1);

  const numLrv2 = parseFloat(lrv2);
  const numUrv2 = parseFloat(urv2);

  const numLrv3 = parseFloat(lrv3);
  const numUrv3 = parseFloat(urv3);

  let percentageNum: number | null = null;
  let xrvStr: string = '---';
  let zrvStr: string = '---';
  let percentageStr: string = '---';

  const span1 = numUrv1 - numLrv1;
  const span2 = numUrv2 - numLrv2;
  const span3 = numUrv3 - numLrv3;

  const isInvalid1 = span1 === 0 && !isNaN(numLrv1) && !isNaN(numUrv1);
  const isInvalid2 = span2 === 0 && !isNaN(numLrv2) && !isNaN(numUrv2);
  const isInvalid3 = span3 === 0 && !isNaN(numLrv3) && !isNaN(numUrv3);
  const hasErrors = isInvalid1 || isInvalid2 || isInvalid3;

  if (span1 !== 0 && !isNaN(numVal1)) {
    percentageNum = (numVal1 - numLrv1) / span1;
    percentageStr = (percentageNum * 100).toFixed(2);
    
    const resultY = numLrv2 + (percentageNum * span2);
    xrvStr = Number(resultY.toFixed(4)).toString();

    const resultZ = numLrv3 + (percentageNum * span3);
    zrvStr = Number(resultZ.toFixed(4)).toString();
  }

  const tablePoints = [0, 25, 50, 75, 100].map(pct => {
    const p = pct / 100;
    const v1 = numLrv1 + (p * span1);
    const v2 = numLrv2 + (p * span2);
    const v3 = numLrv3 + (p * span3);
    return {
      pct,
      v1: isNaN(v1) ? '?' : Number(v1.toFixed(3)),
      v2: isNaN(v2) ? '?' : Number(v2.toFixed(4)),
      v3: isNaN(v3) ? '?' : Number(v3.toFixed(4))
    };
  });

  return (
    <div className="min-h-[100dvh] bg-[#050505] text-[#e0e0e0] font-sans flex items-center justify-center relative overflow-hidden sm:p-4 md:p-8">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-900/10 rounded-full blur-[120px] pointer-events-none hidden sm:block"></div>
      
      <div className="w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-7xl bg-[#0a0a0a] sm:rounded-2xl shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden border-[#222] sm:border z-10 flex flex-col relative">
        <div className="flex flex-col lg:flex-row overflow-y-auto pt-safe pb-safe">
          
          <div className="flex-1 p-6 sm:p-8 md:p-10 flex flex-col space-y-6 sm:space-y-8 bg-[#0a0a0a]">
            <header className="border-b border-[#222] pb-4 sm:pb-6 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Calculator size={24} className="text-cyan-500" />
                  <h1 className="text-xl font-light tracking-tight flex items-baseline select-none">
                    Instrumentation <span className="text-cyan-500 font-bold uppercase tracking-widest text-sm ml-2">Scaler</span>
                  </h1>
                </div>
                <p className="text-[9px] text-gray-500 font-mono tracking-widest uppercase flex items-center gap-2">
                  <Activity size={10} className="animate-pulse" /> Mobile Engine v6.2
                </p>
              </div>
              <div className="hidden sm:block text-[9px] text-gray-700 font-mono text-right">
                BATT: 100%<br/>LINK: ENCRYPTED
              </div>
            </header>

            <AnimatePresence>
              {hasErrors && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-red-950/20 border border-red-900/50 p-3 rounded-lg overflow-hidden"
                >
                  <div className="flex items-center gap-3 text-red-500 text-[10px] uppercase tracking-widest font-bold">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span>Configuration Critical: Range span cannot be zero</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#111] p-4 rounded-lg border border-[#222]">
                <label className="block text-[10px] text-gray-500 mb-2 uppercase tracking-widest text-center">Engine Swapper</label>
                <button 
                  onClick={handleSwap}
                  className="w-full h-10 flex items-center justify-center gap-2 bg-cyan-600/10 border border-cyan-600/30 rounded text-cyan-400 hover:bg-cyan-600/20 transition-colors uppercase text-[10px] font-bold tracking-widest"
                >
                  <ArrowRightLeft size={14} /> X ⟷ Y Pivot
                </button>
              </div>
              <div className="bg-[#111] p-4 rounded-lg border border-[#222] flex items-center justify-center transition-all hover:bg-cyan-900/5 cursor-help group">
                 <div className="text-[9px] text-gray-600 text-center uppercase tracking-tighter leading-tight group-hover:text-cyan-600/80">
                   Symmetric Range Transformation <br/> Multi-Target Domains
                 </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {/* Source Range (X) */}
              <div className="bg-[#0c0c0c] p-6 rounded-xl border border-[#222] space-y-4 shadow-inner">
                <div className="flex justify-between items-center border-b border-[#222] pb-2">
                  <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Source Scale (X)</h3>
                  <select 
                    onChange={(e) => handleApplyPreset(1, e.target.value)}
                    className="bg-transparent text-[9px] font-mono text-cyan-500/70 border border-cyan-500/20 rounded px-1 outline-none cursor-pointer uppercase"
                    value="custom"
                  >
                    <option value="custom">Presets</option>
                    {Object.entries(ALL_PRESETS).map(([groupKey, group]) => (
                      <optgroup key={groupKey} label={group.label} className="bg-[#0a0a0a] text-gray-400">
                        {Object.entries(group.items).map(([itemKey, item]) => (
                          <option key={itemKey} value={itemKey}>{item.label}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[10px] text-gray-600">LRV</label>
                      {isInvalid1 && <span className="text-[8px] text-red-500 font-bold uppercase">Zero Span</span>}
                    </div>
                    <input 
                      type="number" 
                      value={lrv1} 
                      onChange={(e) => setLrv1(e.target.value)} 
                      className={`bg-[#111] p-2 rounded border ${isInvalid1 ? 'border-red-900/80 text-red-400' : 'border-[#222] text-cyan-400'} w-full font-mono text-sm outline-none focus:border-cyan-500/50 transition-colors`} 
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[10px] text-gray-600">URV</label>
                      {isInvalid1 && <AlertTriangle size={10} className="text-red-500" />}
                    </div>
                    <input 
                      type="number" 
                      value={urv1} 
                      onChange={(e) => setUrv1(e.target.value)} 
                      className={`bg-[#111] p-2 rounded border ${isInvalid1 ? 'border-red-900/80 text-red-400' : 'border-[#222] text-cyan-400'} w-full font-mono text-sm outline-none focus:border-cyan-500/50 transition-colors`} 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-600 mb-1">Unit</label>
                    <div className="relative group">
                      <select 
                        value={unit1} 
                        onChange={(e) => handleUnitChange(1, e.target.value)}
                        className="w-full bg-[#111] p-2 pr-8 rounded border border-[#222] font-mono text-xs text-gray-300 outline-none appearance-none cursor-pointer focus:border-cyan-500/30"
                      >
                        {Object.entries(UNIT_CATEGORIES).map(([cat, info]) => (
                          <optgroup key={cat} label={cat} className="bg-[#0a0a0a]">
                            {Object.keys(info.units).map(u => <option key={u} value={u}>{u}</option>)}
                          </optgroup>
                        ))}
                      </select>
                      <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none group-focus-within:text-cyan-500" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Targets (Y & Z) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#0c0c0c] p-6 rounded-xl border border-[#222] space-y-4 shadow-inner">
                  <div className="flex justify-between items-center border-b border-[#1a1a1a] pb-2">
                    <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Target Scale 1 (Y)</h3>
                    <select 
                      onChange={(e) => handleApplyPreset(2, e.target.value)}
                      className="bg-transparent text-[9px] font-mono text-cyan-500/70 border border-cyan-500/20 rounded px-1 outline-none cursor-pointer uppercase"
                      value="custom"
                    >
                      <option value="custom">Presets</option>
                      {Object.entries(ALL_PRESETS).map(([groupKey, group]) => (
                        <optgroup key={groupKey} label={group.label} className="bg-[#0a0a0a] text-gray-400">
                          {Object.entries(group.items).map(([itemKey, item]) => (
                            <option key={itemKey} value={itemKey}>{item.label}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[10px] text-gray-600">LRV</label>
                        {isInvalid2 && <span className="text-[8px] text-red-500 uppercase">Invalid</span>}
                      </div>
                      <input 
                        type="number" 
                        value={lrv2} 
                        onChange={(e) => setLrv2(e.target.value)} 
                        className={`bg-[#111] p-2 rounded border ${isInvalid2 ? 'border-red-900/80' : 'border-[#222]'} w-full font-mono text-sm text-cyan-400 outline-none`} 
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[10px] text-gray-600">URV</label>
                        {isInvalid2 && <AlertTriangle size={10} className="text-red-500" />}
                      </div>
                      <input 
                        type="number" 
                        value={urv2} 
                        onChange={(e) => setUrv2(e.target.value)} 
                        className={`bg-[#111] p-2 rounded border ${isInvalid2 ? 'border-red-900/80' : 'border-[#222]'} w-full font-mono text-sm text-cyan-400 outline-none`} 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-600 mb-1">Unit</label>
                    <div className="relative group">
                      <select value={unit2} onChange={(e) => handleUnitChange(2, e.target.value)} className="w-full bg-[#111] p-2 pr-8 rounded border border-[#222] font-mono text-xs text-gray-300 outline-none appearance-none cursor-pointer">
                        {Object.entries(UNIT_CATEGORIES).map(([cat, info]) => (
                          <optgroup key={cat} label={cat} className="bg-[#0a0a0a]">
                            {Object.keys(info.units).map(u => <option key={u} value={u}>{u}</option>)}
                          </optgroup>
                        ))}
                      </select>
                      <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none group-focus-within:text-cyan-500" />
                    </div>
                  </div>
                </div>

                <div className="bg-[#0c0c0c] p-6 rounded-xl border border-[#222] space-y-4 shadow-inner">
                  <div className="flex justify-between items-center border-b border-[#1a1a1a] pb-2">
                    <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Target Scale 2 (Z)</h3>
                    <select 
                      onChange={(e) => handleApplyPreset(3, e.target.value)}
                      className="bg-transparent text-[9px] font-mono text-cyan-500/70 border border-cyan-500/20 rounded px-1 outline-none cursor-pointer uppercase"
                      value="custom"
                    >
                      <option value="custom">Presets</option>
                      {Object.entries(ALL_PRESETS).map(([groupKey, group]) => (
                        <optgroup key={groupKey} label={group.label} className="bg-[#0a0a0a] text-gray-400">
                          {Object.entries(group.items).map(([itemKey, item]) => (
                            <option key={itemKey} value={itemKey}>{item.label}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[10px] text-gray-600">LRV</label>
                        {isInvalid3 && <span className="text-[8px] text-red-500 uppercase">Invalid</span>}
                      </div>
                      <input 
                        type="number" 
                        value={lrv3} 
                        onChange={(e) => setLrv3(e.target.value)} 
                        className={`bg-[#111] p-2 rounded border ${isInvalid3 ? 'border-red-900/80' : 'border-[#222]'} w-full font-mono text-sm text-cyan-400 outline-none`} 
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[10px] text-gray-600">URV</label>
                        {isInvalid3 && <AlertTriangle size={10} className="text-red-500" />}
                      </div>
                      <input 
                        type="number" 
                        value={urv3} 
                        onChange={(e) => setUrv3(e.target.value)} 
                        className={`bg-[#111] p-2 rounded border ${isInvalid3 ? 'border-red-900/80' : 'border-[#222]'} w-full font-mono text-sm text-cyan-400 outline-none`} 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-600 mb-1">Unit</label>
                    <div className="relative group">
                      <select value={unit3} onChange={(e) => handleUnitChange(3, e.target.value)} className="w-full bg-[#111] p-2 pr-8 rounded border border-[#222] font-mono text-xs text-gray-300 outline-none appearance-none cursor-pointer">
                        {Object.entries(UNIT_CATEGORIES).map(([cat, info]) => (
                          <optgroup key={cat} label={cat} className="bg-[#0a0a0a]">
                            {Object.keys(info.units).map(u => <option key={u} value={u}>{u}</option>)}
                          </optgroup>
                        ))}
                      </select>
                      <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none group-focus-within:text-cyan-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#111] p-5 rounded-2xl border border-cyan-900/20 shadow-[0_0_30px_-10px_rgba(6,182,212,0.1)] relative group">
              <div className="flex justify-between items-center mb-4">
                <label className="text-[10px] text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Zap size={12} className="text-cyan-500" /> Primary Signal (xRV)
                </label>
                <div className="text-xs font-mono text-cyan-500">{unit1}</div>
              </div>
              <input 
                type="number" 
                value={val1} 
                inputMode="decimal"
                onChange={(e) => {
                  setVal1(e.target.value);
                  if (parseFloat(e.target.value) % 1 === 0) triggerHaptic();
                }} 
                className="bg-transparent text-3xl sm:text-4xl font-mono text-cyan-400 w-full outline-none mb-4 selection:bg-cyan-900/50"
              />
              <input 
                type="range" 
                min={Math.min(Number(lrv1) || 0, Number(urv1) || 100)} 
                max={Math.max(Number(lrv1) || 0, Number(urv1) || 100)} 
                step="0.001" 
                value={Number(val1) || 0} 
                onChange={(e) => {
                  setVal1(e.target.value);
                  // Subtle haptic for range
                }}
                onInput={() => {
                   // Throttle haptics for slider might be too much, but let's try
                }}
                className="w-full h-8 accent-cyan-500 cursor-pointer opacity-70 group-hover:opacity-100 transition-opacity"
              />
            </div>
            
            <div className="p-4 bg-[#0a0a0a] rounded-xl border border-[#222] mt-auto">
               <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-3 border-b border-[#1a1a1a]">Logic Invariant</div>
               <div className="font-mono text-[10px] text-gray-500 italic leading-relaxed">
                 <p>(x - L₁) / (U₁ - L₁) = (y - L₂) / (U₂ - L₂) = (z - L₃) / (U₃ - L₃)</p>
               </div>
            </div>
          </div>

          <div className="flex-1 p-6 sm:p-8 md:p-10 border-t lg:border-t-0 lg:border-l border-[#222] bg-[#080808] flex flex-col space-y-8 overflow-y-auto">
            
            <div className="p-6 sm:p-8 bg-[#0a0a0a] rounded-3xl border border-[#222] shadow-inner relative flex flex-col items-center">
              <div className="text-[10px] text-gray-500 uppercase tracking-[0.3em] mb-8 w-full text-center border-b border-[#1a1a1a] pb-4">Scaling System Core</div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12 w-full">
                <div className="flex flex-col items-center space-y-3">
                  <div className="text-[8px] text-gray-600 uppercase tracking-widest">Target (y)</div>
                   <AnimatePresence mode="wait">
                    <motion.div key={xrvStr} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-4xl sm:text-5xl font-light font-mono text-white">{xrvStr}</motion.div>
                  </AnimatePresence>
                  <div className="text-cyan-900 font-mono text-[9px] uppercase tracking-[0.4em]">{unit2}</div>
                </div>
                
                <div className="flex flex-col items-center space-y-3">
                  <div className="text-[8px] text-gray-600 uppercase tracking-widest">Target (z)</div>
                   <AnimatePresence mode="wait">
                    <motion.div key={zrvStr} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-4xl sm:text-5xl font-light font-mono text-cyan-400">{zrvStr}</motion.div>
                  </AnimatePresence>
                  <div className="text-cyan-900 font-mono text-[9px] uppercase tracking-[0.4em]">{unit3}</div>
                </div>
              </div>

              <div className="w-full mt-12 px-2">
                <div className="flex justify-between text-[8px] font-mono text-gray-600 mb-2 uppercase tracking-widest">
                  <span>Linear Span</span>
                  <span className="text-cyan-500">{percentageStr === '---' ? '0' : percentageStr}%</span>
                </div>
                <div className="h-3 bg-[#111] p-0.5 rounded-full border border-[#222] relative overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, Math.max(0, percentageNum ? percentageNum * 100 : 0))}%` }}
                    className="h-full bg-cyan-600 flex items-center justify-end px-2" 
                  >
                    <div className="w-1 h-1 bg-white rounded-full opacity-50"></div>
                  </motion.div>
                </div>
              </div>

              <button 
                onClick={handleCommit}
                disabled={xrvStr === '---' || hasErrors}
                className="mt-10 group flex items-center justify-center gap-3 bg-cyan-600 hover:bg-cyan-500 active:scale-95 disabled:bg-gray-800 disabled:text-gray-600 text-black font-bold py-4 px-10 rounded-2xl w-full sm:w-auto text-[10px] uppercase tracking-widest transition-all shadow-[0_0_20px_-5px_rgba(6,182,212,0.3)] hover:shadow-cyan-500/40"
              >
                <Zap size={14} /> Commit Entry
              </button>
            </div>

            <div className="bg-[#0a0a0a] border border-[#222] rounded-xl overflow-hidden">
               <div className="p-3 bg-[#0d0d0d] border-b border-[#222] flex items-center justify-between">
                  <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <Table size={12} className="text-cyan-500" /> Multi-Domain Calibration
                  </h4>
                  <div className="text-[9px] text-gray-700 font-mono font-bold tracking-widest uppercase">5-Point Snapshot</div>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left font-mono text-[9px] border-collapse">
                   <thead>
                     <tr className="bg-[#111] text-gray-600">
                       <th className="p-3 border-r border-[#222]">SPAN%</th>
                       <th className="p-3 border-r border-[#222] uppercase">{unit1} (X)</th>
                       <th className="p-3 border-r border-[#222] uppercase">{unit2} (Y)</th>
                       <th className="p-3 uppercase">{unit3} (Z)</th>
                     </tr>
                   </thead>
                   <tbody>
                     {tablePoints.map((row) => (
                       <tr key={row.pct} className="border-t border-[#111] hover:bg-cyan-500/[0.03]">
                         <td className="p-3 border-r border-[#111] text-gray-500">{row.pct}%</td>
                         <td className="p-3 border-r border-[#111] text-gray-300">{row.v1}</td>
                         <td className="p-3 border-r border-[#111] text-cyan-500/80">{row.v2}</td>
                         <td className="p-3 text-cyan-400">{row.v3}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>

            <div className="flex-1 flex flex-col bg-[#0a0a0a] border border-[#222] rounded-xl overflow-hidden min-h-[350px]">
              <div className="p-3 bg-[#0d0d0d] border-b border-[#222] flex items-center justify-between">
                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  <History size={12} className="text-cyan-500" /> System Registry Log
                </h4>
                <button onClick={clearHistory} className="text-[9px] text-gray-600 hover:text-red-500/80 transition-colors uppercase tracking-widest flex items-center gap-1">
                  <Trash2 size={10} /> Purge Registry
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono">
                <AnimatePresence initial={false}>
                  {history.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-center text-gray-700 text-[10px] uppercase tracking-[0.2em] italic py-10">Empty Stack</div>
                  ) : (
                    history.map((entry) => (
                      <motion.div key={entry.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="bg-[#0e0e0e] border border-[#1a1a1a] p-3 rounded-lg text-[10px] leading-tight space-y-2 hover:border-cyan-900/40 transition-colors">
                        <div className="flex justify-between items-center text-gray-600 text-[8px]">
                          <span className="flex items-center gap-1"><Clock size={8} /> {new Date(entry.timestamp).toLocaleTimeString()}</span>
                          <span className="text-cyan-900/50">{entry.id.split('-')[0]}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <span className="text-gray-500 uppercase">Primary Input</span>
                            <div className="text-gray-400 font-bold">{entry.input.val} {entry.input.unit}</div>
                          </div>
                          <div className="text-right space-y-1">
                            <span className="text-gray-500 uppercase">Scalar Result</span>
                            <div className="text-cyan-500 font-bold">{entry.output.val} {entry.output.unit} <span className="text-gray-600 font-normal">@{entry.output.pct}%</span></div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>

            <footer className="text-[9px] text-gray-700 font-mono uppercase tracking-widest mt-auto border-t border-[#1a1a1a] pt-4 flex flex-col gap-1 px-1">
                <div className="flex justify-between">
                  <span>ALGORITHM: LINEAR_INTERPOLATION</span>
                  <span>MODE: REAL_TIME</span>
                </div>
                <div className="flex justify-between opacity-50">
                  <span>CRC_PASS: {Date.now().toString(16).toUpperCase()}</span>
                  <span>UNITS_SYNC: ENABLED</span>
                </div>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
