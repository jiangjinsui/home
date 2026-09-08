import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { BedroomScene } from "./scene/BedroomScene";
import { TimeSystem } from "./scene/TimeSystem";
import { SceneRenderer } from "./scene/Renderer";
import { Season, Weather, Language, RenderMode } from "./types";

const text = {
  zh: {
    time: "时间", season: "季节", weather: "天气", light: "灯光", cozy: "温馨",
    mode: "画风", screenshot: "截图", fullscreen: "全屏", reset: "重置视角",
    pause: "暂停", play: "自动", spring: "春", summer: "夏", autumn: "秋",
    winter: "冬", clear: "晴", cloudy: "阴", rain: "雨", snow: "雪",
    native: "原生 3D", pixel: "2px 像素", webglError: "3D 场景启动失败"
  },
  en: {
    time: "TIME", season: "SEASON", weather: "WEATHER", light: "LIGHT", cozy: "COZY",
    mode: "STYLE", screenshot: "SHOT", fullscreen: "FULL", reset: "RESET",
    pause: "PAUSE", play: "AUTO", spring: "SPRING", summer: "SUMMER",
    autumn: "AUTUMN", winter: "WINTER", clear: "CLEAR", cloudy: "CLOUDY",
    rain: "RAIN", snow: "SNOW", native: "NATIVE 3D", pixel: "2px PIXEL",
    webglError: "3D scene failed to start"
  }
};

const seasonLabels: Record<Language, Record<Season, string>> = {
  zh: { spring: "春", summer: "夏", autumn: "秋", winter: "冬" },
  en: { spring: "SPRING", summer: "SUMMER", autumn: "AUTUMN", winter: "WINTER" }
};

const weatherLabels: Record<Language, Record<Weather, string>> = {
  zh: { clear: "晴", cloudy: "阴", rain: "雨", snow: "雪" },
  en: { clear: "CLEAR", cloudy: "CLOUDY", rain: "RAIN", snow: "SNOW" }
};

