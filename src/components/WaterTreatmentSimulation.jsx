import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Text, Line, Cylinder, Sphere, MeshTransmissionMaterial, Box, Torus, Float, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

const metallicMaterial = new THREE.MeshPhysicalMaterial({ color: "#94a3b8", metalness: 0.8, roughness: 0.2, clearcoat: 0.1 });
const darkMetalMaterial = new THREE.MeshPhysicalMaterial({ color: "#1e293b", metalness: 0.6, roughness: 0.6 });
const brassMaterial = new THREE.MeshPhysicalMaterial({ color: "#b45309", metalness: 0.9, roughness: 0.3 });
const dangerMaterial = new THREE.MeshPhysicalMaterial({ color: "#991b1b", metalness: 0.5, roughness: 0.6 });

function FlowingWater({ start, end, active, waterColor, reverse = false }) {
  const points = [new THREE.Vector3(...start), new THREE.Vector3(...end)];
  const lineRef = useRef();
  useFrame((state, delta) => {
    if (active && lineRef.current) {
       lineRef.current.material.dashOffset += (reverse ? 2 : -2) * delta;
    }
  });
  return (
    <Line ref={lineRef} points={points} color={active ? waterColor : "#0f172a"} lineWidth={active ? 6 : 2} dashed={active} dashScale={active ? 15 : 1} dashSize={1.5} dashOffset={0} transparent opacity={active ? 0.9 : 0.0} />
  );
}

function SolidPipe({ start, end }) {
   const vecStart = new THREE.Vector3(...start);
   const vecEnd = new THREE.Vector3(...end);
   const distance = vecStart.distanceTo(vecEnd);
   if (distance < 0.01) return null;
   const position = vecStart.clone().lerp(vecEnd, 0.5);
   const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vecEnd.clone().sub(vecStart).normalize());
   return (
     <group position={position} quaternion={quaternion}>
       <Cylinder args={[0.1, 0.1, distance, 16]} castShadow material={metallicMaterial} />
     </group>
   )
}

function IndustrialValve({ position, rotation = [0,0,0], isOpen }) {
  const handleRef = useRef();
  const lightColor = isOpen ? "#22c55e" : "#ef4444"; 
  const targetRotation = isOpen ? 0 : Math.PI / 2;
  useFrame((state, delta) => {
    if (handleRef.current) handleRef.current.rotation.y = THREE.MathUtils.damp(handleRef.current.rotation.y, targetRotation, 5, delta);
  });
  return (
    <group position={position} rotation={rotation} scale={1.2}>
      <Sphere args={[0.15, 16, 16]} material={darkMetalMaterial} />
      <Cylinder args={[0.12, 0.12, 0.4, 16]} rotation={[0, 0, Math.PI/2]} material={darkMetalMaterial} />
      <Cylinder args={[0.2, 0.2, 0.05, 16]} rotation={[0, 0, Math.PI/2]} position={[-0.2, 0, 0]} material={metallicMaterial} />
      <Cylinder args={[0.2, 0.2, 0.05, 16]} rotation={[0, 0, Math.PI/2]} position={[0.2, 0, 0]} material={metallicMaterial} />
      <group ref={handleRef} position={[0, 0.4, 0]} rotation={[0, isOpen ? 0 : Math.PI/2, 0]}>
        <Cylinder args={[0.18, 0.18, 0.04, 16]} material={new THREE.MeshStandardMaterial({color: isOpen ? "#22c55e" : "#ef4444", roughness:0.2, metalness:0.5})} />
        <Box args={[0.5, 0.02, 0.05]} material={darkMetalMaterial} position={[0, 0.03, 0]} />
      </group>
    </group>
  );
}

