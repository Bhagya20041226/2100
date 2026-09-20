 import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/* =========================================================
   2100 SKY MOBILITY BACKGROUND
   - Flying vehicles scattered through the city
   - No side-to-side traffic layout
   - No road
   - No giant grid
   - Calm futuristic city
   ========================================================= */

/* ---------------------------------------------------------
   Responsive information
--------------------------------------------------------- */

function useResponsive() {
  const [size, setSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1440,
    height: typeof window !== "undefined" ? window.innerHeight : 900,
  });

  useEffect(() => {
    const update = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return size;
}

/* ---------------------------------------------------------
   Camera
--------------------------------------------------------- */

function CameraRig() {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 1.2, 15);
    camera.fov = 52;
    camera.near = 0.1;
    camera.far = 100;
    camera.lookAt(0, 0.7, -10);
    camera.updateProjectionMatrix();
  }, [camera]);

  useFrame(() => {
    camera.lookAt(0, 0.7, -10);
  });

  return null;
}

/* ---------------------------------------------------------
   Mouse parallax
--------------------------------------------------------- */

function MouseParallax() {
  const group = useRef();
  const target = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const move = (e) => {
      target.current.x = (e.clientX / window.innerWidth - 0.5) * 0.35;
      target.current.y = (e.clientY / window.innerHeight - 0.5) * 0.18;
    };

    window.addEventListener("mousemove", move);

    return () => window.removeEventListener("mousemove", move);
  }, []);

  useFrame(() => {
    if (!group.current) return;

    group.current.rotation.y +=
      (target.current.x - group.current.rotation.y) * 0.025;

    group.current.rotation.x +=
      (-target.current.y - group.current.rotation.x) * 0.025;
  });

  return <group ref={group} />;
}

/* ---------------------------------------------------------
   Futuristic building
--------------------------------------------------------- */

function Building({
  position,
  scale = 1,
  width = 1,
  height = 3,
  depth = 1,
  windows = true,
}) {
  const windowRows = Math.max(4, Math.floor(height * 2.2));
  const windowCols = Math.max(2, Math.floor(width * 2));

  const windowPositions = useMemo(() => {
    const items = [];

    for (let y = 0; y < windowRows; y++) {
      for (let x = 0; x < windowCols; x++) {
        if (Math.random() > 0.45) {
          items.push({
            x:
              -width / 2 +
              0.22 +
              (x / Math.max(1, windowCols - 1)) * (width - 0.44),
            y:
              -height / 2 +
              0.35 +
              (y / Math.max(1, windowRows - 1)) * (height - 0.7),
          });
        }
      }
    }

    return items;
  }, [width, height, windowRows, windowCols]);

  return (
    <group position={position} scale={scale}>
      {/* Main building */}
      <mesh castShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial
          color="#101827"
          roughness={0.72}
          metalness={0.28}
        />
      </mesh>

      {/* Glass face */}
      <mesh position={[0, 0, depth / 2 + 0.012]}>
        <boxGeometry args={[width * 0.84, height * 0.9, 0.025]} />
        <meshStandardMaterial
          color="#18283b"
          transparent
          opacity={0.62}
          roughness={0.25}
          metalness={0.45}
        />
      </mesh>

      {windows &&
        windowPositions.map((w, i) => (
          <mesh
            key={i}
            position={[w.x, w.y, depth / 2 + 0.035]}
          >
            <planeGeometry args={[0.075, 0.12]} />
            <meshBasicMaterial
              color={i % 5 === 0 ? "#4ac8ff" : "#8faac0"}
              transparent
              opacity={0.38}
            />
          </mesh>
        ))}

      {/* Roof antenna */}
      {height > 4 && (
        <group position={[0, height / 2 + 0.3, 0]}>
          <mesh>
            <cylinderGeometry args={[0.025, 0.025, 0.6, 8]} />
            <meshStandardMaterial
              color="#243449"
              metalness={0.7}
              roughness={0.3}
            />
          </mesh>

          <mesh position={[0, 0.3, 0]}>
            <sphereGeometry args={[0.055, 10, 10]} />
            <meshBasicMaterial color="#59d9ff" />
          </mesh>
        </group>
      )}
    </group>
  );
}

/* ---------------------------------------------------------
   City skyline
--------------------------------------------------------- */

