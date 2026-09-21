/* The one place a 3D scene earns its keep: the sign-in canvas.
   A contour field, the way a topographic map or a stack of traces reads.
   Decorative only: aria-hidden, skipped entirely under prefers-reduced-motion,
   paused when the tab is hidden, and never loaded by the clinical app. */
import { useEffect, useRef } from 'react';

const LINES = 46;   // contours front to back
const STEPS = 112;  // samples along each contour
const SPAN_X = 40;
const SPAN_Z = 34;

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
      const camera = new THREE.PerspectiveCamera(46, el.clientWidth / el.clientHeight, 0.1, 200);
      // Looking down the field rather than along it, so the contours spread
      // across the frame instead of bunching at the horizon.
      camera.position.set(3, 11.5, 19);
      camera.lookAt(0, -0.5, -5);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setSize(el.clientWidth, el.clientHeight);
      el.appendChild(renderer.domElement);

      /* One geometry for every contour, drawn as a single LineSegments: one
         draw call, and the height field lives in the vertex shader so the
         animation costs no JavaScript per frame. */
      const verts = [];
      const rows = [];
      for (let l = 0; l < LINES; l++) {
        const v = l / (LINES - 1);
        const z = (v - 0.5) * SPAN_Z;
        for (let s = 0; s < STEPS - 1; s++) {
          const a = (s / (STEPS - 1) - 0.5) * SPAN_X;
          const b = ((s + 1) / (STEPS - 1) - 0.5) * SPAN_X;
          verts.push(a, 0, z, b, 0, z);
          rows.push(v, v);
        }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
      geo.setAttribute('aRow', new THREE.Float32BufferAttribute(rows, 1));

      const uniforms = {
        uTime:  { value: 0 },
        uNear:  { value: new THREE.Color('#15803E') },
        uFar:   { value: new THREE.Color('#8FC6A6') },
      };

      const mat = new THREE.ShaderMaterial({
        uniforms,
        transparent: true,
        depthWrite: false,
        // Normal blending, not additive: on a light canvas additive washes
        // straight out to white.
        blending: THREE.NormalBlending,
        vertexShader: `
          uniform float uTime;
          attribute float aRow;
          varying float vRow;
          varying float vEdge;
          void main() {
            vRow = aRow;
            vec3 p = position;
            float x = p.x * 0.11;
            float z = p.z * 0.16;
            // Three drifting waves at different rates read as terrain rather
            // than as one obvious sine.
            float h = sin(x + uTime * 0.28) * 2.10
                    + sin(x * 0.47 - z * 0.80 + uTime * 0.19) * 1.55
                    + sin(z * 1.10 + uTime * 0.13) * 0.90;
            // Settle the field toward the horizon so the top stays quiet.
            p.y = h * (0.42 + aRow * 1.25);
            vEdge = smoothstep(0.0, 0.16, 0.5 - abs(position.x) / ${SPAN_X.toFixed(1)});
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
          }`,
        fragmentShader: `
          uniform vec3 uNear;
          uniform vec3 uFar;
          varying float vRow;
          varying float vEdge;
          void main() {
            vec3 c = mix(uFar, uNear, pow(vRow, 1.6));
            float a = (0.12 + pow(vRow, 1.25) * 0.62) * vEdge;
            gl_FragColor = vec4(c, a);
          }`,
      });

      const field = new THREE.LineSegments(geo, mat);
      field.rotation.y = -0.20;
      scene.add(field);

      let paused = document.hidden;
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

      const start = performance.now();
      const tick = () => {
        raf = requestAnimationFrame(tick);
        if (paused) return;
        uniforms.uTime.value = (performance.now() - start) / 1000;
        renderer.render(scene, camera);
      };
      tick();

      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        document.removeEventListener('visibilitychange', onVis);
        geo.dispose();
        mat.dispose();
        renderer.dispose();
        if (renderer.domElement.parentNode) renderer.domElement.remove();
      };
    }).catch(() => { /* decorative only, a failure must not block sign-in */ });

    return () => { alive = false; cleanup(); };
  }, []);

  return <div className="brand-scene" ref={host} aria-hidden="true" />;
}
