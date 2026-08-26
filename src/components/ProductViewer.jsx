import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const BULB_NAME_PARTS = [
  "bulb",
  "bombilla",
  "foco",
  "led",
  "emitter",
  "emissive",
  "emission",
];

const LIGHT_HEIGHT_RATIO = 0.88;
const SHOW_LIGHT_HELPER = false;
const AUTO_LIGHT_DETECTION_ENABLED = true;
const SHOW_DETECTED_LIGHTS = false;
const DUPLICATE_LIGHT_DISTANCE = 0.08;
const SHOW_AXES_HELPER = false;

const DEFAULT_LIGHT_COLOR = new THREE.Color("#ffd29b");
const HEX_COLOR_PATTERN = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

// Acabados disponibles para el CUERPO de la lámpara (no afecta al foco/luz).
const MATERIAL_FINISHES = {
  metal: { color: new THREE.Color("#b8bcc4"), metalness: 0.92, roughness: 0.22 },
  white: { color: new THREE.Color("#f5f1e8"), metalness: 0.06, roughness: 0.5 },
  black: { color: new THREE.Color("#15161b"), metalness: 0.18, roughness: 0.38 },
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

function isBulbMesh(mesh) {
  return meshMatchesBulbName(mesh);
}

function collectBodyMeshes(model) {
  const meshes = [];

  model.traverse((object) => {
    if (object.isMesh && !isBulbMesh(object)) {
      meshes.push(object);
    }
  });

  return meshes;
}

function createFinishMaterial(originalMaterial, preset) {
  const material = originalMaterial.clone();
  material.map = null;

  if (material.color) material.color.copy(preset.color);
  if ("metalness" in material) material.metalness = preset.metalness;
  if ("roughness" in material) material.roughness = preset.roughness;

  material.needsUpdate = true;
  return material;
}

function applyFinishToMesh(entry, finish) {
  const preset = MATERIAL_FINISHES[finish];

  if (!preset) {
    entry.mesh.material = entry.originalMaterial;
    return;
  }

  if (!entry.overrideCache[finish]) {
    entry.overrideCache[finish] = Array.isArray(entry.originalMaterial)
      ? entry.originalMaterial.map((material) => createFinishMaterial(material, preset))
      : createFinishMaterial(entry.originalMaterial, preset);
  }

  entry.mesh.material = entry.overrideCache[finish];
}

function applyMaterialFinish(bodyMeshes, finish) {
  bodyMeshes.forEach((entry) => applyFinishToMesh(entry, finish));
}

function getSelectedLightColor(lightColor) {
  if (typeof lightColor === "string" && HEX_COLOR_PATTERN.test(lightColor)) {
    return new THREE.Color(lightColor);
  }
  return DEFAULT_LIGHT_COLOR;
}

function getMaterials(material) {
  if (!material) return [];
  return Array.isArray(material) ? material : [material];
}

function materialHasVisibleEmissive(material) {
  if (!material?.emissive) return false;

  const emissiveIsNotBlack =
    material.emissive.r > 0 ||
    material.emissive.g > 0 ||
    material.emissive.b > 0;
  const emissiveIntensity = material.emissiveIntensity ?? 1;

  return emissiveIsNotBlack && emissiveIntensity > 0;
}

function meshMatchesBulbName(mesh) {
  const meshName = mesh.name.toLowerCase();
  const materialName = getMaterials(mesh.material)
    .map((material) => material?.name ?? "")
    .join(" ")
    .toLowerCase();
  const searchableName = `${meshName} ${materialName}`;

  return BULB_NAME_PARTS.some((part) => searchableName.includes(part));
}

function dedupeBulbMeshes(meshes) {
  const accepted = [];

  meshes.forEach((mesh) => {
    const box = new THREE.Box3().setFromObject(mesh);
    const center = box.getCenter(new THREE.Vector3());
    const isDuplicate = accepted.some(({ center: previousCenter }) =>
      previousCenter.distanceTo(center) < DUPLICATE_LIGHT_DISTANCE,
    );

    if (!isDuplicate) {
      accepted.push({ mesh, center });
    }
  });

  return accepted.map(({ mesh }) => mesh);
}

function detectBulbMeshes(model) {
  const nameMatches = [];
  const emissiveMatches = [];

  model.traverse((object) => {
    if (!object.isMesh) return;

    if (meshMatchesBulbName(object)) {
      nameMatches.push(object);
      return;
    }

    const hasEmissiveMaterial = getMaterials(object.material).some(materialHasVisibleEmissive);
    if (hasEmissiveMaterial) {
      emissiveMatches.push(object);
    }
  });

  return dedupeBulbMeshes(nameMatches.length > 0 ? nameMatches : emissiveMatches);
}

function createLightsFromBulbs({ bulbMeshes, group, selectedColor }) {
  const pointLights = [];
  const spotLights = [];
  const emissiveMaterials = [];
  const helpers = [];

  bulbMeshes.forEach((mesh) => {
    const box = new THREE.Box3().setFromObject(mesh);
    const worldCenter = box.getCenter(new THREE.Vector3());
    const localCenter = group.worldToLocal(worldCenter.clone());
    const pointLight = new THREE.PointLight(selectedColor, 0, 4.5, 2);
    const spotTarget = new THREE.Object3D();
    const spotLight = new THREE.SpotLight(selectedColor, 0, 8, Math.PI / 5.5, 0.45, 1.8);

    pointLight.position.copy(localCenter);
    pointLight.castShadow = true;

    spotLight.position.copy(localCenter);
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 2048;
    spotLight.shadow.mapSize.height = 2048;
    spotLight.shadow.bias = -0.0005;
    spotLight.shadow.normalBias = 0.02;

    spotTarget.position.set(localCenter.x, localCenter.y - 1, localCenter.z);
    spotLight.target = spotTarget;

    group.add(pointLight);
    group.add(spotTarget);
    group.add(spotLight);

    getMaterials(mesh.material).forEach((material) => {
      if (material?.emissive && !emissiveMaterials.includes(material)) {
        emissiveMaterials.push(material);
      }
    });

    if (SHOW_DETECTED_LIGHTS) {
      const helper = new THREE.PointLightHelper(pointLight, 0.08);
      group.add(helper);
      helpers.push(helper);
      console.log("Foco detectado:", {
        mesh: mesh.name,
        material: getMaterials(mesh.material).map((material) => material?.name ?? ""),
        position: localCenter.toArray(),
      });
    }

    pointLights.push(pointLight);
    spotLights.push(spotLight);
  });

  if (SHOW_DETECTED_LIGHTS) {
    console.log(`Total de focos detectados: ${bulbMeshes.length}`);
  }

  return {
    pointLights,
    spotLights,
    emissiveMaterials,
    helpers,
  };
}

function repositionModelAfterRotation(model, bottomY = 0) {
  model.updateMatrixWorld(true);

  let box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());

  model.position.x -= center.x;
  model.position.z -= center.z;

  model.updateMatrixWorld(true);

  box = new THREE.Box3().setFromObject(model);

  model.position.y += bottomY - box.min.y;

  model.updateMatrixWorld(true);
}

