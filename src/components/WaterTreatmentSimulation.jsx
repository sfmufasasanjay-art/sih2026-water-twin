import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Text, Line, Cylinder, Sphere, MeshTransmissionMaterial, Box, Torus, Float, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

const metallicMaterial = new THREE.MeshPhysicalMaterial({ color: "#94a3b8", metalness: 0.8, roughness: 0.2, clearcoat: 0.1 });
const darkMetalMaterial = new THREE.MeshPhysicalMaterial({ color: "#1e293b", metalness: 0.6, roughness: 0.6 });
const brassMaterial = new THREE.MeshPhysicalMaterial({ color: "#b45309", metalness: 0.9, roughness: 0.3 });

function FlowingWater({ start, end, active, waterColor }) {
  const points = [
    new THREE.Vector3(start[0], start[1], start[2]),
    new THREE.Vector3(end[0], end[1], end[2])
  ];
  const lineRef = useRef();
  useFrame(() => {
    if (active && lineRef.current) {
       lineRef.current.material.dashOffset -= 0.05;
    }
  });
  return (
    <Line
      ref={lineRef}
      points={points}
      color={active ? waterColor : "#0f172a"}
      lineWidth={active ? 6 : 2}
      dashed={active}
      dashScale={active ? 15 : 1}
      dashSize={1.5}
      dashOffset={0}
      transparent
      opacity={active ? 0.9 : 0.0}
    />
  );
}

function IndustrialValve({ position, rotation = [0,0,0], isOpen }) {
  const handleRef = useRef();
  const lightColor = isOpen ? "#22c55e" : "#ef4444"; 
  const targetRotation = isOpen ? 0 : Math.PI / 2;
  useFrame(() => {
    if (handleRef.current) {
      handleRef.current.rotation.y = THREE.MathUtils.lerp(handleRef.current.rotation.y, targetRotation, 0.1);
    }
  });
  return (
    <group position={position} rotation={rotation} scale={1.2}>
      <Sphere args={[0.15, 32, 32]} material={darkMetalMaterial} />
      <Cylinder args={[0.12, 0.12, 0.4, 32]} rotation={[0, 0, Math.PI/2]} material={darkMetalMaterial} />
      <Cylinder args={[0.2, 0.2, 0.05, 32]} rotation={[0, 0, Math.PI/2]} position={[-0.2, 0, 0]} material={metallicMaterial} />
      <Cylinder args={[0.2, 0.2, 0.05, 32]} rotation={[0, 0, Math.PI/2]} position={[0.2, 0, 0]} material={metallicMaterial} />
      <Cylinder args={[0.08, 0.1, 0.2, 16]} position={[0, 0.2, 0]} material={brassMaterial} />
      <Cylinder args={[0.04, 0.04, 0.2, 16]} position={[0, 0.3, 0]} material={metallicMaterial} />
      <group ref={handleRef} position={[0, 0.4, 0]} rotation={[0, isOpen ? 0 : Math.PI/2, 0]}>
        <Cylinder args={[0.18, 0.18, 0.04, 16]} material={new THREE.MeshStandardMaterial({color: isOpen ? "#22c55e" : "#ef4444", roughness:0.2, metalness:0.5})} />
        <Box args={[0.5, 0.02, 0.05]} material={darkMetalMaterial} position={[0, 0.03, 0]} />
      </group>
      <Sphere args={[0.03, 16, 16]} position={[0, 0.48, 0]}>
        <meshBasicMaterial color={lightColor} />
      </Sphere>
    </group>
  );
}

