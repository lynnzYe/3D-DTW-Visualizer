
export type Matrix3D = number[][][];

export interface PathNode {
  x: number;
  y: number;
  z: number;
}

export interface VisualizationState {
  matrix: Matrix3D;
  path: PathNode[];
  threshold: number;
  showGrid: boolean;
  showValues: boolean;
  opacity: number;
  cellSize: number;
  colorScheme: 'viridis' | 'inferno' | 'magma' | 'coolwarm';
}

export interface Labels {
  x: string[];
  y: string[];
  z: string[];
}