function applyLightState(rig, { isLightOn, lightColor, intensity }) {
  if (!rig) return;

  const selectedColor = getSelectedLightColor(lightColor);
  const normalizedIntensity = isLightOn
    ? THREE.MathUtils.clamp(intensity / 100, 0, 1)
    : 0;

  rig.pointLights.forEach((pointLight) => {
    pointLight.color.copy(selectedColor);
    pointLight.intensity = normalizedIntensity * 7;
  });

  rig.spotLights.forEach((spotLight) => {
    spotLight.color.copy(selectedColor);
    spotLight.intensity = normalizedIntensity * 65;
  });

  rig.emissiveMaterials.forEach((material) => {
    material.emissive.copy(selectedColor);
    material.emissiveIntensity = normalizedIntensity * 6;
  });
}

export default function ProductViewer({
  isLightOn,
  lightColor,
  intensity,
  modelUrl,
  rotation = 0,
  rotationAxis = "y",
  modelBottomY = 0,
  materialFinish = "original",
}) {
  const mountRef = useRef(null);
  const lightRigRef = useRef(null);
  const bodyMeshesRef = useRef([]);
  const controlsRef = useRef({ isLightOn, lightColor, intensity });
  const materialFinishRef = useRef(materialFinish);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    let isMounted = true;
    let loadedModel = null;
    let fallbackSpotHelperDisposed = false;

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
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.2;

    controls.enableRotate = true;
    controls.enableZoom = true;
    controls.enablePan = false;

    controls.minDistance = 1;
    controls.maxDistance = 15;

    controls.minPolarAngle = Math.PI * 0.12;
    controls.maxPolarAngle = Math.PI * 0.88;

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

    const lampPoint = new THREE.PointLight(0xffd29b, 0, 4, 2);
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
      pointLights: [lampPoint],
      spotLights: [lampSpot],
      emissiveMaterials: [],
      helpers: spotHelper ? [spotHelper] : [],
    };

    const fitCameraToModel = (target) => {
      target.updateMatrixWorld(true);

      const fittedBox = new THREE.Box3().setFromObject(target);
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
      group.updateMatrixWorld(true);
      model.updateMatrixWorld(true);

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

      const localLightPosition = group.worldToLocal(lightPosition.clone());
      const localTargetPosition = group.worldToLocal(
        new THREE.Vector3(fittedCenter.x, fittedBox.min.y, fittedCenter.z),
      );

      lampPoint.position.copy(localLightPosition);
      lampSpot.position.copy(localLightPosition);
      spotTarget.position.copy(localTargetPosition);
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
        const rotationDegrees = Number(rotation) || 0;
        const rotationRadians = THREE.MathUtils.degToRad(rotationDegrees);

        switch (rotationAxis) {
          case "x":
            model.rotation.x = rotationRadians;
            break;

          case "z":
            model.rotation.z = rotationRadians;
            break;

          case "y":
          default:
            model.rotation.y = rotationRadians;
            break;
        }

        if (SHOW_AXES_HELPER) {
          const axesHelper = new THREE.AxesHelper(5);
          model.add(axesHelper);
        }

        model.updateMatrixWorld(true);
        repositionModelAfterRotation(model, modelBottomY);
        console.log("MODEL ROTATION DEBUG", {
          rotationProp: rotation,
          rotationAxis,
          degrees: rotationDegrees,
          radians: rotationRadians,
          actualRotation: {
            x: THREE.MathUtils.radToDeg(model.rotation.x),
            y: THREE.MathUtils.radToDeg(model.rotation.y),
            z: THREE.MathUtils.radToDeg(model.rotation.z),
          },
        });

        group.add(model);
        group.updateMatrixWorld(true);
        loadedModel = model;

        const selectedColor = getSelectedLightColor(controlsRef.current.lightColor);
        const detectedBulbs = detectBulbMeshes(model);
        const shouldUseDetectedLights =
          AUTO_LIGHT_DETECTION_ENABLED && detectedBulbs.length > 0;

        if (shouldUseDetectedLights) {
          lampPoint.intensity = 0;
          lampSpot.intensity = 0;
          group.remove(lampPoint);
          group.remove(lampSpot);
          group.remove(spotTarget);
          if (spotHelper) {
            scene.remove(spotHelper);
            spotHelper.dispose();
            fallbackSpotHelperDisposed = true;
          }

          lightRigRef.current = createLightsFromBulbs({
            bulbMeshes: detectedBulbs,
            group,
            selectedColor,
          });
        } else {
          lightRigRef.current = {
            pointLights: [lampPoint],
            spotLights: [lampSpot],
            emissiveMaterials: findEmissiveMaterials(model),
            helpers: spotHelper ? [spotHelper] : [],
          };
          placeLampLights(model);
        }

        bodyMeshesRef.current = collectBodyMeshes(model).map((mesh) => ({
          mesh,
          originalMaterial: mesh.material,
          overrideCache: {},
        }));
        applyMaterialFinish(bodyMeshesRef.current, materialFinishRef.current);

        group.updateMatrixWorld(true);
        fitCameraToModel(group);
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
        group.updateMatrixWorld(true);
        fitCameraToModel(group);
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
        const disposedOverrides = new Set();
        bodyMeshesRef.current.forEach((entry) => {
          entry.mesh.material = entry.originalMaterial;
          Object.values(entry.overrideCache).forEach((materialOrArray) => {
            getMaterials(materialOrArray).forEach((material) =>
              disposeMaterial(material, disposedOverrides),
            );
          });
        });
        bodyMeshesRef.current = [];

        group.remove(loadedModel);
        disposeModel(loadedModel);
      }

      floor.geometry.dispose();
      floor.material.dispose();
      const disposedLights = new Set();
      const disposedHelpers = new Set();

      lightRigRef.current?.pointLights.forEach((pointLight) => {
        group.remove(pointLight);
        if (!disposedLights.has(pointLight)) {
          pointLight.dispose?.();
          disposedLights.add(pointLight);
        }
      });
      lightRigRef.current?.spotLights.forEach((spotLight) => {
        group.remove(spotLight);
        group.remove(spotLight.target);
        if (!disposedLights.has(spotLight)) {
          spotLight.dispose?.();
          disposedLights.add(spotLight);
        }
      });
      lightRigRef.current?.helpers.forEach((helper) => {
        group.remove(helper);
        scene.remove(helper);
        if (!disposedHelpers.has(helper)) {
          helper.dispose?.();
          disposedHelpers.add(helper);
        }
      });
      group.remove(lampPoint);
      group.remove(lampSpot);
      group.remove(spotTarget);
      scene.remove(ambient);
      scene.remove(key);
      scene.remove(fill);
      if (spotHelper) {
        scene.remove(spotHelper);
        if (!fallbackSpotHelperDisposed && !disposedHelpers.has(spotHelper)) {
          spotHelper.dispose();
        }
      }
      if (!disposedLights.has(lampPoint)) {
        lampPoint.dispose?.();
      }
      if (!disposedLights.has(lampSpot)) {
        lampSpot.dispose?.();
      }
      key.dispose?.();
      fill.dispose?.();
      ambient.dispose?.();
      controls.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
      lightRigRef.current = null;
    };
  }, [modelUrl, rotation, rotationAxis, modelBottomY]);

  useEffect(() => {
    controlsRef.current = { isLightOn, lightColor, intensity };
    applyLightState(lightRigRef.current, controlsRef.current);
  }, [isLightOn, lightColor, intensity]);

  useEffect(() => {
    materialFinishRef.current = materialFinish;
    applyMaterialFinish(bodyMeshesRef.current, materialFinish);
  }, [materialFinish]);

  return (
    <section className="product-viewer" aria-label="Vista 3D del producto">
      <div ref={mountRef} className="three-stage" aria-hidden="true" />
    </section>
  );
}