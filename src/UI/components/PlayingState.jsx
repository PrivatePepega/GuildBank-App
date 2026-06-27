import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function PlayingState({ gameName }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    const width = mount.clientWidth;
    const height = mount.clientHeight;

    // ── Scene setup ───────────────────────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 3;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0); // transparent bg
    mount.appendChild(renderer.domElement);

    // ── Outer ring ────────────────────────────────────────────
    const outerGeo = new THREE.TorusGeometry(1, 0.04, 16, 100);
    const outerMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 }); // yellow-400
    const outerRing = new THREE.Mesh(outerGeo, outerMat);
    scene.add(outerRing);

    // ── Middle ring ───────────────────────────────────────────
    const middleGeo = new THREE.TorusGeometry(0.7, 0.03, 16, 100);
    const middleMat = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.3, transparent: true });
    const middleRing = new THREE.Mesh(middleGeo, middleMat);
    middleRing.rotation.x = Math.PI / 3;
    scene.add(middleRing);

    // ── Inner ring ────────────────────────────────────────────
    const innerGeo = new THREE.TorusGeometry(0.4, 0.02, 16, 100);
    const innerMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24, opacity: 0.5, transparent: true });
    const innerRing = new THREE.Mesh(innerGeo, innerMat);
    innerRing.rotation.y = Math.PI / 4;
    scene.add(innerRing);

    // ── Orbiting particles ────────────────────────────────────
    const particles = [];
    const particleGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const particleMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });

    for (let i = 0; i < 6; i++) {
      const particle = new THREE.Mesh(particleGeo, particleMat);
      scene.add(particle);
      particles.push({ mesh: particle, angle: (i / 6) * Math.PI * 2, speed: 0.02 + i * 0.003 });
    }

    // ── Animation loop ────────────────────────────────────────
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      outerRing.rotation.z += 0.008;
      outerRing.rotation.x += 0.003;

      middleRing.rotation.z -= 0.012;
      middleRing.rotation.y += 0.005;

      innerRing.rotation.x += 0.015;
      innerRing.rotation.z -= 0.008;

      // Orbit particles around the outer ring
      particles.forEach((p) => {
        p.angle += p.speed;
        p.mesh.position.x = Math.cos(p.angle) * 1;
        p.mesh.position.y = Math.sin(p.angle) * 1;
        p.mesh.position.z = Math.sin(p.angle * 0.5) * 0.3;
      });

      renderer.render(scene, camera);
    };
    animate();

    // ── Cleanup ───────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-4">
      {/* Three.js canvas */}
      <div ref={mountRef} className="w-48 h-48" />

      {/* Status text */}
      <div className="flex flex-col items-center gap-2">
        <p className="text-white font-semibold text-lg">{gameName} is running</p>
        <p className="text-gray-400 text-sm">Tracking your session...</p>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}