function StorageTank({ position, name, waterColor }) {
  return (
    <group position={position}>
       <Cylinder args={[1.5, 1.5, 3, 32]} position={[0, 1.5, 0]} castShadow receiveShadow>
         <meshPhysicalMaterial color="#475569" metalness={0.4} roughness={0.6} />
       </Cylinder>
       <Cylinder args={[1.6, 1.6, 0.2, 32]} position={[0, 0.1, 0]} material={darkMetalMaterial} castShadow />
       <Cylinder args={[1.6, 1.6, 0.2, 32]} position={[0, 2.9, 0]} material={darkMetalMaterial} castShadow />
       
       {/* Water surface visible at the top */}
       <Cylinder args={[1.4, 1.4, 0.1, 32]} position={[0, 3.0, 0]}>
         <meshBasicMaterial color={waterColor} />
       </Cylinder>
       
       <group position={[0, 4.0, 0]}>
          <Box args={[3.0, 0.6, 0.01]} position={[0, 0, -0.1]}>
             <meshBasicMaterial color="#0f172a" transparent opacity={0.6} />
          </Box>
          <Text position={[0, 0, 0]} fontSize={0.25} color="#ffffff" anchorX="center" anchorY="middle">
             {name.toUpperCase()}
          </Text>
       </group>
    </group>
  );
}

function ESP32ControlPanel({ position }) {
  const ledRef = useRef();
  useFrame(({ clock }) => {
     if (ledRef.current) {
        ledRef.current.intensity = 1 + Math.sin(clock.elapsedTime * 8) * 0.5;
     }
  });

  return (
    <group position={position} rotation={[0, -Math.PI / 6, 0]}>
      <Box args={[2.5, 4, 1]} position={[0, 2, 0]} castShadow material={darkMetalMaterial} />
      <Box args={[2.6, 0.2, 1.1]} position={[0, 0.1, 0]} material={metallicMaterial} />
      
      {/* Glowing Screen */}
      <Box args={[2, 1.5, 0.1]} position={[0, 2.5, 0.51]}>
         <meshBasicMaterial color="#020617" />
      </Box>
      <Text position={[0, 2.9, 0.57]} fontSize={0.2} color="#38bdf8" outlineWidth={0.01} outlineColor="#38bdf8">ESP32 DECISION ENGINE</Text>
      <Text position={[0, 2.5, 0.57]} fontSize={0.12} color="#22c55e" anchorX="center">● SENSOR DATA LINK ACTIVE</Text>
      <Text position={[0, 2.2, 0.57]} fontSize={0.12} color="#f59e0b" anchorX="center">DYNAMIC ROUTING: ON</Text>

      {/* Edge Antenna */}
      <Cylinder args={[0.04, 0.04, 0.8, 8]} position={[1, 4.4, 0]} material={metallicMaterial} />
      <Sphere args={[0.08, 16, 16]} position={[1, 4.8, 0]}>
        <meshBasicMaterial color="#ef4444" />
      </Sphere>
      <pointLight ref={ledRef} position={[1, 4.8, 0]} color="#ef4444" intensity={2} distance={2} />

      {/* Data Cables running into the floor */}
      <Cylinder args={[0.05, 0.05, 2, 16]} position={[-0.8, 1, 0.6]} material={new THREE.MeshStandardMaterial({color: "#38bdf8"})} />
      <Cylinder args={[0.05, 0.05, 2, 16]} position={[-0.5, 1, 0.6]} material={new THREE.MeshStandardMaterial({color: "#38bdf8"})} />
      
      {/* Label */}
      <Text position={[0, 4.5, 0]} fontSize={0.25} color="#ffffff">CENTRAL CONTROL</Text>
    </group>
  );
}