export default function App() {
  const mount = useRef<HTMLDivElement>(null);
  const [time, setTime] = useState(18.5);
  const [auto, setAuto] = useState(true);
  const [season, setSeason] = useState<Season>("spring");
  const [weather, setWeather] = useState<Weather>("clear");
  const [lang, setLang] = useState<Language>("zh");
  const [mode, setMode] = useState<RenderMode>("native");
  const [lights, setLights] = useState(true);
  const [cozy, setCozy] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const stateRef = useRef({ time: 18.5, auto: true, season: "spring" as Season, weather: "clear" as Weather, mode: "native" as RenderMode, lights: true, cozy: true });
  const systems = useRef<{ r: SceneRenderer; s: THREE.Scene; c: THREE.PerspectiveCamera; b: BedroomScene; t: TimeSystem } | null>(null);

  const updateState = (patch: Partial<typeof stateRef.current>) => {
    Object.assign(stateRef.current, patch);
  };

  useEffect(() => {
    const host = mount.current;
    if (!host) return;

    let raf = 0;
    let disposed = false;

    try {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
      camera.position.set(8.8, 5.4, 9.8);
      camera.lookAt(0, 1.5, 0);

      const renderer = new SceneRenderer(host);
      const bedroom = new BedroomScene(scene);
      const timeSystem = new TimeSystem(scene);
      scene.background = new THREE.Color(0x8ca6b2);

      systems.current = { r: renderer, s: scene, c: camera, b: bedroom, t: timeSystem };

      const controls = { drag: false, x: 0, y: 0, dist: 15 };
      const canvas = renderer.renderer.domElement;
      const target = new THREE.Vector3(0, 1.5, 0);

      const updateCamera = () => {
        camera.lookAt(target);
      };

      const pointer = (e: PointerEvent) => {
        if (e.type === "pointerdown") {
          controls.drag = true;
          controls.x = e.clientX;
          controls.y = e.clientY;
          canvas.setPointerCapture?.(e.pointerId);
          return;
        }
        if (e.type === "pointerup" || e.type === "pointercancel") {
          controls.drag = false;
          return;
        }
        if (e.type === "pointermove" && controls.drag) {
          const dx = e.clientX - controls.x;
          const dy = e.clientY - controls.y;
          camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), dx * -0.006);
          camera.position.y = Math.max(1.2, Math.min(7, camera.position.y + (controls.y - e.clientY) * 0.015));
          controls.x = e.clientX;
          controls.y = e.clientY;
          updateCamera();
        }
      };

      const wheel = (e: WheelEvent) => {
        e.preventDefault();
        controls.dist = Math.max(7, Math.min(19, controls.dist + e.deltaY * 0.012));
        camera.position.setLength(controls.dist);
        updateCamera();
      };

      canvas.addEventListener("pointerdown", pointer);
      canvas.addEventListener("pointerup", pointer);
      canvas.addEventListener("pointercancel", pointer);
      canvas.addEventListener("pointermove", pointer);
      canvas.addEventListener("wheel", wheel, { passive: false });

      const resize = () => {
        const w = Math.max(1, host.clientWidth);
        const h = Math.max(1, host.clientHeight);
        camera.aspect = w / h;
        camera.fov = w < h ? 58 : 48;
        camera.updateProjectionMatrix();
        renderer.resize(w, h);
      };

      resize();
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(host);

      let last = performance.now();
      const loop = (now: number) => {
        if (disposed) return;

        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        const state = stateRef.current;

        timeSystem.auto = state.auto;
        timeSystem.time = state.time;
        const env = timeSystem.update(dt);

        if (state.auto) {
          state.time = timeSystem.time;
          setTime(timeSystem.time);
        }

        bedroom.updateWeather(state.weather);
        bedroom.updateSeason(state.season);
        bedroom.setCozyMode(state.cozy);
        bedroom.tick(now / 1000);

        const day = env.daylight;
        const dusk = env.dusk;
        scene.background = new THREE.Color().lerpColors(
          new THREE.Color(0x10172c),
          new THREE.Color(0x9fc4d5),
          Math.min(1, day + 0.18)
        );
        if (dusk > 0.1) {
          scene.background.lerp(new THREE.Color(0xd58c70), dusk * 0.65);
        }

        if (!state.lights) {
          timeSystem.main.intensity = 0;
          timeSystem.bedside.intensity = 0;
          timeSystem.desk.intensity = 0;
          timeSystem.cozy.intensity = 0;
        }

        renderer.setPixelMode(state.mode === "pixel");
        renderer.render(scene, camera);
        raf = requestAnimationFrame(loop);
      };

      raf = requestAnimationFrame(loop);

      return () => {
        disposed = true;
        cancelAnimationFrame(raf);
        resizeObserver.disconnect();
        canvas.removeEventListener("pointerdown", pointer);
        canvas.removeEventListener("pointerup", pointer);
        canvas.removeEventListener("pointercancel", pointer);
        canvas.removeEventListener("pointermove", pointer);
        canvas.removeEventListener("wheel", wheel);
        renderer.dispose();
        systems.current = null;
      };
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Unknown WebGL error");
    }
  }, []);

  const L = text[lang];
  const hh = Math.floor(time).toString().padStart(2, "0");
  const mm = Math.floor((time % 1) * 60).toString().padStart(2, "0");

  const capture = () => {
    const renderer = systems.current?.r.renderer;
    if (!renderer) return;
    const a = document.createElement("a");
    a.href = renderer.domElement.toDataURL("image/png");
    a.download = `bedroom-${hh}${mm}.png`;
    a.click();
  };

  const reset = () => {
    const c = systems.current?.c;
    if (c) {
      c.position.set(8.8, 5.4, 9.8);
      c.lookAt(0, 1.5, 0);
    }
  };

  const fs = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen?.();
    } catch (e) {
      console.warn("Fullscreen is unavailable:", e);
    }
  };

  const changeTime = (value: number) => {
    updateState({ time: value, auto: false });
    setTime(value);
    setAuto(false);
  };

  const changeAuto = () => {
    const next = !stateRef.current.auto;
    updateState({ auto: next });
    setAuto(next);
  };

  return (
    <main className="app">
      <div ref={mount} className="scene" />

      {error && (
        <div className="fatal">
          <div className="fatal-box">
            <strong>{L.webglError}</strong>
            <p>{error}</p>
            <small>请检查浏览器是否启用硬件加速 / WebGL，并打开开发者工具查看 Console。</small>
          </div>
        </div>
      )}

      <header className="top">
        <span className="brand">QUIET ROOM</span>
        <span>{L.time} · {hh}:{mm}</span>
        <span>{seasonLabels[lang][season]} · {weatherLabels[lang][weather]}</span>
      </header>

      <section className="controls">
        <div className="time">
          <input
            aria-label="time"
            type="range"
            min="0"
            max="24"
            step=".01"
            value={time}
            onChange={e => changeTime(+e.target.value)}
          />
          <button onClick={changeAuto}>{auto ? L.pause : L.play}</button>
        </div>

        <div className="row">
          <select value={season} onChange={e => {
            const value = e.target.value as Season;
            updateState({ season: value });
            setSeason(value);
          }}>
            {(["spring", "summer", "autumn", "winter"] as Season[]).map(x => (
              <option key={x} value={x}>{seasonLabels[lang][x]}</option>
            ))}
          </select>

          <select value={weather} onChange={e => {
            const value = e.target.value as Weather;
            updateState({ weather: value });
            setWeather(value);
          }}>
            {(["clear", "cloudy", "rain", "snow"] as Weather[]).map(x => (
              <option key={x} value={x}>{weatherLabels[lang][x]}</option>
            ))}
          </select>

          <button className={lights ? "active" : ""} onClick={() => {
            const value = !stateRef.current.lights;
            updateState({ lights: value });
            setLights(value);
          }}>◐ {L.light}</button>

          <button className={cozy ? "active" : ""} onClick={() => {
            const value = !stateRef.current.cozy;
            updateState({ cozy: value });
            setCozy(value);
          }}>☼ {L.cozy}</button>

          <button onClick={() => {
            const value = stateRef.current.mode === "native" ? "pixel" : "native";
            updateState({ mode: value });
            setMode(value);
          }}>◈ {mode === "native" ? L.native : L.pixel}</button>
        </div>

        <div className="row">
          <button onClick={capture}>⌁ {L.screenshot}</button>
          <button onClick={fs}>□ {L.fullscreen}</button>
          <button onClick={reset}>↺ {L.reset}</button>
          <button onClick={() => {
            const value = lang === "zh" ? "en" : "zh";
            setLang(value);
          }}>中 / EN</button>
        </div>
      </section>
    </main>
  );
}
