import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

let scene, camera, renderer, controls, raycaster, mouse;
const planets = [];

// Périodes orbitales des planètes (en jours)
const orbitalSpeeds = {
  Mercure: 88,
  Vénus: 225,
  Terre: 365,
  Mars: 687,
  Jupiter: 4331,
  Saturne: 10747,
  Uranus: 30589,
  Neptune: 59800,
};

// Élément pour afficher le nom de la planète
const planetInfo = document.createElement('div');
planetInfo.style.position = 'absolute';
planetInfo.style.color = 'white';
planetInfo.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
planetInfo.style.padding = '5px';
planetInfo.style.display = 'none';
document.body.appendChild(planetInfo);

// Fonction pour obtenir le nombre de jours écoulés depuis une date de référence
function getDaysSince(date) {
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Date de référence : 1er janvier 2000
const referenceDate = new Date('2000-01-01');

function init() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 50;

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);

  // Raycaster et vecteur de la souris
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  createSun();
  createPlanets();
  createStars();
  createLegend();
  createISS(); // Ajout de la station ISS

  window.addEventListener('resize', onWindowResize);
  window.addEventListener('mousemove', onMouseMove); // Ajout de l'événement de la souris
}

function createSun() {
  const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
  const sunTexture = new THREE.TextureLoader().load(
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/sun.jpg'
  );

  const sunMaterial = new THREE.MeshPhongMaterial({
    map: sunTexture,
    emissive: 0xffff00,
    emissiveIntensity: 1,
    shininess: 30,
  });

  const sun = new THREE.Mesh(sunGeometry, sunMaterial);
  scene.add(sun);

  const sunGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: new THREE.TextureLoader().load(
        'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/sprites/glow.png'
      ),
      color: 0xffff00,
      transparent: true,
      blending: THREE.AdditiveBlending,
    })
  );
  sunGlow.scale.set(20, 20, 1);
  sun.add(sunGlow);

  const sunLight = new THREE.PointLight(0xffffff, 5, 300);
  scene.add(sunLight);
}

function createPlanet(
  name,
  size,
  texture,
  distanceFromSun,
  ring,
  atmosphereColor
) {
  const geo = new THREE.SphereGeometry(size, 32, 32);
  const mat = new THREE.MeshPhongMaterial({
    map: new THREE.TextureLoader().load(texture),
  });
  const mesh = new THREE.Mesh(geo, mat);

  // Créer un pivot pour l'orbite de la planète
  const orbitPivot = new THREE.Object3D();
  scene.add(orbitPivot);

  // Positionner la planète à la bonne distance initiale
  mesh.position.set(distanceFromSun, 0, 0);
  orbitPivot.add(mesh);

  if (ring) {
    const ringGeo = new THREE.RingGeometry(
      ring.innerRadius,
      ring.outerRadius,
      32
    );
    const ringMat = new THREE.MeshBasicMaterial({
      map: new THREE.TextureLoader().load(ring.texture),
      side: THREE.DoubleSide,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -0.5 * Math.PI;
    mesh.add(ringMesh);
  }

  if (atmosphereColor) {
    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(size * 1.05, 32, 32),
      new THREE.MeshPhongMaterial({
        color: atmosphereColor,
        transparent: true,
        opacity: 0.3,
      })
    );
    mesh.add(atmosphere);
  }

  scene.add(orbitPivot);
  planets.push({
    name: name,
    mesh: mesh,
    pivot: orbitPivot,
    speed: orbitalSpeeds[name],
    distance: distanceFromSun,
  });
  return { mesh: mesh, pivot: orbitPivot };
}

function createPlanets() {
  createPlanet(
    'Mercure',
    0.4,
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/mercury.jpg',
    10
  );
  createPlanet(
    'Vénus',
    0.9,
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/venus_surface.jpg',
    15,
    null,
    0xffa500
  );
  createPlanet(
    'Terre',
    1,
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg',
    20,
    null,
    0x6699ff
  );
  createPlanet(
    'Mars',
    0.5,
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/mars.jpg',
    25,
    null,
    0xff6666
  );
  createPlanet(
    'Jupiter',
    2,
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/jupiter.jpg',
    35
  );
  createPlanet(
    'Saturne',
    1.7,
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/saturn.jpg',
    45,
    {
      innerRadius: 2,
      outerRadius: 4,
      texture:
        'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/saturn_ring_alpha.png',
    }
  );
  createPlanet(
    'Uranus',
    1.4,
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/uranus.jpg',
    55
  );
  createPlanet(
    'Neptune',
    1.3,
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/neptune.jpg',
    65
  );
}

function createStars() {
  const geometry = new THREE.BufferGeometry();
  const vertices = [];

  for (let i = 0; i < 10000; i++) {
    vertices.push(THREE.MathUtils.randFloatSpread(2000));
    vertices.push(THREE.MathUtils.randFloatSpread(2000));
    vertices.push(THREE.MathUtils.randFloatSpread(2000));
  }

  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(vertices, 3)
  );

  const particles = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({ color: 0xffffff, size: 0.7 })
  );
  scene.add(particles);
}

