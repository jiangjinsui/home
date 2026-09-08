import * as THREE from "three";
import { Season, Weather } from "../types";

const mat = (color: number, roughness=0.75, metalness=0) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });

function box(scene: THREE.Group, size: [number,number,number], pos: [number,number,number], color: number, r=.72) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(...size), mat(color,r));
  m.position.set(...pos); m.castShadow = true; m.receiveShadow = true; scene.add(m); return m;
}
function cyl(scene: THREE.Group, radius: number, h: number, pos: [number,number,number], color: number) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,h,12), mat(color));
  m.position.set(...pos); m.castShadow=true; m.receiveShadow=true; scene.add(m); return m;
}
function plant(scene: THREE.Group, x:number,z:number) {
  const g=new THREE.Group(); g.position.set(x,0,z);
  const pot=new THREE.Mesh(new THREE.CylinderGeometry(.28,.22,.35,12),mat(0xb97855));
  pot.position.y=.18; g.add(pot);
  for(let i=0;i<7;i++){ const leaf=new THREE.Mesh(new THREE.SphereGeometry(.18,8,6),mat(0x50775a));
    leaf.scale.set(.65,.18,1); leaf.position.set(Math.sin(i*1.8)*.25,.55+Math.cos(i)*.12,Math.cos(i*1.8)*.22); leaf.rotation.y=i; g.add(leaf); }
  scene.add(g); return g;
}
function books(scene:THREE.Group,x:number,z:number) {
  for(let i=0;i<4;i++) box(scene,[.42,.08,.28],[x,(i+.5)*.08+.52,z], [0x776e68,0x8d7770,0x6e7d72,0x9a826f][i],.35);
}
export class BedroomScene {
  readonly root=new THREE.Group();
  readonly dynamic: THREE.Object3D[]=[];
  readonly rain=new THREE.Group(); readonly snow=new THREE.Group(); readonly leaves=new THREE.Group();
  private outsideGroup=new THREE.Group();
  constructor(public scene:THREE.Scene){
    this.buildRoom(); this.buildFurniture(); this.buildWindow(); this.buildPlants(); this.buildParticles();
    scene.add(this.root);
  }
  private buildRoom(){
    box(this.root,[12,.25,10],[0,-.125,0],0x6f6258);
    box(this.root,[12,4.8,.2],[0,2.4,-5],0xd9d0c6);
    box(this.root,[.2,4.8,10],[-6,2.4,0],0xd6cec5);
    box(this.root,[.2,4.8,10],[6,2.4,0],0xd6cec5);
    box(this.root,[12,.2,10],[0,4.8,0],0xe5ded5);
    box(this.root,[7,.05,5.2],[0,.03,.3],0xb99f8c,.95);
    this.scene.add(this.outsideGroup);
  }
  private buildFurniture(){
    // bed
    box(this.root,[5.0,.35,3.2],[-1.6,.55,-.9],0x5d4d46);
    box(this.root,[4.75,.38,3.0],[-1.6,.88,-.9],0xd5c4b7,.9);
    box(this.root,[4.7,.18,2.95],[-1.6,1.12,-.9],0xe7ddd4,.95);
    box(this.root,[4.9,2.0,.22],[-1.6,1.45,-2.4],0x6b554d);
    box(this.root,[1.35,.28,.75],[-2.7,1.35,-1.65],0xf0e7df,.9);
    box(this.root,[1.35,.28,.75],[-.55,1.35,-1.65],0xf0e7df,.9);
    // bedside
    box(this.root,[1.0,1.0,.9],[1.35,.5,-1.7],0x806a5f);
    box(this.root,[.12,.75,.12],[1.35,1.35,-1.7],0x413a36,.3);
    cyl(this.root,.32,.08,[1.35,1.78,-1.7],0xd8bca0);
    // desk + chair
    box(this.root,[3.1,.18,1.15],[-.2,1.35,2.8],0x795f50);
    box(this.root,[.18,1.35,.18],[-1.45,.68,2.45],0x795f50);
    box(this.root,[.18,1.35,.18],[1.05,.68,2.45],0x795f50);
    box(this.root,[1.7,.12,.8],[-.2,2.1,2.82],0x3f4244,.3);
    box(this.root,[.15,.5,.15],[-.2,1.62,2.82],0x45484b);
    box(this.root,[1.5,.08,.6],[-.2,1.48,3.15],0x383b3d,.25);
    box(this.root,[.9,.18,.9],[-.2,.75,4.0],0x675a54);
    box(this.root,[.85,.9,.15],[-.2,1.18,4.28],0x675a54);
    // wardrobe
    box(this.root,[2.3,3.7,1.0],[4.45,1.85,-1.7],0x70584e);
    for(const x of [3.9,5.0]) { const h=cyl(this.root,.055,.45,[x,1.9,-2.23],0xc8aa83); h.rotation.z=Math.PI/2; }
    books(this.root,1.0,2.7);
  }
  private buildWindow(){
    box(this.root,[4.2,2.8,.15],[0,2.9,-4.82],0x6b554d);
    box(this.root,[3.8,2.4,.05],[0,2.9,-4.72],0x9fc4d0,.2);
    box(this.root,[.12,2.35,.18],[0,2.9,-4.67],0x745f56);
    box(this.root,[3.75,.12,.18],[0,2.9,-4.67],0x745f56);
    for(const x of [-2.05,2.05]) { const c=box(this.root,[.12,3.2,.08],[x,2.9,-4.45],0x8d7063,.5); c.userData.curtain=true; this.dynamic.push(c); }
  }
  private buildPlants(){ this.dynamic.push(plant(this.root,4.55,2.55)); plant(this.root,-4.8,-3.5); }
  private buildParticles(){
    const make=(group:THREE.Group,count:number,color:number)=>{
      const geo=new THREE.BufferGeometry(); const p=new Float32Array(count*3);
      for(let i=0;i<count;i++){p[i*3]=(Math.random()-.5)*9;p[i*3+1]=Math.random()*4.5;p[i*3+2]=-4.3-Math.random()*1.5;}
      geo.setAttribute("position",new THREE.BufferAttribute(p,3));
      const pts=new THREE.Points(geo,new THREE.PointsMaterial({color,size:.035,transparent:true,opacity:.7}));
      group.add(pts); this.root.add(group);
    };
    make(this.rain,220,0xa7bdd0); make(this.snow,120,0xf2f0e8); make(this.leaves,55,0xb07845);
  }
  updateWeather(weather:Weather){
    this.rain.visible=weather==="rain"; this.snow.visible=weather==="snow";
  }
  updateSeason(season:Season){
    this.outsideGroup.userData.season=season;
    this.leaves.visible=season==="autumn";
    this.root.traverse(o=>{ if(o instanceof THREE.Mesh && o.userData.curtain) o.material.opacity=season==="winter"?.82:1; });
  }
  tick(t:number){
    for(const o of this.dynamic){ o.rotation.z=Math.sin(t*0.8+o.id)*.012; }
    for(const g of [this.rain,this.snow,this.leaves]){
      const p=g.children[0] as THREE.Points|undefined; if(!p) continue;
      const a=p.geometry.getAttribute("position") as THREE.BufferAttribute;
      for(let i=0;i<a.count;i++){ let y=a.getY(i); y-=.004*(g===this.rain?2:.8); if(y<0)y=4.5; a.setY(i,y); if(g===this.leaves)a.setX(i,a.getX(i)+Math.sin(t+i)*.001); }
      a.needsUpdate=true;
    }
  }
}