function IndustrialTank({ position, name, id, color, active, type, onSelect, hoveredId, setHoveredId }) {
  const meshRef = useRef();
  const isHovered = hoveredId === id;
  useFrame(() => {
    if (active && type === 'mixer' && meshRef.current) {
      meshRef.current.rotation.y += 0.08;
    }
  });
  return (
    <group 
      position={position} 
      onClick={(e) => { e.stopPropagation(); onSelect(id); }}
      onPointerOver={(e) => { e.stopPropagation(); setHoveredId(id); document.body.style.cursor = 'pointer'; }}
      onPointerOut={(e) => { e.stopPropagation(); setHoveredId(null); document.body.style.cursor = 'auto'; }}
    >
      <Float speed={2} rotationIntensity={0} floatIntensity={isHovered ? 0.2 : 0}>
        {isHovered && (
          <Cylinder args={[1.1, 1.1, 2.5, 32]} position={[0, 1.1, 0]}>
            <meshBasicMaterial color="#38bdf8" wireframe transparent opacity={0.4} />
          </Cylinder>
        )}
        <Cylinder args={[0.8, 0.8, 1.6, 64]} castShadow receiveShadow position={[0, 1.1, 0]}>
          {type === 'glass' ? (
            <MeshTransmissionMaterial backside samples={16} thickness={0.8} roughness={0.05} ior={1.5} transmission={0.95} color={color} metalness={0.1} />
          ) : (
            <meshPhysicalMaterial color={active ? color : "#1e293b"} metalness={0.7} roughness={0.3} clearcoat={0.3} />
          )}
        </Cylinder>
        <Sphere args={[0.8, 64, 32, 0, Math.PI * 2, 0, Math.PI/2]} position={[0, 1.9, 0]} castShadow>
           <meshPhysicalMaterial color={active ? color : "#1e293b"} metalness={0.7} roughness={0.3} clearcoat={0.3} />
        </Sphere>
        <Sphere args={[0.8, 64, 32, 0, Math.PI * 2, Math.PI/2, Math.PI/2]} position={[0, 0.3, 0]} castShadow>
           <meshPhysicalMaterial color={active ? color : "#1e293b"} metalness={0.7} roughness={0.3} clearcoat={0.3} />
        </Sphere>
        <Torus args={[0.81, 0.02, 16, 64]} position={[0, 0.7, 0]} material={darkMetalMaterial} />
        <Torus args={[0.81, 0.02, 16, 64]} position={[0, 1.5, 0]} material={darkMetalMaterial} />
        <Cylinder args={[0.05, 0.05, 0.5, 16]} position={[-0.5, 0.15, 0.5]} material={darkMetalMaterial} castShadow />
        <Cylinder args={[0.05, 0.05, 0.5, 16]} position={[0.5, 0.15, 0.5]} material={darkMetalMaterial} castShadow />
        <Cylinder args={[0.05, 0.05, 0.5, 16]} position={[-0.5, 0.15, -0.5]} material={darkMetalMaterial} castShadow />
        <Cylinder args={[0.05, 0.05, 0.5, 16]} position={[0.5, 0.15, -0.5]} material={darkMetalMaterial} castShadow />
        {type === 'mixer' && (
          <group ref={meshRef} position={[0, 1.1, 0]}>
             <Cylinder args={[0.05, 0.05, 1.6, 16]} material={metallicMaterial} />
             <Box args={[1.2, 0.1, 0.02]} position={[0, -0.4, 0]} material={metallicMaterial} />
             <Box args={[1.2, 0.1, 0.02]} position={[0, 0.4, 0]} rotation={[0, Math.PI/2, 0]} material={metallicMaterial} />
          </group>
        )}
        <group position={[0, 1.1, 0.8]}>
           <Box args={[0.4, 0.5, 0.1]} material={darkMetalMaterial} />
           <Box args={[0.3, 0.2, 0.11]} position={[0, 0.1, 0]}>
              <meshBasicMaterial color={active ? "#0ea5e9" : "#0f172a"} />
           </Box>
           <Sphere args={[0.04, 16, 16]} position={[-0.1, -0.15, 0.06]}>
              <meshBasicMaterial color={active ? "#22c55e" : "#ef4444"} />
           </Sphere>
        </group>
        <Cylinder args={[0.15, 0.15, 0.2, 32]} position={[0, 2.75, 0]} material={metallicMaterial} />
        <group position={[0, 3.4, 0]}>
           <Box args={[2.5, 0.6, 0.01]} position={[0, 0, -0.1]}>
              <meshBasicMaterial color="#0f172a" transparent opacity={0.6} />
           </Box>
           <Text position={[0, 0.1, 0]} fontSize={0.2} color={active ? "#ffffff" : "#94a3b8"} anchorX="center" anchorY="middle">
             {name.toUpperCase()}
           </Text>
           <Text position={[0, -0.15, 0]} fontSize={0.12} color={active ? "#38bdf8" : "#ef4444"} anchorX="center" anchorY="middle">
             {active ? "● SYSTEM ONLINE" : "○ BYPASSED"}
           </Text>
        </group>
      </Float>
    </group>
  );
}

