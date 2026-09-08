import * as THREE from "three";
import { Season, Weather } from "../types";

const material = (color: number, roughness = 0.75, metalness = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });

function addBox(
  group: THREE.Group,
  size: [number, number, number],
  pos: [number, number, number],
  color: number,
  roughness = 0.72,
  rotationY = 0,
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material(color, roughness));
  mesh.position.set(...pos);
  mesh.rotation.y = rotationY;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function addCylinder(
  group: THREE.Group,
  radius: number,
  height: number,
  pos: [number, number, number],
  color: number,
  segments = 16,
) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 0.92, height, segments), material(color));
  mesh.position.set(...pos);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function addSphere(
  group: THREE.Group,
  scale: [number, number, number],
  pos: [number, number, number],
  color: number,
) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), material(color, 0.85));
  mesh.scale.set(...scale);
  mesh.position.set(...pos);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function addRoundedBook(group: THREE.Group, pos: [number, number, number], size: [number, number, number], color: number, rot = 0) {
  return addBox(group, size, pos, color, 0.58, rot);
}

function addPlant(group: THREE.Group, x: number, z: number, scale = 1) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.scale.setScalar(scale);
  const pot = addCylinder(g, 0.24, 0.34, [0, 0.17, 0], 0xb8785f, 14);
  pot.castShadow = true;
  for (let i = 0; i < 8; i++) {
    const leaf = addSphere(g, [0.13, 0.42, 0.055], [Math.cos(i * 0.78) * 0.2, 0.52 + (i % 2) * 0.08, Math.sin(i * 0.78) * 0.2], i % 2 ? 0x5c8064 : 0x476d55);
    leaf.rotation.z = (i - 3.5) * 0.28;
    leaf.rotation.y = i * 0.6;
  }
  group.add(g);
  return g;
}

function addLamp(group: THREE.Group, x: number, z: number) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  addCylinder(g, 0.16, 0.08, [0, 1.02, 0], 0x6b5c55);
  addCylinder(g, 0.035, 0.42, [0, 1.24, 0], 0x5b4c47, 10);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.25, 18, 1, true), material(0xe7d4b8));
  shade.position.y = 1.47;
  shade.castShadow = true;
  g.add(shade);
  group.add(g);
  return g;
}

function addCat(group: THREE.Group) {
  const cat = new THREE.Group();
  cat.position.set(-0.8, 1.55, -0.95);
  cat.rotation.y = 0.25;
  cat.userData.isCat = true;

  addSphere(cat, [0.43, 0.28, 0.28], [0, 0.15, 0], 0xc6a58f);
  addSphere(cat, [0.28, 0.27, 0.25], [0, 0.48, -0.03], 0xd0b09a);

  const earL = new THREE.Mesh(new THREE.ConeGeometry(0.105, 0.22, 4), material(0xb68e7d));
  earL.position.set(-0.17, 0.68, -0.03);
  earL.rotation.z = -0.25;
  cat.add(earL);
  const earR = earL.clone();
  earR.position.x = 0.17;
  earR.rotation.z = 0.25;
  cat.add(earR);

  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x30261f });
  for (const x of [-0.095, 0.095]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 6), eyeMat);
    eye.position.set(x, 0.5, -0.235);
    cat.add(eye);
  }

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), material(0x9f6f6b));
  nose.position.set(0, 0.44, -0.245);
  cat.add(nose);

  const tail = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.045, 8, 20, Math.PI * 1.45), material(0xb9947e));
  tail.position.set(0.36, 0.19, 0.03);
  tail.rotation.set(0.1, 0, -0.75);
  tail.userData.catTail = true;
  cat.add(tail);

  group.add(cat);
  return cat;
}

export class BedroomScene {
  readonly root = new THREE.Group();
  readonly dynamic: THREE.Object3D[] = [];
  readonly rain = new THREE.Group();
  readonly snow = new THREE.Group();
  readonly leaves = new THREE.Group();
  private outsideGroup = new THREE.Group();
  private curtainMaterial = material(0xe7ddd2, 0.9);
  private seasonalMeshes: THREE.Mesh[] = [];
  private cat?: THREE.Group;

  constructor(public scene: THREE.Scene) {
    this.buildRoom();
    this.buildFurniture();
    this.buildWindow();
    this.buildOutside();
    this.buildPlantsAndDecor();
    this.buildParticles();
    scene.add(this.root);
  }

