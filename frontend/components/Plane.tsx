"use client";

import React, { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment, Float } from '@react-three/drei';

function PaperPlaneModel({ scale = 1, modelPosition = [2, 1, 0] as [number, number, number] }) {
  const { scene } = useGLTF('/paper_plane.glb');
  const planeRef = useRef<any>();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (planeRef.current) {
      // Gentle diagonal "breathing" movement
      // planeRef.current.position.y = modelPosition[1] + Math.sin(t) * 0.1;
      // planeRef.current.position.x = modelPosition[0] + Math.cos(t * 0.5) * 0.05;

      // Static diagonal pose (Nose up and right)
      planeRef.current.rotation.x = 1;
      planeRef.current.rotation.y = -0.6;
      planeRef.current.rotation.z = 1.3;
    }
  });

  return <primitive object={scene} ref={planeRef} scale={scale} position={modelPosition} />;
}

export default function AscendingPlaneScene({ modelScale = 0.04, modelPosition = [2, 1, 0] }) {
  return (
    <div className="w-full h-full">
      {/* Alpha true allows the background of the section to show through */}
      <Canvas 
        camera={{ position: [0, 0, 5], fov: 45 }} 
        gl={{ alpha: true, antialias: true }}
        style={{ pointerEvents: 'none' }} 
      >
        <ambientLight intensity={1.5} />
        <pointLight position={[10, 10, 10]} intensity={2} />
        <Suspense fallback={null}>
          <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
            <PaperPlaneModel scale={modelScale} modelPosition={modelPosition as [number, number, number]} />
          </Float>
          <Environment preset="city" />
        </Suspense>
      </Canvas>
    </div>
  );
}