function StorageTank({ position, name, waterColor, isDanger = false }) {
  return (
    <group position={position}>
       <Cylinder args={[1.5, 1.5, 3, 32]} position={[0, 1.5, 0]} castShadow receiveShadow>
         <meshPhysicalMaterial color={isDanger ? "#7f1d1d" : "#475569"} metalness={0.4} roughness={0.6} />
       </Cylinder>
       <Cylinder args={[1.6, 1.6, 0.2, 32]} position={[0, 0.1, 0]} material={isDanger ? dangerMaterial : darkMetalMaterial} castShadow />
       <Cylinder args={[1.6, 1.6, 0.2, 32]} position={[0, 2.9, 0]} material={isDanger ? dangerMaterial : darkMetalMaterial} castShadow />
       <Cylinder args={[1.4, 1.4, 0.1, 32]} position={[0, 3.0, 0]}>
         <meshBasicMaterial color={waterColor} />
       </Cylinder>
       <group position={[0, 4.0, 0]}>
          <Box args={[3.2, 0.6, 0.01]} position={[0, 0, -0.1]}>
             <meshBasicMaterial color={isDanger ? "#7f1d1d" : "#0f172a"} transparent opacity={0.8} />
          </Box>
          <Text position={[0, 0, 0]} fontSize={0.25} color="#ffffff" anchorX="center" anchorY="middle">{name.toUpperCase()}</Text>
       </group>
    </group>
  );
}

function WaterPump({ position, active }) {
  const rotorRef = useRef();
  useFrame((state, delta) => { if(active && rotorRef.current) rotorRef.current.rotation.x += 10 * delta; });
  return (
    <group position={position}>
       <Cylinder args={[0.4, 0.4, 0.8, 16]} rotation={[0,0,Math.PI/2]} material={darkMetalMaterial} castShadow />
       <Cylinder ref={rotorRef} args={[0.2, 0.2, 0.82, 16]} rotation={[0,0,Math.PI/2]} material={metallicMaterial} />
       <Box args={[0.6, 0.6, 0.6]} position={[0, 0.4, 0]} material={darkMetalMaterial} />
       <group position={[0, 1.2, 0]}>
          <Text fontSize={0.15} color="#ffffff">WATER PUMP</Text>
          <Text position={[0,-0.15,0]} fontSize={0.1} color={active ? "#22c55e" : "#94a3b8"}>{active ? "RUNNING" : "STOPPED"}</Text>
       </group>
    </group>
  )
}

function ESP32ControlPanel({ position }) {
  const ledRef = useRef();
  useFrame(({ clock }) => { if (ledRef.current) ledRef.current.intensity = 1 + Math.sin(clock.elapsedTime * 8) * 0.5; });
  return (
    <group position={position} rotation={[0, -Math.PI / 6, 0]}>
      <Box args={[2.5, 4, 1]} position={[0, 2, 0]} castShadow material={darkMetalMaterial} />
      <Box args={[2.6, 0.2, 1.1]} position={[0, 0.1, 0]} material={metallicMaterial} />
      <Box args={[2, 1.5, 0.1]} position={[0, 2.5, 0.51]}>
         <meshBasicMaterial color="#020617" />
      </Box>
      <Text position={[0, 2.9, 0.57]} fontSize={0.2} color="#38bdf8" outlineWidth={0.01} outlineColor="#38bdf8">ESP32 DECISION ENGINE</Text>
      <Text position={[0, 2.5, 0.57]} fontSize={0.12} color="#22c55e" anchorX="center">● SENSOR DATA LINK ACTIVE</Text>
      <Text position={[0, 2.2, 0.57]} fontSize={0.12} color="#f59e0b" anchorX="center">DYNAMIC ROUTING: ON</Text>
      <Cylinder args={[0.04, 0.04, 0.8, 8]} position={[1, 4.4, 0]} material={metallicMaterial} />
      <Sphere args={[0.08, 16, 16]} position={[1, 4.8, 0]}><meshBasicMaterial color="#ef4444" /></Sphere>
      <pointLight ref={ledRef} position={[1, 4.8, 0]} color="#ef4444" intensity={2} distance={2} />
    </group>
  );
}