  private buildRoom() {
    // Slightly larger than a tiny bedroom: compact, but comfortable enough to move around.
    addBox(this.root, [11, 0.22, 8.8], [0, -0.11, 0], 0x74665d);
    addBox(this.root, [11, 4.9, 0.18], [0, 2.45, -4.4], 0xdcd4cb);
    addBox(this.root, [0.18, 4.9, 8.8], [-5.5, 2.45, 0], 0xd7d0c8);
    addBox(this.root, [0.18, 4.9, 8.8], [5.5, 2.45, 0], 0xd7d0c8);
    addBox(this.root, [11, 0.18, 8.8], [0, 4.9, 0], 0xe8e1d9);

    // Warm rug anchors the room without filling all the floor.
    addBox(this.root, [6.4, 0.035, 4.9], [0.2, 0.02, 0.35], 0xb79f8d, 0.95);
    addBox(this.root, [5.9, 0.04, 4.4], [0.2, 0.045, 0.35], 0xc6ae9a, 0.98);

    // A little baseboard detail makes the room feel less like a box.
    addBox(this.root, [10.8, 0.16, 0.08], [0, 0.08, -4.29], 0xb5aaa1);
    addBox(this.root, [0.08, 0.16, 8.6], [-5.39, 0.08, 0], 0xb5aaa1);
    addBox(this.root, [0.08, 0.16, 8.6], [5.39, 0.08, 0], 0xb5aaa1);
    this.scene.add(this.outsideGroup);
  }

  private buildFurniture() {
    // Bed: the main cozy focal point.
    addBox(this.root, [4.35, 0.32, 2.75], [-1.9, 0.48, -0.95], 0x604e47, 0.72);
    addBox(this.root, [4.15, 0.38, 2.58], [-1.9, 0.83, -0.95], 0xd7c4b6, 0.9);
    addBox(this.root, [4.05, 0.16, 2.48], [-1.9, 1.08, -0.95], 0xe8ded5, 0.94);
    addBox(this.root, [4.22, 1.72, 0.18], [-1.9, 1.4, -2.28], 0x6c554d, 0.72);

    // Pillows and a naturally uneven folded blanket.
    addBox(this.root, [1.15, 0.25, 0.7], [-2.78, 1.29, -1.63], 0xf1e7dd, 0.92, -0.03);
    addBox(this.root, [1.15, 0.25, 0.7], [-1.18, 1.29, -1.63], 0xf1e7dd, 0.92, 0.03);
    addBox(this.root, [2.15, 0.22, 1.38], [-0.82, 1.22, -0.42], 0xb9a7a1, 0.9, -0.025);
    addBox(this.root, [1.25, 0.16, 1.1], [-1.2, 1.33, -0.15], 0xc7b6ad, 0.92, 0.04);

    // Bedside table + tiny lamp.
    addBox(this.root, [0.85, 0.86, 0.75], [0.9, 0.43, -1.78], 0x80685d, 0.7);
    addBox(this.root, [0.66, 0.05, 0.58], [0.9, 0.9, -1.78], 0x90766a, 0.6);
    addLamp(this.root, 0.9, -1.78);
    addRoundedBook(this.root, [0.72, 0.94, -1.78], [0.24, 0.045, 0.4], 0x81736f, -0.1);

    // Compact desk.
    addBox(this.root, [2.65, 0.16, 0.95], [-0.05, 1.25, 2.72], 0x806455, 0.72);
    addBox(this.root, [0.15, 1.25, 0.15], [-1.2, 0.62, 2.43], 0x806455);
    addBox(this.root, [0.15, 1.25, 0.15], [1.1, 0.62, 2.43], 0x806455);
    addBox(this.root, [1.25, 0.72, 0.08], [-0.05, 0.62, 3.02], 0x5b514d, 0.8);
    addBox(this.root, [0.85, 0.12, 0.55], [-0.05, 1.48, 2.72], 0x34383b, 0.35);
    addBox(this.root, [0.08, 0.35, 0.08], [-0.05, 1.68, 2.72], 0x4a4b4c, 0.3);
    addLamp(this.root, 0.78, 2.72);

    // Small stationery cluster.
    addRoundedBook(this.root, [-0.68, 1.39, 2.7], [0.55, 0.06, 0.38], 0x8b7770, 0.04);
    addRoundedBook(this.root, [-0.62, 1.47, 2.72], [0.5, 0.06, 0.34], 0x6f7d73, -0.06);
    addCylinder(this.root, 0.07, 0.28, [-0.12, 1.43, 2.95], 0xc5a98e, 10);

    // Chair.
    addBox(this.root, [0.95, 0.12, 0.85], [-0.05, 0.68, 3.68], 0x6b5a53, 0.75);
    addBox(this.root, [0.85, 0.92, 0.12], [-0.05, 1.12, 4.05], 0x6b5a53, 0.75);
    addBox(this.root, [0.12, 0.68, 0.12], [-0.38, 0.34, 3.4], 0x6b5a53);
    addBox(this.root, [0.12, 0.68, 0.12], [0.28, 0.34, 3.4], 0x6b5a53);

    // Narrow wardrobe.
    addBox(this.root, [1.75, 3.55, 0.9], [4.45, 1.8, -1.75], 0x735a50, 0.68);
    addBox(this.root, [0.8, 3.35, 0.045], [4.0, 1.8, -2.21], 0x80665b, 0.55);
    addBox(this.root, [0.8, 3.35, 0.045], [4.9, 1.8, -2.21], 0x80665b, 0.55);
    for (const x of [4.0, 4.9]) addCylinder(this.root, 0.045, 0.32, [x, 1.85, -2.27], 0xc7a77f, 12).rotation.z = Math.PI / 2;

    // Low drawer unit by the desk.
    addBox(this.root, [1.15, 1.15, 0.75], [3.15, 0.58, 2.95], 0x80675b, 0.7);
    for (const y of [0.38, 0.73]) addCylinder(this.root, 0.035, 0.24, [3.15, y, 2.55], 0xc5a37d, 10).rotation.z = Math.PI / 2;

    // Narrow shelf with books and a framed photo.
    addBox(this.root, [1.35, 2.65, 0.34], [4.25, 1.45, 0.9], 0x725b51, 0.65);
    for (const y of [0.35, 1.0, 1.65, 2.3]) addBox(this.root, [1.12, 0.07, 0.27], [4.25, y, 0.67], 0x987d6c, 0.45);
    const bookColors = [0x8d7771, 0x6f7c71, 0x9a826f, 0x7a6e78, 0xa28b7a];
    bookColors.forEach((c, i) => addRoundedBook(this.root, [3.9 + (i % 2) * 0.28, 0.56 + Math.floor(i / 2) * 0.65, 0.5], [0.2, 0.48, 0.2], c, (i % 2) * 0.05));
    addPlant(this.root, 4.25, 0.48, 0.72);

    // Little slippers near the bed.
    addBox(this.root, [0.35, 0.08, 0.7], [-3.75, 0.09, 1.25], 0x8d7771, 0.92, -0.18);
    addBox(this.root, [0.35, 0.08, 0.7], [-3.35, 0.09, 1.1], 0x9a8179, 0.92, -0.12);

    this.cat = addCat(this.root);
    this.dynamic.push(this.cat);
  }

