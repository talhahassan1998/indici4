/* The one place a 3D scene earns its keep: the sign-in brand panel.
   Slowly drifting depth layers, rendered small and paused when the tab is
   hidden. It is decorative only — aria-hidden, skipped entirely under
   prefers-reduced-motion, and never loaded by the clinical app. */
import { useEffect, useRef } from 'react';

export default function BrandScene() {
  const host = useRef(null);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !host.current) return;

    let raf, renderer, cleanup = () => {};
    let alive = true;

    // Loaded on demand so three never enters the main app bundle.
    import('three').then(THREE => {
      if (!alive || !host.current) return;
      const el = host.current;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(55, el.clientWidth / el.clientHeight, 0.1, 100);
      camera.position.z = 16;

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setSize(el.clientWidth, el.clientHeight);
      el.appendChild(renderer.domElement);

      // Concentric rings on separate planes — a contour reading, not a blob.
      const group = new THREE.Group();
      const ringColor = new THREE.Color('#7FC79A');
      for (let i = 0; i < 9; i++) {
        const r = 2.2 + i * 1.15;
        const geo = new THREE.TorusGeometry(r, 0.012, 8, 220);
        const mat = new THREE.MeshBasicMaterial({
          color: ringColor, transparent: true, opacity: 0.30 - i * 0.026,
        });
        const ring = new THREE.Mesh(geo, mat);
        ring.position.z = -i * 0.75;
        ring.userData.spin = (i % 2 ? 1 : -1) * (0.016 + i * 0.002);
        group.add(ring);
      }
      group.rotation.x = 0.62;
      group.rotation.z = -0.2;
      scene.add(group);

      // A sparse particle field for depth.
      const count = 220;
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        pos[i * 3] = (Math.random() - 0.5) * 34;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 22;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 14 - 4;
      }
      const pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const dust = new THREE.Points(pGeo, new THREE.PointsMaterial({
        color: '#B7CFBE', size: 0.055, transparent: true, opacity: 0.5,
      }));
      scene.add(dust);

      let t = 0, paused = document.hidden;
      const onVis = () => { paused = document.hidden; };
      document.addEventListener('visibilitychange', onVis);

      const onResize = () => {
        if (!el.clientWidth) return;
        camera.aspect = el.clientWidth / el.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(el.clientWidth, el.clientHeight);
      };
      const ro = new ResizeObserver(onResize);
      ro.observe(el);

      const tick = () => {
        raf = requestAnimationFrame(tick);
        if (paused) return;
        t += 0.004;
        group.children.forEach(r => { r.rotation.z += r.userData.spin * 0.05; });
        group.rotation.y = Math.sin(t) * 0.16;
        group.rotation.x = 0.62 + Math.cos(t * 0.7) * 0.05;
        dust.rotation.y = t * 0.06;
        renderer.render(scene, camera);
      };
      tick();

      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        document.removeEventListener('visibilitychange', onVis);
        scene.traverse(o => { o.geometry?.dispose(); o.material?.dispose(); });
        renderer.dispose();
        if (renderer.domElement.parentNode) renderer.domElement.remove();
      };
    }).catch(() => { /* decorative only — a failure must not block sign-in */ });

    return () => { alive = false; cleanup(); };
  }, []);

  return <div className="brand-scene" ref={host} aria-hidden="true" />;
}