function IndustrialTank({ position, name, id, color, active, type, onSelect }) {
  return (
    <group position={position} onClick={(e) => { e.stopPropagation(); onSelect(id); }} onPointerOver={() => document.body.style.cursor='pointer'} onPointerOut={() => document.body.style.cursor='auto'}>
      <Float speed={2} rotationIntensity={0} floatIntensity={0.1}>
        <Cylinder args={[0.8, 0.8, 1.6, 32]} castShadow receiveShadow position={[0, 1.1, 0]}>
          {type === 'glass' ? <meshPhysicalMaterial color={color} metalness={0.1} roughness={0.1} transmission={0.9} transparent opacity={0.6} /> : <meshPhysicalMaterial color={active ? color : "#1e293b"} metalness={0.7} roughness={0.3} clearcoat={0.3} />}
        </Cylinder>
        <Sphere args={[0.8, 32, 16, 0, Math.PI * 2, 0, Math.PI/2]} position={[0, 1.9, 0]} castShadow><meshPhysicalMaterial color={active ? color : "#1e293b"} metalness={0.7} roughness={0.3} clearcoat={0.3} /></Sphere>
        <Sphere args={[0.8, 32, 16, 0, Math.PI * 2, Math.PI/2, Math.PI/2]} position={[0, 0.3, 0]} castShadow><meshPhysicalMaterial color={active ? color : "#1e293b"} metalness={0.7} roughness={0.3} clearcoat={0.3} /></Sphere>
        <Torus args={[0.81, 0.02, 16, 32]} position={[0, 0.7, 0]} material={darkMetalMaterial} />
        <Torus args={[0.81, 0.02, 16, 32]} position={[0, 1.5, 0]} material={darkMetalMaterial} />
        <Cylinder args={[0.15, 0.15, 0.2, 16]} position={[0, 2.75, 0]} material={metallicMaterial} />
        <group position={[0, 3.4, 0]}>
           <Box args={[2.5, 0.6, 0.01]} position={[0, 0, -0.1]}><meshBasicMaterial color="#0f172a" transparent opacity={0.6} /></Box>
           <Text position={[0, 0.1, 0]} fontSize={0.2} color={active ? "#ffffff" : "#94a3b8"} anchorX="center" anchorY="middle">{name.toUpperCase()}</Text>
           <Text position={[0, -0.15, 0]} fontSize={0.12} color={active ? "#38bdf8" : "#ef4444"} anchorX="center" anchorY="middle">{active ? "● SYSTEM ONLINE" : "○ BYPASSED"}</Text>
        </group>
      </Float>
    </group>
  );
}

function SensorNode({ position, name, isOutput, statusText }) {
  const lightColor = !isOutput ? "#38bdf8" : (statusText.includes('ACCEPT') ? "#10b981" : statusText.includes('RE-TREAT') ? "#f59e0b" : "#ef4444");
  return (
    <group position={position}>
       <Float speed={2} rotationIntensity={0} floatIntensity={0.1}>
         <Cylinder args={[0.4, 0.4, 0.8, 16]} position={[0, 0.4, 0]} castShadow material={darkMetalMaterial} />
         <Cylinder args={[0.45, 0.45, 0.1, 16]} position={[0, 0.8, 0]} material={metallicMaterial} />
         <Sphere args={[0.35, 16, 16, 0, Math.PI*2, 0, Math.PI/2]} position={[0, 0.85, 0]}><meshPhysicalMaterial transmission={0.9} roughness={0.1} color="#ffffff" transparent opacity={0.5}/></Sphere>
         <Sphere args={[0.15, 16, 16]} position={[0, 1.0, 0]}><meshBasicMaterial color={lightColor} /></Sphere>
         <pointLight position={[0, 1.2, 0]} color={lightColor} intensity={2} distance={3} />
         
         <group position={[0, 2.2, 0]}>
           <Box args={[2.5, 0.6, 0.01]} position={[0, 0, -0.1]}><meshBasicMaterial color="#0f172a" transparent opacity={0.8} /></Box>
           <Text position={[0, 0.1, 0]} fontSize={0.2} color="#ffffff" anchorX="center" anchorY="middle">{name}</Text>
           <Text position={[0, -0.15, 0]} fontSize={0.12} color={lightColor} anchorX="center" anchorY="middle">{statusText}</Text>
         </group>
       </Float>
    </group>
  )
}

