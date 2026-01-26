
import React, { useRef, useMemo, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Grid, Text, Line, Center, Arrows } from '@react-three/drei';
import * as THREE from 'three';
import { VisualizationState, Labels } from '../types';

interface MatrixVisualizerProps {
  state: VisualizationState;
  labels: Labels;
}

const ColorMap = {
  viridis: (val: number) => new THREE.Color().setHSL((1 - val) * 0.7, 0.8, 0.5),
  inferno: (val: number) => new THREE.Color().setHSL((1 - val) * 0.1, 1, 0.5),
  magma: (val: number) => new THREE.Color().setHSL((1 - val) * 0.2, 0.8, 0.5),
  coolwarm: (val: number) => new THREE.Color().lerpColors(new THREE.Color('blue'), new THREE.Color('red'), val),
};

const VoxelGrid: React.FC<{ state: VisualizationState }> = ({ state }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { matrix, threshold, opacity, cellSize, colorScheme } = state;

  const activeVoxels = useMemo(() => {
    const list: { pos: [number, number, number]; color: THREE.Color; cost: number }[] = [];
    const nx = matrix.length;
    const ny = matrix[0]?.length || 0;
    const nz = matrix[0]?.[0]?.length || 0;

    let minCost = Infinity, maxCost = -Infinity;
    matrix.forEach(row => row.forEach(col => col.forEach(cost => {
      if (cost < minCost) minCost = cost;
      if (cost > maxCost) maxCost = cost;
    })));

    for (let x = 0; x < nx; x++) {
      for (let y = 0; y < ny; y++) {
        for (let z = 0; z < nz; z++) {
          const cost = matrix[x][y][z];
          const normCost = (cost - minCost) / (maxCost - minCost || 1);
          
          if (normCost <= threshold) {
            list.push({
              pos: [x, -y, -z],
              color: ColorMap[colorScheme](normCost),
              cost: cost
            });
          }
        }
      }
    }
    return list;
  }, [matrix, threshold, colorScheme]);

  useEffect(() => {
    if (!meshRef.current) return;
    const dummy = new THREE.Object3D();
    activeVoxels.forEach((v, i) => {
      dummy.position.set(...v.pos);
      dummy.scale.set(cellSize, cellSize, cellSize);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
      meshRef.current!.setColorAt(i, v.color);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  }, [activeVoxels, cellSize]);

  return (
    <group>
      <instancedMesh ref={meshRef} args={[undefined, undefined, activeVoxels.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial transparent opacity={opacity} />
      </instancedMesh>
      
      {state.showValues && activeVoxels.length < 2000 && (
        <group>
          {activeVoxels.map((v, i) => (
            <Text
              key={`val-${i}`}
              position={[v.pos[0], v.pos[1], v.pos[2] + cellSize * 0.51]}
              fontSize={0.2 * cellSize}
              color="white"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.02}
              outlineColor="black"
            >
              {v.cost.toFixed(2)}
            </Text>
          ))}
        </group>
      )}
    </group>
  );
};

const PathOverlay: React.FC<{ state: VisualizationState }> = ({ state }) => {
  const { path } = state;
  if (path.length < 2) return null;

  const points = useMemo(() => 
    path.map(p => new THREE.Vector3(p.x, -p.y, -p.z))
  , [path]);

  return (
    <group>
      <Line
        points={points}
        color="#fbbf24"
        lineWidth={3}
      />
      {points.map((p, i) => {
        if (i === points.length - 1) return null;
        const next = points[i + 1];
        const dir = new THREE.Vector3().subVectors(next, p);
        const len = dir.length();
        dir.normalize();
        return (
          <arrowHelper
            key={i}
            args={[dir, p, len * 0.8, 0xffffff, 0.2, 0.1]}
          />
        );
      })}
    </group>
  );
};

const AxisLabels: React.FC<{ labels: Labels; dimensions: { nx: number; ny: number; nz: number } }> = ({ labels, dimensions }) => {
  const { nx, ny, nz } = dimensions;
  
  return (
    <group>
      {labels.x.map((l, i) => (
        <Text
          key={`x-${i}`}
          position={[i, 0.5, 0.5]}
          fontSize={0.3}
          color="white"
          rotation={[-Math.PI / 2, 0, 0]}
        >
          {l}
        </Text>
      ))}
      {labels.y.map((l, i) => (
        <Text
          key={`y-${i}`}
          position={[-1, -i, 0.5]}
          fontSize={0.3}
          color="#94a3b8"
        >
          {l}
        </Text>
      ))}
      {labels.z.map((l, i) => (
        <Text
          key={`z-${i}`}
          position={[-1, 0.5, -i]}
          fontSize={0.3}
          color="#60a5fa"
          rotation={[0, Math.PI / 2, 0]}
        >
          {l}
        </Text>
      ))}
    </group>
  );
};

const SceneContent: React.FC<MatrixVisualizerProps> = ({ state, labels }) => {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();
  const keysPressed = useRef<Record<string, boolean>>({});

  const dimensions = useMemo(() => ({
    nx: state.matrix.length,
    ny: state.matrix[0]?.length || 0,
    nz: state.matrix[0]?.[0]?.length || 0
  }), [state.matrix]);

  const centerCamera = useCallback(() => {
    if (!controlsRef.current) return;
    const center = new THREE.Vector3(
      dimensions.nx / 2,
      -dimensions.ny / 2,
      -dimensions.nz / 2
    );
    controlsRef.current.target.copy(center);
    camera.position.set(dimensions.nx * 1.5, dimensions.ny * 0.5, dimensions.nz * 1.5);
    controlsRef.current.update();
  }, [dimensions, camera]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysPressed.current[key] = true;
      if (key === 'c') centerCamera();
      
      // Prevent scrolling for navigation keys
      if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        e.preventDefault();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [centerCamera]);

  useFrame((_, delta) => {
    if (!controlsRef.current) return;

    const moveSpeed = 10 * delta;
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();
    
    // Get direction vectors relative to camera
    camera.getWorldDirection(forward);
    // Ignore vertical component for lateral movement
    forward.y = 0;
    forward.normalize();
    
    right.crossVectors(forward, camera.up).normalize();

    const movement = new THREE.Vector3(0, 0, 0);

    // Lateral Movement (WASD)
    if (keysPressed.current['w']) movement.addScaledVector(forward, moveSpeed);
    if (keysPressed.current['s']) movement.addScaledVector(forward, -moveSpeed);
    if (keysPressed.current['a']) movement.addScaledVector(right, -moveSpeed);
    if (keysPressed.current['d']) movement.addScaledVector(right, moveSpeed);

    // Vertical Movement (Space/Shift)
    if (keysPressed.current[' ']) movement.y += moveSpeed;
    if (keysPressed.current['shift']) movement.y -= moveSpeed;

    if (movement.length() > 0) {
      camera.position.add(movement);
      controlsRef.current.target.add(movement);
      controlsRef.current.update();
    }
  });

  useEffect(() => {
    centerCamera();
  }, []);

  return (
    <>
      <OrbitControls ref={controlsRef} makeDefault />
      <ambientLight intensity={0.5} />
      <pointLight position={[20, 20, 20]} intensity={1} />
      <pointLight position={[-20, -20, -20]} intensity={0.5} color="#4f46e5" />

      <axesHelper args={[5]} />
      
      {state.showGrid && (
        <group>
           <Grid
            position={[dimensions.nx / 2 - 0.5, 0, -dimensions.nz / 2 + 0.5]}
            args={[dimensions.nx + 2, dimensions.nz + 2]}
            sectionSize={1}
            sectionThickness={1.5}
            sectionColor="#334155"
            fadeDistance={100}
          />
        </group>
      )}

      <VoxelGrid state={state} />
      <PathOverlay state={state} />
      <AxisLabels labels={labels} dimensions={dimensions} />
    </>
  );
};

export const MatrixVisualizer: React.FC<MatrixVisualizerProps> = ({ state, labels }) => {
  return (
    <div className="w-full h-full">
      <Canvas shadows gl={{ antialias: true }}>
        <PerspectiveCamera makeDefault position={[15, 15, 15]} fov={50} />
        <SceneContent state={state} labels={labels} />
        <fog attach="fog" args={['#020617', 20, 100]} />
      </Canvas>
    </div>
  );
};