function Skyline() {
  const buildings = useMemo(
    () => [
      [-7.2, 1.8, -23, 1.2, 4.2, 1.4],
      [-5.8, 2.8, -27, 1.5, 6.4, 1.7],
      [-4.4, 1.4, -25, 1.0, 3.4, 1.2],
      [-2.9, 3.4, -30, 1.8, 7.5, 1.8],

      [7.0, 2.1, -24, 1.4, 4.8, 1.5],
      [5.8, 3.2, -29, 1.7, 7.1, 1.8],
      [4.3, 1.6, -26, 1.1, 3.8, 1.3],
      [2.8, 2.9, -32, 1.5, 6.4, 1.6],
    ],
    []
  );

  return (
    <group>
      {buildings.map((b, i) => (
        <Building
          key={i}
          position={[b[0], b[3] / 2 - 1.5, b[2]]}
          width={b[3]}
          height={b[4]}
          depth={b[5]}
        />
      ))}

      {/* Distant skyline */}
      <mesh position={[0, -0.4, -36]}>
        <boxGeometry args={[30, 4, 1]} />
        <meshStandardMaterial
          color="#0a111d"
          roughness={1}
          metalness={0}
        />
      </mesh>
    </group>
  );
}

/* ---------------------------------------------------------
   Air Taxi
--------------------------------------------------------- */