function PipeNetwork({ activeModules, isSimulating, rawWaterColor, verificationStatus }) {
  const nodes = { src: -10, pump: -8.5, s1: -7, sed: -4, car: -1, mem: 2, ph: 5, dis: 8, s2: 11, out: 14 };
  const yMain = 0.5; 
  const yBypass = -0.8; 
  const zReject = -3;
  const zRetreat = 3;

  const drawPhysicalPipes = () => {
    return (
      <group>
        {/* Main Line */}
        <SolidPipe start={[nodes.src, yMain, 0]} end={[nodes.s2, yMain, 0]} />
        {/* Bypass Line */}
        <SolidPipe start={[nodes.sed - 1.5, yBypass, 0]} end={[nodes.dis + 1.5, yBypass, 0]} />
        
        {/* Junctions */}
        {[nodes.sed, nodes.car, nodes.mem, nodes.ph, nodes.dis].map((x) => {
          let mod = x===nodes.sed?'sediment':x===nodes.car?'carbon':x===nodes.mem?'membrane':x===nodes.ph?'phCorrection':'disinfection';
          return (
            <group key={`phys-junc-${x}`}>
              <SolidPipe start={[x - 1.5, yMain, 0]} end={[x - 1.5, yBypass, 0]} />
              <IndustrialValve position={[x - 1.5, yMain, 0]} rotation={[0,0,0]} isOpen={activeModules[mod]} />
              <IndustrialValve position={[x - 1.5, yBypass + 0.3, 0]} rotation={[0,0,Math.PI/2]} isOpen={!activeModules[mod]} />
            </group>
          )
        })}
        <SolidPipe start={[nodes.dis + 1.5, yMain, 0]} end={[nodes.dis + 1.5, yBypass, 0]} />

        {/* Post-Sensor 2 Routing */}
        <SolidPipe start={[nodes.s2, yMain, 0]} end={[nodes.out, yMain, 0]} /> {/* To Clean */}
        
        {/* Divert Line (S2 to Reject Tank) */}
        <SolidPipe start={[nodes.s2, yMain, 0]} end={[nodes.s2, yMain, zReject]} />
        <SolidPipe start={[nodes.s2, yMain, zReject]} end={[nodes.out, yMain, zReject]} />

        {/* Re-treatment Loop (S2 back to Manifold) */}
        <SolidPipe start={[nodes.s2, yMain, 0]} end={[nodes.s2, yMain, zRetreat]} />
        <SolidPipe start={[nodes.s2, yMain, zRetreat]} end={[nodes.sed - 1.5, yMain, zRetreat]} />
        <SolidPipe start={[nodes.sed - 1.5, yMain, zRetreat]} end={[nodes.sed - 1.5, yMain, 0]} />
        
        {/* Membrane Reject Line */}
        <SolidPipe start={[nodes.mem, yMain, 0]} end={[nodes.mem, yMain, zReject]} />
        <SolidPipe start={[nodes.mem, yMain, zReject]} end={[nodes.out, yMain, zReject]} />
        
        <group position={[nodes.mem, yMain + 0.5, zReject/2]}><Text fontSize={0.15} color="#f59e0b">RO CONCENTRATE</Text></group>
        <group position={[(nodes.s2 + nodes.out)/2, yMain + 0.5, zReject]}><Text fontSize={0.15} color="#ef4444">DIVERT LINE</Text></group>
        <group position={[nodes.ph, yMain + 0.5, zRetreat]}><Text fontSize={0.15} color="#eab308">RE-TREATMENT LOOP</Text></group>
        
        {/* Manifold Label */}
        <group position={[nodes.sed - 2, 2.5, 0]}><Text fontSize={0.2} color="#ffffff">SMART VALVE MANIFOLD ↴</Text></group>
      </group>
    );
  }

  const cMurky = "#92400e";
  const cSemi = "#0369a1";
  const cPure = "#38bdf8";
  
  const drawDynamicFlow = () => {
    let elements = [];
    let isCurrentlyOnBypass = false;
    let currentColor = rawWaterColor;

    // Pump & S1
    elements.push(<FlowingWater key="p1" start={[nodes.src, yMain, 0]} end={[nodes.pump, yMain, 0]} active={isSimulating} waterColor={currentColor} />);
    elements.push(<FlowingWater key="p2" start={[nodes.pump, yMain, 0]} end={[nodes.s1, yMain, 0]} active={isSimulating} waterColor={currentColor} />);
    elements.push(<FlowingWater key="p3" start={[nodes.s1, yMain, 0]} end={[nodes.sed - 1.5, yMain, 0]} active={isSimulating} waterColor={currentColor} />);

    const moduleSequence = [
      { id: 'sediment', x: nodes.sed }, { id: 'carbon', x: nodes.car },
      { id: 'membrane', x: nodes.mem }, { id: 'phCorrection', x: nodes.ph }, { id: 'disinfection', x: nodes.dis },
    ];

    moduleSequence.forEach((mod) => {
      const startX = mod.x - 1.5;
      const endX = mod.x + 1.5;
      const isActive = activeModules[mod.id];
      const nextColor = isActive ? (mod.id === 'sediment' || mod.id === 'carbon' ? cSemi : cPure) : currentColor;

      if (isActive) {
        if (isCurrentlyOnBypass) {
          elements.push(<FlowingWater key={`rise-${mod.id}`} start={[startX, yBypass, 0]} end={[startX, yMain, 0]} active={isSimulating} waterColor={currentColor} />);
          isCurrentlyOnBypass = false;
        }
        elements.push(<FlowingWater key={`main-in-${mod.id}`} start={[startX, yMain, 0]} end={[mod.x, yMain, 0]} active={isSimulating} waterColor={currentColor} />);
        elements.push(<FlowingWater key={`main-out-${mod.id}`} start={[mod.x, yMain, 0]} end={[endX, yMain, 0]} active={isSimulating} waterColor={nextColor} />);
        
        // Membrane Reject Animation
        if (mod.id === 'membrane') {
           elements.push(<FlowingWater key="mem-rej1" start={[mod.x, yMain, 0]} end={[mod.x, yMain, zReject]} active={isSimulating} waterColor={cMurky} />);
           elements.push(<FlowingWater key="mem-rej2" start={[mod.x, yMain, zReject]} end={[nodes.out, yMain, zReject]} active={isSimulating} waterColor={cMurky} />);
        }
      } else {
        if (!isCurrentlyOnBypass) {
          elements.push(<FlowingWater key={`drop-${mod.id}`} start={[startX, yMain, 0]} end={[startX, yBypass, 0]} active={isSimulating} waterColor={currentColor} />);
          isCurrentlyOnBypass = true;
        }
        elements.push(<FlowingWater key={`byp-${mod.id}`} start={[startX, yBypass, 0]} end={[endX, yBypass, 0]} active={isSimulating} waterColor={currentColor} />);
      }
      currentColor = nextColor;
    });

    const lastX = nodes.dis + 1.5;
    if (isCurrentlyOnBypass) {
      elements.push(<FlowingWater key="final-rise" start={[lastX, yBypass, 0]} end={[lastX, yMain, 0]} active={isSimulating} waterColor={currentColor} />);
    }
    
    // To Sensor 2
    elements.push(<FlowingWater key="s2-flow" start={[lastX, yMain, 0]} end={[nodes.s2, yMain, 0]} active={isSimulating} waterColor={currentColor} />);

    // Branch logic after Sensor 2
    if (verificationStatus === 'ACCEPT') {
       elements.push(<FlowingWater key="out-clean" start={[nodes.s2, yMain, 0]} end={[nodes.out, yMain, 0]} active={isSimulating} waterColor={cPure} />);
    } else if (verificationStatus === 'DIVERT') {
       elements.push(<FlowingWater key="div1" start={[nodes.s2, yMain, 0]} end={[nodes.s2, yMain, zReject]} active={isSimulating} waterColor={currentColor} />);
       elements.push(<FlowingWater key="div2" start={[nodes.s2, yMain, zReject]} end={[nodes.out, yMain, zReject]} active={isSimulating} waterColor={currentColor} />);
    } else if (verificationStatus === 'RE-TREAT') {
       elements.push(<FlowingWater key="ret1" start={[nodes.s2, yMain, 0]} end={[nodes.s2, yMain, zRetreat]} active={isSimulating} waterColor={currentColor} />);
       // Flows backward visually
       elements.push(<FlowingWater key="ret2" start={[nodes.sed - 1.5, yMain, zRetreat]} end={[nodes.s2, yMain, zRetreat]} active={isSimulating} waterColor={currentColor} reverse={true} />);
       elements.push(<FlowingWater key="ret3" start={[nodes.sed - 1.5, yMain, zRetreat]} end={[nodes.sed - 1.5, yMain, 0]} active={isSimulating} waterColor={currentColor} />);
    }

    return elements;
  }

  return (
    <group>
       {drawPhysicalPipes()}
       {drawDynamicFlow()}
    </group>
  );
}