function SensorNode({ position, name, id, isOutput, status, onSelect, hoveredId, setHoveredId }) {
  const isHovered = hoveredId === id;
  const lightColor = !isOutput ? "#38bdf8" : (status.includes('Acceptable') ? "#10b981" : "#f43f5e");
  return (
    <group 
      position={position}
      onClick={(e) => { e.stopPropagation(); onSelect(id); }}
      onPointerOver={(e) => { e.stopPropagation(); setHoveredId(id); document.body.style.cursor = 'pointer'; }}
      onPointerOut={(e) => { e.stopPropagation(); setHoveredId(null); document.body.style.cursor = 'auto'; }}
    >
       <Float speed={2} rotationIntensity={0} floatIntensity={isHovered ? 0.2 : 0}>
         {isHovered && (
          <Cylinder args={[0.7, 0.7, 1.8, 16]} position={[0, 0.9, 0]}>
            <meshBasicMaterial color="#38bdf8" wireframe transparent opacity={0.3} />
          </Cylinder>
         )}
         <Cylinder args={[0.4, 0.4, 0.8, 32]} position={[0, 0.4, 0]} castShadow material={darkMetalMaterial} />
         <Cylinder args={[0.45, 0.45, 0.1, 32]} position={[0, 0.8, 0]} material={metallicMaterial} />
         <Sphere args={[0.35, 32, 16, 0, Math.PI*2, 0, Math.PI/2]} position={[0, 0.85, 0]}>
            <MeshTransmissionMaterial backside samples={8} thickness={0.2} roughness={0.1} transmission={1} color="#ffffff" />
         </Sphere>
         <Sphere args={[0.15, 32, 32]} position={[0, 1.0, 0]}>
            <meshBasicMaterial color={lightColor} />
         </Sphere>
         <pointLight position={[0, 1.2, 0]} color={lightColor} intensity={2} distance={3} />
         <Box args={[0.6, 0.1, 0.6]} position={[0, 0.05, 0]} material={metallicMaterial} castShadow />
         
         <group position={[0, 2.2, 0]}>
           <Box args={[2.5, 0.6, 0.01]} position={[0, 0, -0.1]}>
              <meshBasicMaterial color="#0f172a" transparent opacity={0.6} />
           </Box>
           <Text position={[0, 0.1, 0]} fontSize={0.2} color="#ffffff" anchorX="center" anchorY="middle">
             {name}
           </Text>
           <Text position={[0, -0.15, 0]} fontSize={0.12} color={lightColor} anchorX="center" anchorY="middle">
             {isOutput ? status.toUpperCase() : "LIVE DATA STREAM"}
           </Text>
         </group>
       </Float>
    </group>
  )
}

