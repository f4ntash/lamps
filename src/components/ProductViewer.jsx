import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { COLORS } from "./ColorSelector.jsx";

const BULB_NAME_PARTS = [
  "bulb",
  "bombilla",
  "foco",
  "led",
  "emissive",
  "emission",
];

const LIGHT_HEIGHT_RATIO = 0.88;
const SHOW_LIGHT_HELPER = false;

const WARM_LIGHT_COLOR = new THREE.Color("#ffd29b");
const NEUTRAL_LIGHT_COLOR = new THREE.Color("#fff4e0");

const LIGHT_COLORS = {
  warm: WARM_LIGHT_COLOR,
  neutral: NEUTRAL_LIGHT_COLOR,
};

function disposeMaterial(material, disposedResources) {
  if (!material || disposedResources.has(material)) return;

  Object.values(material).forEach((value) => {
    if (value?.isTexture && !disposedResources.has(value)) {
      value.dispose();
      disposedResources.add(value);
    }
  });

  material.dispose();
  disposedResources.add(material);
}

function disposeModel(model) {
  const disposedResources = new Set();

  model.traverse((object) => {
    if (!object.isMesh) return;

    if (object.geometry && !disposedResources.has(object.geometry)) {
      object.geometry.dispose();
      disposedResources.add(object.geometry);
    }

    if (Array.isArray(object.material)) {
      object.material.forEach((material) =>
        disposeMaterial(material, disposedResources),
      );
      return;
    }

    disposeMaterial(object.material, disposedResources);
  });
}

function applyLightState(rig, { isLightOn, lightColor, intensity }) {
  if (!rig) return;

  const fallbackColor = COLORS.find((color) => color.id === lightColor);
  const selectedColor =
    LIGHT_COLORS[lightColor] ?? new THREE.Color(fallbackColor?.three ?? COLORS[0].three);
  const normalizedIntensity = isLightOn
    ? THREE.MathUtils.clamp(intensity / 100, 0, 1)
    : 0;

  rig.lampPoint.color.copy(selectedColor);
  rig.lampSpot.color.copy(selectedColor);

  rig.lampPoint.intensity = normalizedIntensity * 1.5;
  rig.lampSpot.intensity = normalizedIntensity * 18;

  rig.emissiveMaterials.forEach((material) => {
    material.emissive.copy(selectedColor);
    material.emissiveIntensity = normalizedIntensity * 2.5;
  });
}

