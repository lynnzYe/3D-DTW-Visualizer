
import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { MatrixVisualizer } from './components/MatrixVisualizer';
import { VisualizationState, Matrix3D, PathNode, Labels } from './types';
import { generateSampleMatrix, findOptimalPath } from './services/matrixUtils';

const App: React.FC = () => {
  const [state, setState] = useState<VisualizationState>({
    matrix: [],
    path: [],
    threshold: 0.5,
    showGrid: true,
    showValues: false,
    opacity: 0.4,
    cellSize: 0.8,
    colorScheme: 'viridis'
  });

  const [labels, setLabels] = useState<Labels>({
    x: [],
    y: [],
    z: []
  });

  const [isLoading, setIsLoading] = useState(true);

  // Initialize with sample data
  useEffect(() => {
    const sampleSize = { x: 10, y: 10, z: 10 };
    const m = generateSampleMatrix(sampleSize.x, sampleSize.y, sampleSize.z);
    const p = findOptimalPath(m);
    
    setState(prev => ({ ...prev, matrix: m, path: p }));
    setLabels({
      x: Array.from({ length: sampleSize.x }, (_, i) => `X-${i}`),
      y: Array.from({ length: sampleSize.y }, (_, i) => `Y-${i}`),
      z: Array.from({ length: sampleSize.z }, (_, i) => `${(i * 0.1).toFixed(1)}`)
    });
    setIsLoading(false);
  }, []);

  const handleUpdateMatrix = (newMatrix: Matrix3D) => {
    const p = findOptimalPath(newMatrix);
    setState(prev => ({ ...prev, matrix: newMatrix, path: p }));
    
    // Auto-update labels if they don't match dimensions
    setLabels({
      x: Array.from({ length: newMatrix.length }, (_, i) => `${i}`),
      y: Array.from({ length: newMatrix[0]?.length || 0 }, (_, i) => `${i}`),
      z: Array.from({ length: newMatrix[0]?.[0]?.length || 0 }, (_, i) => `${i}`)
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
        <div className="text-xl animate-pulse font-light">Initializing 3D Environment...</div>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen flex overflow-hidden bg-slate-950">
      {/* Sidebar - Controls */}
      <Sidebar 
        state={state} 
        setState={setState} 
        onUpdateMatrix={handleUpdateMatrix}
      />

      {/* Main Visualizer Area */}
      <div className="flex-1 relative">
        <MatrixVisualizer 
          state={state} 
          labels={labels}
        />
        
        {/* Quick HUD */}
        <div className="absolute top-6 left-6 pointer-events-none space-y-2">
          <h1 className="text-2xl font-bold text-white/90 tracking-tight">3D DTW Matrix Visualizer</h1>
          <div className="flex gap-4">
            <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-1 rounded">
              {state.matrix.length} × {state.matrix[0]?.length} × {state.matrix[0]?.[0]?.length} Cells
            </span>
            <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-1 rounded">
              Path Length: {state.path.length}
            </span>
          </div>
        </div>

        {/* Controls Hint */}
        <div className="absolute bottom-6 left-6 text-white/40 text-xs font-medium space-y-1">
          <p>Rotate: Left Click + Drag</p>
          <p>Pan: Cmd + Left Click + Drag / Right Click + Drag / <kbd className="bg-slate-800 px-1 rounded text-white/80 font-mono">WASD</kbd></p>
          <p>Ascend / Descend: <kbd className="bg-slate-800 px-1 rounded text-white/80 font-mono">Space</kbd> / <kbd className="bg-slate-800 px-1 rounded text-white/80 font-mono">Shift</kbd></p>
          <p>Zoom: Scroll Wheel</p>
          <p>Center Camera: Press <kbd className="bg-slate-800 px-1 rounded text-white/80 font-mono">C</kbd></p>
        </div>
      </div>
    </div>
  );
};

export default App;