function PipeNetwork({ activeModules, sensors, isSimulating }) {
  const nodes = { src: -10, s1: -7, sed: -4, car: -1, mem: 2, ph: 5, dis: 8, s2: 11, out: 14 };
  const yMain = 0.5; 
  const yBypass = -0.8; 

  const SolidPipe = ({ start, end }) => {
     const vecStart = new THREE.Vector3(...start);
     const vecEnd = new THREE.Vector3(...end);
     const distance = vecStart.distanceTo(vecEnd);
     if (distance < 0.01) return null;
     const position = vecStart.clone().lerp(vecEnd, 0.5);
     const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vecEnd.clone().sub(vecStart).normalize());
     return (
       <group position={position} quaternion={quaternion}>
         <Cylinder args={[0.1, 0.1, distance, 32]} castShadow material={metallicMaterial} />
       </group>
     )
  }
  
  const drawPhysicalPipes = () => {
    return (
      <group>
        {/* Main Line connecting all the way from SRC to OUT */}
        <SolidPipe start={[nodes.src, yMain, 0]} end={[nodes.out, yMain, 0]} />
        
        {/* Bypass Line */}
        <SolidPipe start={[nodes.sed - 1.5, yBypass, 0]} end={[nodes.dis + 1.5, yBypass, 0]} />
        
        {/* Vertical drops and rises at each junction */}
        {[nodes.sed, nodes.car, nodes.mem, nodes.ph, nodes.dis].map((x) => (
          <group key={`phys-junc-${x}`}>
            <SolidPipe start={[x - 1.5, yMain, 0]} end={[x - 1.5, yBypass, 0]} />
            <IndustrialValve position={[x - 1.5, yMain, 0]} rotation={[0,0,0]} isOpen={activeModules[getModuleName(x)]} />
            <IndustrialValve position={[x - 1.5, yBypass + 0.3, 0]} rotation={[0,0,Math.PI/2]} isOpen={!activeModules[getModuleName(x)]} />
          </group>
        ))}
        {/* Final rise back to S2 */}
        <SolidPipe start={[nodes.dis + 1.5, yMain, 0]} end={[nodes.dis + 1.5, yBypass, 0]} />
      </group>
    );
  }

  function getModuleName(xPos) {
    if (xPos === nodes.sed) return 'sediment';
    if (xPos === nodes.car) return 'carbon';
    if (xPos === nodes.mem) return 'membrane';
    if (xPos === nodes.ph) return 'phCorrection';
    if (xPos === nodes.dis) return 'disinfection';
  }

  const cMurky = "#92400e";
  const cSemi = "#0369a1";
  const cPure = "#38bdf8";
  
  const drawDynamicFlow = () => {
    let elements = [];
    let isCurrentlyOnBypass = false;
    let wColor1 = sensors.turbidity > 15 || sensors.tds > 1000 ? cMurky : cSemi;
    let currentColor = wColor1;

    const moduleSequence = [
      { id: 'sediment', x: nodes.sed },
      { id: 'carbon', x: nodes.car },
      { id: 'membrane', x: nodes.mem },
      { id: 'phCorrection', x: nodes.ph },
      { id: 'disinfection', x: nodes.dis },
    ];

    // Source to first junction
    elements.push(<FlowingWater key="init-src" start={[nodes.src, yMain, 0]} end={[nodes.sed - 1.5, yMain, 0]} active={isSimulating} waterColor={currentColor} />);

    moduleSequence.forEach((mod) => {
      const startX = mod.x - 1.5;
      const endX = mod.x + 1.5;
      const isActive = activeModules[mod.id];
      const nextColor = isActive ? getColorForModule(mod.id, currentColor) : currentColor;

      if (isActive) {
        if (isCurrentlyOnBypass) {
          elements.push(<FlowingWater key={`rise-${mod.id}`} start={[startX, yBypass, 0]} end={[startX, yMain, 0]} active={isSimulating} waterColor={currentColor} />);
          isCurrentlyOnBypass = false;
        }
        elements.push(<FlowingWater key={`main-in-${mod.id}`} start={[startX, yMain, 0]} end={[mod.x, yMain, 0]} active={isSimulating} waterColor={currentColor} />);
        elements.push(<FlowingWater key={`main-out-${mod.id}`} start={[mod.x, yMain, 0]} end={[endX, yMain, 0]} active={isSimulating} waterColor={nextColor} />);
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
    
    // Final flow to Out tank
    elements.push(<FlowingWater key="final-main" start={[lastX, yMain, 0]} end={[nodes.out, yMain, 0]} active={isSimulating} waterColor={currentColor} />);

    return elements;
  }

  function getColorForModule(modId, currentColor) {
    if (modId === 'sediment' || modId === 'carbon') return cSemi;
    if (modId === 'membrane' || modId === 'phCorrection' || modId === 'disinfection') return cPure;
    return currentColor;
  }

  return (
    <group>
       {drawPhysicalPipes()}
       {drawDynamicFlow()}
    </group>
  );
}

export default function WaterTreatmentSimulation({ activeModules, sensors, outputStatus, onSelectModule, isSimulating }) {
  const [hoveredId, setHoveredId] = useState(null);

  // Determine starting and final water colors
  const cMurky = "#92400e";
  const cSemi = "#0369a1";
  const cPure = "#38bdf8";
  
  const rawWaterColor = (sensors.turbidity > 15 || sensors.tds > 1000) ? cMurky : cSemi;
  const treatedWaterColor = outputStatus.includes('Acceptable') ? cPure : (outputStatus.includes('Re-treat') ? cSemi : cMurky);

  return (
    <Canvas shadows camera={{ position: [2, 10, 22], fov: 40 }}>
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
        
        {/* HUGE RAW WATER TANK */}
        <StorageTank position={[-10, 0, 0]} name="Raw Water Source" waterColor={rawWaterColor} />

        {/* ESP32 CENTRAL CONTROLLER */}
        <ESP32ControlPanel position={[2, 0, -4]} />

        {/* INFLUENT SENSOR */}
        <SensorNode position={[-7, 0, 0]} name="INFLUENT SENSOR" id="s1" isOutput={false} onSelect={onSelectModule} hoveredId={hoveredId} setHoveredId={setHoveredId} />
        
        {/* TREATMENT MODULES */}
        <IndustrialTank position={[-4, 0, 0]} name="Sedimentation" id="sediment" color="#cbd5e1" active={activeModules.sediment} type="solid" onSelect={onSelectModule} hoveredId={hoveredId} setHoveredId={setHoveredId} />
        <IndustrialTank position={[-1, 0, 0]} name="Carbon Adsorption" id="carbon" color="#1e293b" active={activeModules.carbon} type="solid" onSelect={onSelectModule} hoveredId={hoveredId} setHoveredId={setHoveredId} />
        <IndustrialTank position={[2, 0, 0]} name="Reverse Osmosis" id="membrane" color="#f8fafc" active={activeModules.membrane} type="glass" onSelect={onSelectModule} hoveredId={hoveredId} setHoveredId={setHoveredId} />
        <IndustrialTank position={[5, 0, 0]} name="Chemical Dosing" id="phCorrection" color="#c084fc" active={activeModules.phCorrection} type="mixer" onSelect={onSelectModule} hoveredId={hoveredId} setHoveredId={setHoveredId} />
        <IndustrialTank position={[8, 0, 0]} name="UV Disinfection" id="disinfection" color="#38bdf8" active={activeModules.disinfection} type="glass" onSelect={onSelectModule} hoveredId={hoveredId} setHoveredId={setHoveredId} />
        
        {/* EFFLUENT SENSOR */}
        <SensorNode position={[11, 0, 0]} name="EFFLUENT SENSOR" id="s2" isOutput={true} status={outputStatus} onSelect={onSelectModule} hoveredId={hoveredId} setHoveredId={setHoveredId} />
        
        {/* HUGE TREATED WATER TANK */}
        <StorageTank position={[14, 0, 0]} name="Treated Water Reservoir" waterColor={treatedWaterColor} />

        <PipeNetwork activeModules={activeModules} sensors={sensors} isSimulating={isSimulating} />
      </group>

      <OrbitControls 
        makeDefault 
        enablePan={true}
        panSpeed={1.5}
        enableZoom={true}
        minDistance={5}
        maxDistance={50}
        minPolarAngle={0} 
        maxPolarAngle={Math.PI / 2 - 0.05} 
        enableDamping 
        dampingFactor={0.05} 
        target={[0, 2, 0]}
      />
    </Canvas>
  );
}
