import * as THREE from "three";
export class TimeSystem {
  time=18.5; auto=true; speed=.018;
  sun=new THREE.DirectionalLight(0xffd4aa,2.2);
  moon=new THREE.DirectionalLight(0x9db7e8,.35);
  ambient=new THREE.HemisphereLight(0xc6d7e8,0x5b4c42,.65);
  main=new THREE.PointLight(0xffc88d,0,12,2);
  bedside=new THREE.PointLight(0xffb878,0,6,2);
  desk=new THREE.PointLight(0xffd09a,0,7,2);
  constructor(scene:THREE.Scene){
    this.sun.castShadow=true; this.sun.shadow.mapSize.set(768,768); scene.add(this.sun,this.moon,this.ambient);
    this.main.position.set(0,3.8,0); this.bedside.position.set(1.35,1.8,-1.7); this.desk.position.set(-.2,2.2,2.8);
    scene.add(this.main,this.bedside,this.desk);
  }
  update(dt:number){
    if(this.auto) this.time=(this.time+dt*this.speed)%24;
    const a=(this.time/24)*Math.PI*2-Math.PI/2, sunY=Math.sin(a);
    this.sun.position.set(Math.cos(a)*8,Math.max(.2,sunY*8),Math.sin(a)*8);
    this.moon.position.set(-this.sun.position.x,Math.max(.4,-this.sun.position.y),-this.sun.position.z);
    const daylight=Math.max(0,Math.sin(a));
    const dawn=Math.max(0,1-Math.abs(this.time-6)/2.5);
    const dusk=Math.max(0,1-Math.abs(this.time-18)/2.8);
    this.sun.intensity=.35+daylight*2.0;
    this.moon.intensity=Math.max(0,.35-daylight*.3);
    this.ambient.intensity=.35+daylight*.55;
    const lamp=(1-daylight)*2.2+Math.max(dawn,dusk)*.45;
    this.main.intensity=lamp; this.bedside.intensity=lamp*.72; this.desk.intensity=lamp*.55;
    return {daylight,dawn,dusk};
  }
}