export default function ProductViewer({ isLightOn, lightColor, intensity, modelUrl }) {
  const mountRef = useRef(null);
  const lightRigRef = useRef(null);
  const controlsRef = useRef({ isLightOn, lightColor, intensity });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    let isMounted = true;
    let loadedModel = null;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111318);

    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.set(3.5, 2.5, 6);
    camera.lookAt(0, 1.9, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.2;

    controls.enableRotate = true;
    controls.enableZoom = true;
    controls.enablePan = false;

    controls.minDistance = 1;
    controls.maxDistance = 15;

    controls.minPolarAngle = Math.PI * 0.25;
    controls.maxPolarAngle = Math.PI * 0.58;

    controls.rotateSpeed = 0.5;
    controls.zoomSpeed = 1.2;

    controls.target.set(0, 1, 0);

    camera.position.set(0, 1.5, 5);

    controls.update();

    const group = new THREE.Group();
    scene.add(group);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(4.2, 96),
      new THREE.MeshStandardMaterial({
        color: 0x191c22,
        roughness: 0.72,
        metalness: 0.05,
      }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const ambient = new THREE.HemisphereLight(0xf7efe3, 0x161921, 0.65);
    scene.add(ambient);

    const key = new THREE.DirectionalLight(0xffffff, 3);
    key.position.set(4, 5, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xb7c7ff, 0);
    fill.position.set(-3, 2.5, 3);
    scene.add(fill);

    const lampPoint = new THREE.PointLight(0xffd29b, 0, 2.2, 2);
    lampPoint.castShadow = true;
    group.add(lampPoint);

    const spotTarget = new THREE.Object3D();
    group.add(spotTarget);

    const lampSpot = new THREE.SpotLight(0xffd29b, 0, 8, Math.PI / 5.5, 0.45, 1.8);
    lampSpot.target = spotTarget;
    lampSpot.castShadow = true;
    lampSpot.shadow.mapSize.width = 2048;
    lampSpot.shadow.mapSize.height = 2048;
    lampSpot.shadow.bias = -0.0005;
    lampSpot.shadow.normalBias = 0.02;
    group.add(lampSpot);

    const spotHelper = SHOW_LIGHT_HELPER ? new THREE.SpotLightHelper(lampSpot) : null;
    if (spotHelper) {
      scene.add(spotHelper);
    }

    lightRigRef.current = {
      lampPoint,
      lampSpot,
      emissiveMaterials: [],
    };

    const fitCameraToModel = (model) => {
      const fittedBox = new THREE.Box3().setFromObject(model);
      const fittedSize = fittedBox.getSize(new THREE.Vector3());
      const fittedCenter = fittedBox.getCenter(new THREE.Vector3());
      const verticalFov = THREE.MathUtils.degToRad(camera.fov);
      const horizontalFov =
        2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect);
      const distanceByHeight = fittedSize.y / 2 / Math.tan(verticalFov / 2);
      const distanceByWidth = fittedSize.x / 2 / Math.tan(horizontalFov / 2);
      const cameraDistance =
        Math.max(distanceByHeight, distanceByWidth, fittedSize.z) * 1.15;

      camera.position.set(
        cameraDistance * 0.65,
        fittedCenter.y + fittedSize.y * 0.05,
        cameraDistance * 1.25,
      );
      camera.lookAt(fittedCenter);
      camera.near = Math.max(0.01, cameraDistance / 100);
      camera.far = cameraDistance * 100;
      camera.updateProjectionMatrix();
      controls.target.copy(fittedCenter);
      controls.update();
    };

    const placeLampLights = (model) => {
      const fittedBox = new THREE.Box3().setFromObject(model);
      const fittedSize = fittedBox.getSize(new THREE.Vector3());
      const fittedCenter = fittedBox.getCenter(new THREE.Vector3());
      // Ajustar entre 0.82 y 0.95 según la posición real del foco en el GLB.
      const lightY = fittedBox.min.y + fittedSize.y * LIGHT_HEIGHT_RATIO;
      const lightPosition = new THREE.Vector3(
        fittedCenter.x,
        lightY,
        fittedCenter.z,
      );

      lampPoint.position.copy(lightPosition);
      lampSpot.position.copy(lightPosition);
      spotTarget.position.set(fittedCenter.x, fittedBox.min.y, fittedCenter.z);
      spotTarget.updateMatrixWorld();
    };

    const normalizeModel = (model) => {
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      model.position.x -= center.x;
      model.position.y -= box.min.y;
      model.position.z -= center.z;

      const maxDimension = Math.max(size.x, size.y, size.z);
      const desiredSize = 3.2;
      const modelScale = desiredSize / maxDimension;

      model.scale.setScalar(modelScale);
      model.updateMatrixWorld(true);

      const fittedBox = new THREE.Box3().setFromObject(model);
      const fittedCenter = fittedBox.getCenter(new THREE.Vector3());

      model.position.x -= fittedCenter.x;
      model.position.y -= fittedBox.min.y;
      model.position.z -= fittedCenter.z;
      model.updateMatrixWorld(true);
    };

    const findEmissiveMaterials = (model) => {
      const materials = new Set();

      model.traverse((object) => {
        if (!object.isMesh) return;

        object.castShadow = true;
        object.receiveShadow = true;

        const meshName = object.name.toLowerCase();
        const materialName = Array.isArray(object.material)
          ? object.material
              .map((material) => material?.name ?? "")
              .join(" ")
              .toLowerCase()
          : (object.material?.name ?? "").toLowerCase();
        const searchableName = `${meshName} ${materialName}`;
        const isPossibleBulb = BULB_NAME_PARTS.some((part) =>
          searchableName.includes(part),
        );

        if (!isPossibleBulb) return;

        if (Array.isArray(object.material)) {
          object.material.forEach((material) => {
            if (material?.emissive) materials.add(material);
          });
          return;
        }

        if (object.material?.emissive) {
          materials.add(object.material);
        }
      });

      return [...materials];
    };

    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        if (!isMounted) {
          disposeModel(gltf.scene);
          return;
        }

        const model = gltf.scene;
        normalizeModel(model);
        group.add(model);
        loadedModel = model;

        lightRigRef.current.emissiveMaterials = findEmissiveMaterials(model);
        placeLampLights(model);
        fitCameraToModel(model);
        applyLightState(lightRigRef.current, controlsRef.current);
      },
      undefined,
      (error) => {
        console.error("No se pudo cargar el modelo GLB:", error);
      },
    );

    const resize = () => {
      const { width, height } = mount.getBoundingClientRect();
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      if (loadedModel) {
        fitCameraToModel(loadedModel);
      }
    };

    let animationFrame = 0;
    const animate = () => {
      controls.update();
      spotHelper?.update();
      renderer.render(scene, camera);
      animationFrame = window.requestAnimationFrame(animate);
    };

    resize();
    animate();
    window.addEventListener("resize", resize);

    return () => {
      isMounted = false;
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);

      if (loadedModel) {
        group.remove(loadedModel);
        disposeModel(loadedModel);
      }

      floor.geometry.dispose();
      floor.material.dispose();
      group.remove(lampPoint);
      group.remove(lampSpot);
      group.remove(spotTarget);
      scene.remove(ambient);
      scene.remove(key);
      scene.remove(fill);
      if (spotHelper) {
        scene.remove(spotHelper);
        spotHelper.dispose();
      }
      lampPoint.dispose?.();
      lampSpot.dispose?.();
      key.dispose?.();
      fill.dispose?.();
      ambient.dispose?.();
      controls.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
      lightRigRef.current = null;
    };
  }, [modelUrl]);

  useEffect(() => {
    controlsRef.current = { isLightOn, lightColor, intensity };
    applyLightState(lightRigRef.current, controlsRef.current);
  }, [isLightOn, lightColor, intensity]);

  return (
    <section className="product-viewer" aria-label="Vista 3D del producto">
      <div ref={mountRef} className="three-stage" aria-hidden="true" />
    </section>
  );
}
