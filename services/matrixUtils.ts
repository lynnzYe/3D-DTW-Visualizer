
import { Matrix3D, PathNode } from '../types';

/**
 * Generates a synthetic 3D cost matrix for demonstration.
 * High costs are randomly distributed, with a lower-cost "valley" 
 * along a semi-diagonal path to simulate DTW cost alignment.
 */
export const generateSampleMatrix = (nx: number, ny: number, nz: number): Matrix3D => {
  const matrix: Matrix3D = [];
  for (let x = 0; x < nx; x++) {
    matrix[x] = [];
    for (let y = 0; y < ny; y++) {
      matrix[x][y] = [];
      for (let z = 0; z < nz; z++) {
        // Create a basic distance metric from the "diagonal" (0,0,0) to (nx,ny,nz)
        // This makes the center of the diagonal path have lower costs
        const idealX = (x / (nx-1));
        const idealY = (y / (ny-1));
        const idealZ = (z / (nz-1));
        
        const dist = Math.sqrt(
          Math.pow(idealX - idealY, 2) + 
          Math.pow(idealY - idealZ, 2) + 
          Math.pow(idealX - idealZ, 2)
        );
        
        // Add some noise
        const noise = Math.random() * 0.3;
        matrix[x][y][z] = dist + noise;
      }
    }
  }
  return matrix;
};

/**
 * Finds a mock "optimal path" from (0,0,0) to the far corner.
 * In a real DTW scenario, this would be computed using the cumulative cost matrix.
 */
export const findOptimalPath = (matrix: Matrix3D): PathNode[] => {
  const nx = matrix.length;
  const ny = matrix[0]?.length || 0;
  const nz = matrix[0]?.[0]?.length || 0;
  
  if (nx === 0 || ny === 0 || nz === 0) return [];

  const path: PathNode[] = [];
  let curr = { x: 0, y: 0, z: 0 };
  
  path.push({ ...curr });

  // Simple greedy search towards the end corner (nx-1, ny-1, nz-1)
  while (curr.x < nx - 1 || curr.y < ny - 1 || curr.z < nz - 1) {
    const nextSteps = [
      { x: curr.x + 1, y: curr.y, z: curr.z },
      { x: curr.x, y: curr.y + 1, z: curr.z },
      { x: curr.x, y: curr.y, z: curr.z + 1 },
      { x: curr.x + 1, y: curr.y + 1, z: curr.z },
      { x: curr.x + 1, y: curr.y, z: curr.z + 1 },
      { x: curr.x, y: curr.y + 1, z: curr.z + 1 },
      { x: curr.x + 1, y: curr.y + 1, z: curr.z + 1 },
    ].filter(s => s.x < nx && s.y < ny && s.z < nz);

    if (nextSteps.length === 0) break;

    // Pick step with lowest cost
    let bestStep = nextSteps[0];
    let minCost = matrix[bestStep.x][bestStep.y][bestStep.z];

    for (const step of nextSteps) {
      const cost = matrix[step.x][step.y][step.z];
      if (cost < minCost) {
        minCost = cost;
        bestStep = step;
      }
    }

    curr = bestStep;
    path.push({ ...curr });
  }

  return path;
};
