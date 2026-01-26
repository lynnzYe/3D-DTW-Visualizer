
import React from 'react';
import { Settings, Upload, Trash2, Sliders, Box, Layers, Palette, Hash } from 'lucide-react';
import { VisualizationState, Matrix3D } from '../types';

interface SidebarProps {
  state: VisualizationState;
  setState: React.Dispatch<React.SetStateAction<VisualizationState>>;
  onUpdateMatrix: (m: Matrix3D) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ state, setState, onUpdateMatrix }) => {
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
          onUpdateMatrix(json as Matrix3D);
        }
      } catch (err) {
        alert("Invalid JSON format. Please provide a 3D array: number[][][]");
      }
    };
    reader.readAsText(file);
  };

  const updateThreshold = (val: number) => {
    setState(prev => ({ ...prev, threshold: val }));
  };

  return (
    <div className="w-80 h-full bg-slate-900 border-r border-white/10 p-6 flex flex-col gap-8 overflow-y-auto">
      {/* File Upload Section */}
      <section>
        <h3 className="text-white font-semibold flex items-center gap-2 mb-4 text-sm">
          <Upload className="w-4 h-4 text-indigo-400" /> DATA SOURCE
        </h3>
        <div className="space-y-3">
          <label className="block">
            <span className="sr-only">Choose matrix file</span>
            <input 
              type="file" 
              accept=".json" 
              onChange={handleFileUpload}
              className="block w-full text-sm text-slate-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-indigo-500/10 file:text-indigo-400
                hover:file:bg-indigo-500/20 cursor-pointer"
            />
          </label>
          <p className="text-[10px] text-slate-500 px-1">
            Expected: <code>number[x][y][z]</code> JSON array.
          </p>
        </div>
      </section>

      {/* Threshold Control */}
      <section>
        <h3 className="text-white font-semibold flex items-center gap-2 mb-4 text-sm uppercase tracking-wider">
          <Sliders className="w-4 h-4 text-indigo-400" /> Visualization
        </h3>
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Cost Threshold</span>
              <span>{(state.threshold * 100).toFixed(0)}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              value={state.threshold}
              onChange={(e) => updateThreshold(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Cell Opacity</span>
              <span>{(state.opacity * 100).toFixed(0)}%</span>
            </div>
            <input 
              type="range" 
              min="0.05" 
              max="1" 
              step="0.05" 
              value={state.opacity}
              onChange={(e) => setState(p => ({ ...p, opacity: parseFloat(e.target.value) }))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Cell Size</span>
              <span>{state.cellSize.toFixed(1)}</span>
            </div>
            <input 
              type="range" 
              min="0.1" 
              max="1" 
              step="0.05" 
              value={state.cellSize}
              onChange={(e) => setState(p => ({ ...p, cellSize: parseFloat(e.target.value) }))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>
        </div>
      </section>

      {/* Color Scheme */}
      <section>
        <h3 className="text-white font-semibold flex items-center gap-2 mb-4 text-sm uppercase tracking-wider">
          <Palette className="w-4 h-4 text-indigo-400" /> Color Map
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {(['viridis', 'inferno', 'magma', 'coolwarm'] as const).map(scheme => (
            <button
              key={scheme}
              onClick={() => setState(p => ({ ...p, colorScheme: scheme }))}
              className={`text-[10px] py-1.5 px-3 rounded border transition-all uppercase font-medium
                ${state.colorScheme === scheme 
                  ? 'bg-indigo-500/20 border-indigo-500/50 text-white' 
                  : 'bg-slate-800/50 border-white/5 text-slate-400 hover:border-white/20'}`}
            >
              {scheme}
            </button>
          ))}
        </div>
      </section>

      {/* Toggles */}
      <section>
        <h3 className="text-white font-semibold flex items-center gap-2 mb-4 text-sm uppercase tracking-wider">
          <Layers className="w-4 h-4 text-indigo-400" /> Display
        </h3>
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className={`w-10 h-5 rounded-full relative transition-colors ${state.showGrid ? 'bg-indigo-500' : 'bg-slate-700'}`}>
              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${state.showGrid ? 'left-6' : 'left-1'}`} />
            </div>
            <input 
              type="checkbox" 
              className="hidden" 
              checked={state.showGrid} 
              onChange={() => setState(p => ({ ...p, showGrid: !p.showGrid }))}
            />
            <span className="text-xs text-slate-300 group-hover:text-white">Show Background Grid</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer group">
            <div className={`w-10 h-5 rounded-full relative transition-colors ${state.showValues ? 'bg-emerald-500' : 'bg-slate-700'}`}>
              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${state.showValues ? 'left-6' : 'left-1'}`} />
            </div>
            <input 
              type="checkbox" 
              className="hidden" 
              checked={state.showValues} 
              onChange={() => setState(p => ({ ...p, showValues: !p.showValues }))}
            />
            <span className="text-xs text-slate-300 group-hover:text-white">Show Cell Values</span>
          </label>
          {state.showValues && state.matrix.length * (state.matrix[0]?.length || 0) * (state.matrix[0]?.[0]?.length || 0) > 2000 && (
            <p className="text-[10px] text-amber-400/80 px-1 animate-pulse">
              Performance Warning: High cell count. Values may be capped.
            </p>
          )}
        </div>
      </section>

      {/* Reset Action */}
      <div className="mt-auto">
        <button 
          onClick={() => window.location.reload()}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all text-sm font-semibold"
        >
          <Trash2 className="w-4 h-4" /> Reset Scene
        </button>
      </div>
    </div>
  );
};
