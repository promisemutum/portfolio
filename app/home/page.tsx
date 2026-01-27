'use client';

import { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import * as THREE from 'three';

const LOW_RES_BASE = '/images/optimized/1_nobg_lowres.png';
const LOW_RES_TOP = '/images/optimized/2_nobg_lowres.png';
const HIGH_RES_BASE = '/images/optimized/1_nobg.png';
const HIGH_RES_BASE_NORMAL = '/images/optimized/1_normal.png';
const HIGH_RES_TOP = '/images/optimized/2_nobg.png';
const BASE_IMAGE_ASPECT = 1536 / 1024;

export default function HomePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const baseCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isHighResReady, setIsHighResReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let rafId = 0;
    let latestX = 0;
    let latestY = 0;

    const updateMask = () => {
      container.style.setProperty('--x', `${latestX}px`);
      container.style.setProperty('--y', `${latestY}px`);
      rafId = 0;
    };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      latestX = e.clientX - rect.left;
      latestY = e.clientY - rect.top;

      if (rafId === 0) {
        rafId = window.requestAnimationFrame(updateMask);
      }
    };

    container.addEventListener('pointermove', handlePointerMove, { passive: true });

    return () => {
      container.removeEventListener('pointermove', handlePointerMove);
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const topImage = new window.Image();
    topImage.src = HIGH_RES_TOP;
    topImage.onload = () => {
      if (isMounted) {
        setIsHighResReady(true);
      }
    };

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const canvas = baseCanvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 2;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    const pointLight = new THREE.PointLight(0xffffff, 1.8, 10);
    pointLight.position.set(0.5, 0.7, 2.5);
    scene.add(ambientLight, pointLight);

    let disposed = false;
    let currentAspect = 1;

    const updateCover = (texture: THREE.Texture | null, aspect: number) => {
      if (!texture || !Number.isFinite(aspect)) return;
      const ratio = aspect / BASE_IMAGE_ASPECT;

      if (ratio > 1) {
        const vRepeat = 1 / ratio;
        texture.repeat.set(1, vRepeat);
        texture.offset.set(0, (1 - vRepeat) / 2);
      } else {
        texture.repeat.set(ratio, 1);
        texture.offset.set((1 - ratio) / 2, 0);
      }

      texture.needsUpdate = true;
    };

    const render = () => {
      renderer.render(scene, camera);
    };

    const loader = new THREE.TextureLoader();

    const configureColorTexture = (texture: THREE.Texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      updateCover(texture, currentAspect);
    };

    const baseTexture = loader.load(LOW_RES_BASE, (texture) => {
      if (disposed) {
        texture.dispose();
        return;
      }
      configureColorTexture(texture);
      render();
    });

    const baseAlphaTexture = loader.load(LOW_RES_BASE, (texture) => {
      if (disposed) {
        texture.dispose();
        return;
      }
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      updateCover(texture, currentAspect);
      render();
    });

    configureColorTexture(baseTexture);

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.MeshPhongMaterial({
      map: baseTexture,
      alphaMap: baseAlphaTexture,
      transparent: true,
      side: THREE.DoubleSide,
    });
    material.shininess = 30;

    const plane = new THREE.Mesh(geometry, material);
    scene.add(plane);

    const updateSize = () => {
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;
      currentAspect = width / height;

      renderer.setSize(width, height, false);
      camera.left = -currentAspect;
      camera.right = currentAspect;
      camera.top = 1;
      camera.bottom = -1;
      camera.updateProjectionMatrix();

      plane.scale.set(currentAspect, 1, 1);
      updateCover(material.map, currentAspect);
      updateCover(material.alphaMap, currentAspect);
      updateCover(material.normalMap, currentAspect);
      render();
    };

    const setColorMap = (texture: THREE.Texture) => {
      configureColorTexture(texture);

      const previous = material.map;
      material.map = texture;
      material.needsUpdate = true;
      if (previous && previous !== texture) {
        previous.dispose();
      }
    };

    const setAlphaMap = (texture: THREE.Texture) => {
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      updateCover(texture, currentAspect);

      const previous = material.alphaMap;
      material.alphaMap = texture;
      material.needsUpdate = true;
      if (previous && previous !== texture) {
        previous.dispose();
      }
    };

    const setNormalMap = (texture: THREE.Texture) => {
      updateCover(texture, currentAspect);

      const previous = material.normalMap;
      material.normalMap = texture;
      material.needsUpdate = true;
      if (previous && previous !== texture) {
        previous.dispose();
      }
    };

    const loadTexture = (url: string, onLoad: (texture: THREE.Texture) => void) => {
      loader.load(url, (texture) => {
        if (disposed) {
          texture.dispose();
          return;
        }
        onLoad(texture);
        render();
      });
    };

    updateSize();
    loadTexture(HIGH_RES_BASE, setColorMap);
    loadTexture(HIGH_RES_BASE, setAlphaMap);
    loadTexture(HIGH_RES_BASE_NORMAL, setNormalMap);

    window.addEventListener('resize', updateSize);

    return () => {
      disposed = true;
      window.removeEventListener('resize', updateSize);

      if (material.map) {
        material.map.dispose();
      }
      if (material.alphaMap && material.alphaMap !== material.map) {
        material.alphaMap.dispose();
      }
      if (material.normalMap) {
        material.normalMap.dispose();
      }
      material.dispose();
      geometry.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <main className="mask-container" ref={containerRef}>
      
      {/* 2.png: The "Top" Layer (Revealed by Mask) */}
      <div className="image-wrapper colored-image">
        <Image
          src={isHighResReady ? HIGH_RES_TOP : LOW_RES_TOP}
          alt="Revealed Image"
          fill
          sizes="100vw"
        />
      </div>

      {/* 1.png: The "Base" Layer (Always Visible) */}
      <div className="image-wrapper bw-image">
        <canvas ref={baseCanvasRef} />
      </div>

    </main>
  );
}