  private buildWindow() {
    addBox(this.root, [4.15, 2.75, 0.16], [-1.0, 2.85, -4.31], 0x71594f, 0.65);
    addBox(this.root, [3.78, 2.38, 0.04], [-1.0, 2.85, -4.2], 0x9fc6d5, 0.3);
    addBox(this.root, [0.1, 2.35, 0.16], [-1.0, 2.85, -4.16], 0x80685c, 0.45);
    addBox(this.root, [3.72, 0.1, 0.16], [-1.0, 2.85, -4.16], 0x80685c, 0.45);

    for (const x of [-3.0, 1.0]) {
      const curtain = new THREE.Mesh(new THREE.BoxGeometry(0.58, 3.1, 0.08), this.curtainMaterial);
      curtain.position.set(x, 2.78, -4.02);
      curtain.castShadow = true;
      curtain.userData.curtain = true;
      this.root.add(curtain);
      this.dynamic.push(curtain);
    }

    addBox(this.root, [4.45, 0.12, 0.28], [-1.0, 1.38, -3.98], 0x80685c, 0.6);
  }

  private buildOutside() {
    const sky = addBox(this.outsideGroup, [18, 8, 0.1], [-1, 3, -5.25], 0x91b4c6, 1);
    sky.castShadow = false;
    sky.receiveShadow = false;

    // Distant procedural trees.
    for (const x of [-5.2, -3.9, 2.5, 4.0, 5.2]) {
      addCylinder(this.outsideGroup, 0.13, 1.4, [x, 0.65, -5.35], 0x6f665e, 8);
      const crown = addSphere(this.outsideGroup, [0.65, 0.72, 0.18], [x, 1.45, -5.38], 0x64836c);
      crown.castShadow = false;
    }

    // Moon and stars are hidden by season/time visually, but remain lightweight.
    const moon = new THREE.Mesh(new THREE.SphereGeometry(0.34, 18, 12), new THREE.MeshBasicMaterial({ color: 0xf4ead0 }));
    moon.position.set(2.9, 3.7, -5.42);
    moon.userData.moon = true;
    this.outsideGroup.add(moon);
    for (let i = 0; i < 24; i++) {
      const star = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 4), new THREE.MeshBasicMaterial({ color: 0xfff7dc }));
      star.position.set(-4.2 + (i * 1.73) % 7.5, 2.2 + ((i * 0.67) % 2.2), -5.38);
      star.userData.star = true;
      this.outsideGroup.add(star);
    }
  }

  private buildPlantsAndDecor() {
    addPlant(this.root, 3.85, 3.3, 1.05);
    addPlant(this.root, -4.55, -3.2, 0.82);

    // Tiny wall picture above the desk.
    addBox(this.root, [1.1, 0.85, 0.05], [-0.05, 2.9, -4.12], 0x765f54, 0.9);
    addBox(this.root, [0.88, 0.63, 0.02], [-0.05, 2.9, -4.08], 0xd4b9a0, 0.9);

    // Wastebasket.
    addCylinder(this.root, 0.22, 0.4, [2.2, 0.2, 3.75], 0x77716c, 14);

    // Small floor cushion.
    addSphere(this.root, [0.55, 0.14, 0.42], [2.15, 0.17, 0.35], 0xa58f84);
  }

  private buildParticles() {
    const make = (group: THREE.Group, count: number, color: number) => {
      const geo = new THREE.BufferGeometry();
      const p = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        p[i * 3] = -4.7 + Math.random() * 7.4;
        p[i * 3 + 1] = Math.random() * 4.5;
        p[i * 3 + 2] = -4.12 - Math.random() * 1.4;
      }
      geo.setAttribute("position", new THREE.BufferAttribute(p, 3));
      const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color, size: 0.035, transparent: true, opacity: 0.72 }));
      group.add(pts);
      this.root.add(group);
    };
    make(this.rain, 180, 0xa9c0d0);
    make(this.snow, 100, 0xf2f0e8);
    make(this.leaves, 48, 0xb07845);
  }

  updateWeather(weather: Weather) {
    this.rain.visible = weather === "rain";
    this.snow.visible = weather === "snow";
    if (weather === "cloudy" || weather === "rain" || weather === "snow") {
      this.outsideGroup.traverse((o) => {
        if (o.userData.star || o.userData.moon) o.visible = false;
      });
    } else {
      this.outsideGroup.traverse((o) => {
        if (o.userData.star || o.userData.moon) o.visible = true;
      });
    }
  }

  updateSeason(season: Season) {
    this.leaves.visible = season === "autumn";
    this.seasonalMeshes.forEach((mesh) => {
      if (mesh.material instanceof THREE.MeshStandardMaterial) {
        mesh.material.color.setHex(season === "winter" ? 0xcdd5d3 : season === "summer" ? 0x557a5b : 0x688469);
      }
    });
    this.root.traverse((o) => {
      if (o instanceof THREE.Mesh && o.userData.curtain && o.material instanceof THREE.MeshStandardMaterial) {
        o.material.opacity = season === "winter" ? 0.82 : 1;
        o.material.transparent = season === "winter";
      }
    });
  }

  tick(t: number) {
    for (const o of this.dynamic) {
      if (o.userData.isCat) {
        o.position.y = 1.55 + Math.sin(t * 0.8) * 0.018;
        o.rotation.y = 0.25 + Math.sin(t * 0.35) * 0.08;
        const tail = o.children.find((child) => child.userData.catTail);
        if (tail) tail.rotation.z = -0.75 + Math.sin(t * 1.4) * 0.25;
      } else {
        o.rotation.z = Math.sin(t * 0.8 + o.id) * 0.012;
      }
    }

    for (const g of [this.rain, this.snow, this.leaves]) {
      const p = g.children[0] as THREE.Points | undefined;
      if (!p) continue;
      const a = p.geometry.getAttribute("position") as THREE.BufferAttribute;
      for (let i = 0; i < a.count; i++) {
        let y = a.getY(i);
        y -= 0.004 * (g === this.rain ? 2.2 : 0.8);
        if (y < 0) y = 4.5;
        a.setY(i, y);
        if (g === this.leaves) a.setX(i, a.getX(i) + Math.sin(t + i) * 0.0012);
      }
      a.needsUpdate = true;
    }
  }
}