export default function WaterTreatmentSimulation({ activeModules, sensors, verificationStatus, onSelectModule, isSimulating }) {
  const cMurky = "#92400e";
  const cSemi = "#0369a1";
  const cPure = "#38bdf8";
  
  const rawWaterColor = (sensors.turbidity > 15 || sensors.tds > 1000) ? cMurky : cSemi;
  const treatedWaterColor = verificationStatus === 'ACCEPT' ? cPure : "#0f172a"; 
  const rejectWaterColor = cMurky;

  return (
    <Canvas shadows camera={{ position: [2, 12, 22], fov: 40 }}>
      <color attach="background" args={['#020617']} />
      <ambientLight intensity={0.6} />
      <spotLight position={[10, 20, 10]} angle={0.3} penumbra={1} intensity={3} castShadow shadow-mapSize={[2048, 2048]} />
      <spotLight position={[-10, 20, -10]} angle={0.3} penumbra={1} intensity={1} color="#0ea5e9" />
      <pointLight position={[0, 2, 5]} intensity={1.5} color="#38bdf8" />
      <Environment preset="warehouse" />
      
      <group position={[0, -0.5, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow onClick={() => onSelectModule(null)}>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#0b1120" metalness={0.8} roughness={0.2} />
        </mesh>
        <gridHelper args={[100, 100, '#1e293b', '#0f172a']} position={[0, 0.02, 0]} />
        <ContactShadows resolution={1024} scale={40} blur={2} opacity={0.5} far={10} color="#000000" />
      </group>

      <group position={[-2, 0.5, 0]}>
        <StorageTank position={[-10, 0, 0]} name="Raw Water Source" waterColor={rawWaterColor} />
        <WaterPump position={[-8.5, 0.5, 0]} active={isSimulating} />
        
        <ESP32ControlPanel position={[2, 0, -6]} />
        
        <SensorNode position={[-7, 0, 0]} name="INFLUENT SENSOR 1" isOutput={false} statusText="LIVE DATA STREAM" />
        
        <IndustrialTank position={[-4, 0, 0]} name="Sedimentation" id="sediment" color="#cbd5e1" active={activeModules.sediment} type="solid" onSelect={onSelectModule} />
        <IndustrialTank position={[-1, 0, 0]} name="Carbon Adsorption" id="carbon" color="#1e293b" active={activeModules.carbon} type="solid" onSelect={onSelectModule} />
        <IndustrialTank position={[2, 0, 0]} name="Reverse Osmosis" id="membrane" color="#f8fafc" active={activeModules.membrane} type="glass" onSelect={onSelectModule} />
        <IndustrialTank position={[5, 0, 0]} name="Chemical Dosing" id="phCorrection" color="#c084fc" active={activeModules.phCorrection} type="mixer" onSelect={onSelectModule} />
        <IndustrialTank position={[8, 0, 0]} name="UV Disinfection" id="disinfection" color="#38bdf8" active={activeModules.disinfection} type="glass" onSelect={onSelectModule} />
        
        <SensorNode position={[11, 0, 0]} name="FINAL QUALITY SENSOR 2" isOutput={true} statusText={`VERIFICATION: ${verificationStatus}`} />
        
        <StorageTank position={[14, 0, 0]} name="Clean Water Tank" waterColor={treatedWaterColor} />
        <StorageTank position={[14, 0, -3]} name="Reject / Divert Tank" waterColor={rejectWaterColor} isDanger={true} />

        <PipeNetwork activeModules={activeModules} rawWaterColor={rawWaterColor} verificationStatus={verificationStatus} isSimulating={isSimulating} />
      </group>

      <OrbitControls makeDefault enablePan={true} panSpeed={1.5} enableZoom={true} minDistance={5} maxDistance={50} minPolarAngle={0} maxPolarAngle={Math.PI / 2 - 0.05} enableDamping dampingFactor={0.05} target={[0, 2, 0]} />
    </Canvas>
  );
}