function AirTaxi({ position, rotation = [0, 0, 0], scale = 1 }) {
  const group = useRef();

  useFrame((state) => {
    if (!group.current) return;

    const t = state.clock.elapsedTime;

    group.current.position.y =
      position[1] + Math.sin(t * 0.7 + position[0]) * 0.055;

    group.current.rotation.z =
      rotation[2] + Math.sin(t * 0.55) * 0.025;
  });

  return (
    <group
      ref={group}
      position={position}
      rotation={rotation}
      scale={scale}
    >
      {/* Main body */}
      <mesh castShadow>
        <capsuleGeometry args={[0.42, 1.65, 8, 16]} />
        <meshStandardMaterial
          color="#c8d4df"
          metalness={0.72}
          roughness={0.24}
        />
      </mesh>

      {/* Cabin */}
      <mesh position={[0, 0.05, 0.15]} scale={[0.72, 0.45, 0.52]}>
        <sphereGeometry args={[0.62, 20, 12]} />
        <meshStandardMaterial
          color="#10243a"
          metalness={0.55}
          roughness={0.16}
          transparent
          opacity={0.96}
        />
      </mesh>

      {/* Cabin glass highlight */}
      <mesh position={[0, 0.12, 0.47]} scale={[0.42, 0.2, 0.06]}>
        <sphereGeometry args={[0.5, 16, 8]} />
        <meshBasicMaterial
          color="#62dfff"
          transparent
          opacity={0.22}
        />
      </mesh>

      {/* Wings */}
      <mesh position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[1.8, 0.08, 0.42]} />
        <meshStandardMaterial
          color="#8d9baa"
          metalness={0.75}
          roughness={0.28}
        />
      </mesh>

      {/* Rotor pods */}
      {[-0.72, 0.72].map((x, i) => (
        <group key={i} position={[x, 0.1, 0]}>
          <mesh>
            <cylinderGeometry args={[0.17, 0.17, 0.07, 16]} />
            <meshStandardMaterial
              color="#182331"
              metalness={0.75}
              roughness={0.25}
            />
          </mesh>

          <mesh position={[0, 0.06, 0]}>
            <torusGeometry args={[0.19, 0.018, 8, 24]} />
            <meshBasicMaterial
              color="#54d9ff"
              transparent
              opacity={0.65}
            />
          </mesh>
        </group>
      ))}

      {/* Navigation lights */}
      <mesh position={[-0.86, 0.04, 0]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshBasicMaterial color="#6ce5ff" />
      </mesh>

      <mesh position={[0.86, 0.04, 0]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshBasicMaterial color="#a879ff" />
      </mesh>
    </group>
  );
}

/* ---------------------------------------------------------
   Delivery Drone
--------------------------------------------------------- */

function DeliveryDrone({
  position,
  scale = 1,
  rotation = [0, 0, 0],
}) {
  const group = useRef();

  useFrame((state) => {
    if (!group.current) return;

    const t = state.clock.elapsedTime;

    group.current.position.y =
      position[1] + Math.sin(t * 0.9 + position[2]) * 0.08;

    group.current.rotation.y += 0.0015;
  });

  const rotors = [
    [-0.62, 0.12, -0.48],
    [0.62, 0.12, -0.48],
    [-0.62, 0.12, 0.48],
    [0.62, 0.12, 0.48],
  ];

  return (
    <group
      ref={group}
      position={position}
      rotation={rotation}
      scale={scale}
    >
      {/* Central body */}
      <mesh castShadow>
        <boxGeometry args={[0.75, 0.28, 0.82]} />
        <meshStandardMaterial
          color="#273343"
          metalness={0.65}
          roughness={0.28}
        />
      </mesh>

      {/* Camera/sensor */}
      <mesh position={[0, -0.17, 0]}>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshBasicMaterial color="#65ddff" />
      </mesh>

      {/* Payload */}
      <mesh position={[0, -0.32, 0]}>
        <boxGeometry args={[0.35, 0.22, 0.35]} />
        <meshStandardMaterial
          color="#465466"
          metalness={0.35}
          roughness={0.45}
        />
      </mesh>

      {rotors.map((p, i) => (
        <group key={i} position={p}>
          {/* Arm */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.025, 0.025, 0.65, 8]} />
            <meshStandardMaterial
              color="#697789"
              metalness={0.7}
              roughness={0.25}
            />
          </mesh>

          {/* Rotor ring */}
          <mesh position={[0, 0.12, 0]}>
            <torusGeometry args={[0.19, 0.018, 8, 20]} />
            <meshBasicMaterial
              color="#6acfff"
              transparent
              opacity={0.55}
            />
          </mesh>

          {/* Rotor center */}
          <mesh position={[0, 0.12, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.04, 8]} />
            <meshBasicMaterial color="#8be8ff" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ---------------------------------------------------------
   Autonomous flying pod
--------------------------------------------------------- */

function FlyingPod({
  position,
  scale = 1,
  rotation = [0, 0, 0],
}) {
  const group = useRef();

  useFrame((state) => {
    if (!group.current) return;

    const t = state.clock.elapsedTime;

    group.current.position.y =
      position[1] + Math.sin(t * 0.65 + position[0]) * 0.05;

    group.current.rotation.z =
      Math.sin(t * 0.45 + position[2]) * 0.02;
  });

  return (
    <group
      ref={group}
      position={position}
      rotation={rotation}
      scale={scale}
    >
      {/* Main capsule */}
      <mesh castShadow>
        <capsuleGeometry args={[0.34, 1.25, 8, 16]} />
        <meshStandardMaterial
          color="#aab8c6"
          metalness={0.75}
          roughness={0.25}
        />
      </mesh>

      {/* Glass */}
      <mesh position={[0, 0.02, 0.35]} scale={[0.7, 0.55, 0.3]}>
        <sphereGeometry args={[0.5, 18, 10]} />
        <meshStandardMaterial
          color="#0b1e31"
          metalness={0.55}
          roughness={0.14}
        />
      </mesh>

      {/* Bottom light */}
      <mesh position={[0, -0.34, 0]}>
        <sphereGeometry args={[0.045, 10, 10]} />
        <meshBasicMaterial color="#72dcff" />
      </mesh>

      {/* Side stabilizers */}
      <mesh position={[-0.52, 0, 0]}>
        <boxGeometry args={[0.5, 0.055, 0.28]} />
        <meshStandardMaterial
          color="#5e6b7a"
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>

      <mesh position={[0.52, 0, 0]}>
        <boxGeometry args={[0.5, 0.055, 0.28]} />
        <meshStandardMaterial
          color="#5e6b7a"
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>
    </group>
  );
}

/* ---------------------------------------------------------
   Floating navigation beacon
--------------------------------------------------------- */

function NavigationBeacon({ position, scale = 1 }) {
  const group = useRef();

  useFrame((state) => {
    if (!group.current) return;

    group.current.rotation.y = state.clock.elapsedTime * 0.25;
  });

  return (
    <group ref={group} position={position} scale={scale}>
      <mesh>
        <torusGeometry args={[0.38, 0.018, 8, 32]} />
        <meshBasicMaterial
          color="#5edcff"
          transparent
          opacity={0.45}
        />
      </mesh>

      <mesh>
        <sphereGeometry args={[0.055, 12, 12]} />
        <meshBasicMaterial color="#71e4ff" />
      </mesh>
    </group>
  );
}

/* ---------------------------------------------------------
   Soft clouds / atmosphere
--------------------------------------------------------- */

function Atmosphere() {
  const particles = useMemo(() => {
    const arr = [];

    for (let i = 0; i < 80; i++) {
      arr.push([
        (Math.random() - 0.5) * 28,
        Math.random() * 10 - 1,
        -8 - Math.random() * 30,
        0.015 + Math.random() * 0.035,
      ]);
    }

    return arr;
  }, []);

  return (
    <group>
      {particles.map((p, i) => (
        <mesh key={i} position={[p[0], p[1], p[2]]}>
          <sphereGeometry args={[p[3], 6, 6]} />
          <meshBasicMaterial
            color="#78b8d6"
            transparent
            opacity={0.13}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ---------------------------------------------------------
   Subtle flight glow
--------------------------------------------------------- */

function FlightGlow({ position, scale = 1 }) {
  return (
    <mesh position={position} scale={scale}>
      <sphereGeometry args={[0.45, 16, 16]} />
      <meshBasicMaterial
        color="#37bde9"
        transparent
        opacity={0.025}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

/* ---------------------------------------------------------
   Main flying transportation layout
--------------------------------------------------------- */

function FlyingTransportation() {
  return (
    <group>
      {/* BACK / FAR TRAFFIC */}

      <AirTaxi
        position={[-4.8, 4.3, -15]}
        rotation={[0.02, -0.35, 0.04]}
        scale={0.72}
      />

      <DeliveryDrone
        position={[3.9, 4.8, -17]}
        rotation={[0.02, 0.5, -0.02]}
        scale={0.58}
      />

      <FlyingPod
        position={[1.3, 5.7, -21]}
        rotation={[0, -0.4, 0]}
        scale={0.55}
      />

      {/* MIDDLE LAYER */}

      <DeliveryDrone
        position={[-2.7, 2.9, -10]}
        rotation={[0, 0.25, 0.03]}
        scale={0.72}
      />

      <AirTaxi
        position={[4.8, 2.4, -13]}
        rotation={[0, 0.5, -0.02]}
        scale={0.9}
      />

      <FlyingPod
        position={[-0.2, 4.8, -14]}
        rotation={[0, -0.2, 0]}
        scale={0.72}
      />

      {/* FOREGROUND */}

      <DeliveryDrone
        position={[4.1, 0.8, -7]}
        rotation={[0.02, -0.35, 0.03]}
        scale={0.9}
      />

      <AirTaxi
        position={[-4.4, 0.9, -8]}
        rotation={[0, 0.25, 0.025]}
        scale={1.0}
      />

      <FlyingPod
        position={[2.1, -0.2, -6]}
        rotation={[0, 0.45, 0]}
        scale={0.78}
      />

      {/* SMALL DISTANT OBJECTS */}

      <DeliveryDrone
        position={[-6.2, 5.5, -24]}
        scale={0.38}
      />

      <FlyingPod
        position={[6.3, 5.8, -25]}
        scale={0.4}
      />

      {/* Soft glows */}

      <FlightGlow position={[-4.8, 4.3, -15]} scale={1.4} />
      <FlightGlow position={[4.8, 2.4, -13]} scale={1.5} />
      <FlightGlow position={[4.1, 0.8, -7]} scale={1.3} />

      {/* Navigation markers */}

      <NavigationBeacon
        position={[-6.1, 3.0, -17]}
        scale={0.8}
      />

      <NavigationBeacon
        position={[5.9, 3.8, -20]}
        scale={0.65}
      />
    </group>
  );
}

/* ---------------------------------------------------------
   Scene
--------------------------------------------------------- */

function Scene() {
  return (
    <>
      <CameraRig />

      <ambientLight intensity={0.55} />

      <directionalLight
        position={[4, 8, 8]}
        intensity={1.15}
        color="#c8e9ff"
      />

      <pointLight
        position={[-4, 4, 4]}
        intensity={3}
        distance={18}
        color="#2588c9"
      />

      <pointLight
        position={[5, 2, -5]}
        intensity={2}
        distance={15}
        color="#7045b5"
      />

      <fog attach="fog" args={["#07101d", 14, 48]} />

      <MouseParallax />

      <group>
        <Skyline />
        <FlyingTransportation />
        <Atmosphere />
      </group>
    </>
  );
}

/* ---------------------------------------------------------
   HTML overlay
--------------------------------------------------------- */

function BackgroundOverlay() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        background: `
          radial-gradient(
            ellipse at center,
            rgba(4,10,18,0.02) 0%,
            rgba(4,10,18,0.08) 48%,
            rgba(4,8,15,0.32) 100%
          )
        `,
      }}
    />
  );
}

/* ---------------------------------------------------------
   Main component
--------------------------------------------------------- */

export default function Background3D() {
  const { width } = useResponsive();

  const isMobile = width < 768;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
        background: "#050a13",
        zIndex: 0,
      }}
    >
      <Canvas
        dpr={isMobile ? [1, 1.2] : [1, 1.5]}
        camera={{
          position: [0, 1.2, 15],
          fov: 52,
          near: 0.1,
          far: 100,
        }}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          alpha: false,
        }}
      >
        <color attach="background" args={["#050a13"]} />

        <Scene />
      </Canvas>

      <BackgroundOverlay />
    </div>
  );
}