function createLegend() {
  const legend = document.getElementById('legend');
  legend.innerHTML = '<h3>Légende</h3>';
  planets.forEach((planet) => {
    legend.innerHTML += `<div><a href="#" onclick="teleportToPlanet('${planet.name}')">${planet.name}</a></div>`;
  });
}

function teleportToPlanet(planetName) {
  const planet = planets.find((p) => p.name === planetName);
  if (planet) {
    const distance = planet.pivot.position.x + 5;
    camera.position.set(distance, 0, 0);
    controls.target.copy(planet.pivot.position);
    controls.update();
  }
}

function createISS() {
  const issGroup = new THREE.Group();

  // Créer les modules principaux (cylindres)
  const moduleGeo = new THREE.CylinderGeometry(1.5, 1.5, 4, 32);
  const moduleMat = new THREE.MeshPhongMaterial({ color: 0x888888 });
  const module1 = new THREE.Mesh(moduleGeo, moduleMat);
  module1.rotation.z = Math.PI / 2;
  issGroup.add(module1);

  const module2 = new THREE.Mesh(moduleGeo, moduleMat);
  module2.position.set(5, 0, 0); // Positionner un peu à droite
  module2.rotation.z = Math.PI / 2;
  issGroup.add(module2);

  const module3 = new THREE.Mesh(moduleGeo, moduleMat);
  module3.position.set(-5, 0, 0); // Positionner un peu à gauche
  module3.rotation.z = Math.PI / 2;
  issGroup.add(module3);

  // Créer les panneaux solaires (rectangles)
  const panelGeo = new THREE.PlaneGeometry(10, 1);
  const panelMat = new THREE.MeshBasicMaterial({
    color: 0xffcc00,
    side: THREE.DoubleSide,
  });

  const solarPanel1 = new THREE.Mesh(panelGeo, panelMat);
  solarPanel1.position.set(0, 2, 0);
  solarPanel1.rotation.x = Math.PI / 2;
  issGroup.add(solarPanel1);

  const solarPanel2 = new THREE.Mesh(panelGeo, panelMat);
  solarPanel2.position.set(0, -2, 0);
  solarPanel2.rotation.x = Math.PI / 2;
  issGroup.add(solarPanel2);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Détecter les mouvements de la souris
function onMouseMove(event) {
  // Normaliser les coordonnées de la souris
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Effectuer un raycast
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(planets.map((p) => p.mesh));

  if (intersects.length > 0) {
    const intersectedPlanet = planets.find(
      (p) => p.mesh === intersects[0].object
    );
    if (intersectedPlanet) {
      planetInfo.style.display = 'block';
      planetInfo.style.left = `${event.clientX + 10}px`;
      planetInfo.style.top = `${event.clientY + 10}px`;
      planetInfo.innerHTML = `Planète : ${intersectedPlanet.name}`;
    }
  } else {
    planetInfo.style.display = 'none';
  }
}

function animate() {
  requestAnimationFrame(animate);

  // Nombre de jours écoulés depuis la date de référence
  const daysElapsed = getDaysSince(referenceDate);

  planets.forEach((planet) => {
    // Rotation de la planète sur elle-même
    planet.mesh.rotation.y += 0.005;

    // Angle orbital actuel de la planète basé sur le temps écoulé
    const angle = (daysElapsed / planet.speed) * 2 * Math.PI;

    // Positionner la planète en orbite en fonction de l'angle
    planet.mesh.position.set(
      planet.distance * Math.cos(angle),
      0,
      planet.distance * Math.sin(angle)
    );
  });

  controls.update();
  renderer.render(scene, camera);
}

init();
animate();

// Expose teleportToPlanet function to the global scope
window.teleportToPlanet = teleportToPlanet;
