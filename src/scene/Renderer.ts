import * as THREE from "three";

export class SceneRenderer {
  readonly renderer: THREE.WebGLRenderer;
  pixel = false;

  constructor(container: HTMLElement) {
    if (!("WebGLRenderingContext" in window)) {
      throw new Error("当前浏览器不支持 WebGL。请更新浏览器或换用支持 WebGL 的设备。");
    }

    try {
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        preserveDrawingBuffer: true,
        powerPreference: "high-performance",
      });
    } catch {
      throw new Error("WebGL 初始化失败。请检查浏览器的硬件加速/WebGL 设置。");
    }

    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor(0x11151a, 1);
    container.appendChild(this.renderer.domElement);
  }

  resize(w: number, h: number) {
    this.renderer.setSize(Math.max(1, w), Math.max(1, h), false);
  }

  setPixelMode(on: boolean) {
    this.pixel = on;
  }

  render(scene: THREE.Scene, camera: THREE.Camera) {
    const dpr = window.devicePixelRatio || 1;
    const ratio = this.pixel ? Math.min(dpr, 0.75) : Math.min(dpr, 1.5);
    this.renderer.setPixelRatio(ratio);
    this.renderer.render(scene, camera);
  }

  dispose() {
    this.renderer.dispose();
    this.renderer.forceContextLoss?.();
    this.renderer.domElement.remove();
  }
}
