"use client";

// Comfort settings, with the thing being tuned drawn live above the slider.
//
// A number on a slider is meaningless here — "dust size 1.5" tells you nothing about
// whether you will see a mote on a sunlit phone. So the preview is the real control:
// it draws the actual sky, an actual anchor, actual motes and the actual Prism at the
// current values, with the bottom quarter shaded when the thumb zone is on. You judge
// it with your eyes, which is how Fab judges everything else in this game.

import { useEffect, useRef } from "react";

import { drawAnchor, drawDustMote, drawGarlandGem, drawParallax, drawPrism, drawSky } from "@/game/v3/art/draw";
import { skyAt } from "@/game/v3/art/palette";
import { THUMB_BAND } from "@/game/v3/proto.constants";
import { audio } from "@/game/v3/audio";
import { t } from "@/game/v3/i18n";
import { clearGhost, loadGhost } from "@/game/v3/ghost";
import {
  CameraMode,
  patchSettings,
  resetSettings,
  SCALE_MAX,
  SCALE_MIN,
  SCALE_STEP,
  Settings,
} from "@/game/v3/settings";

import { useSettings } from "./useSettings";

const PREVIEW_W = 300;
const PREVIEW_H = 190;

function Preview({ s }: { s: Settings }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = PREVIEW_W;
    canvas.height = PREVIEW_H;

    const sky = skyAt(120);
    const cam = {
      camY: 0,
      viewW: PREVIEW_W,
      viewH: PREVIEW_H,
      toScreen: (worldY: number) => PREVIEW_H / 2 - worldY,
    };

    let raf = 0;
    const t0 = performance.now();
    const frame = (now: number) => {
      const time = (now - t0) / 1000;
      drawSky(ctx, cam, sky, time);
      drawParallax(ctx, cam, sky);

      // One anchor with its highlight, so the halo size is judged too
      drawAnchor(ctx, 74, 62, sky.light, false, true, false, time, s.anchorScale);
      drawAnchor(ctx, 232, 44, sky.light, true, false, true, time, s.anchorScale);

      // A line of plain motes and one garland gem — the pair you have to tell apart
      for (let i = 0; i < 5; i++) {
        drawDustMote(ctx, 46 + i * 34, 128 - Math.sin(i) * 9, time, s.dustScale);
      }
      drawGarlandGem(ctx, 246, 126, time, 2, s.dustScale);

      drawPrism(ctx, 150, 96, {
        vx: 40,
        vy: 260,
        scale: 1.35 * s.prismScale,
        tumbling: 0,
        tethered: false,
        hangAngle: null,
        facing: 1,
        wingBoost: 0,
        flapPulse: Math.max(0, Math.sin(time * 2.2)),
        justAttached: 0,
        justReleased: 0,
        light: sky.light,
        time,
      });

      // The thumb band, shown as the dead zone it is
      if (s.thumbGuard) {
        const top = PREVIEW_H * (1 - THUMB_BAND);
        ctx.fillStyle = "rgba(0,0,0,0.42)";
        ctx.fillRect(0, top, PREVIEW_W, PREVIEW_H - top);
        ctx.strokeStyle = "rgba(255,255,255,0.35)";
        ctx.setLineDash([4, 5]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, top);
        ctx.lineTo(PREVIEW_W, top);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [s]);

  return <canvas ref={ref} className="proto-preview" aria-label={t("settings.preview")} />;
}

function Slider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="proto-slider">
      <span className="proto-slider-label">{label}</span>
      <input
        type="range"
        min={SCALE_MIN}
        max={SCALE_MAX}
        step={SCALE_STEP}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="proto-slider-value">×{value.toFixed(2)}</span>
    </label>
  );
}

function Toggle({
  label,
  hint,
  on,
  onChange,
  children,
}: {
  label: string;
  hint: string;
  on: boolean;
  onChange: (v: boolean) => void;
  children?: React.ReactNode;
}) {
  return (
    <div className={`proto-toggle${on ? " on" : ""}`}>
      <label className="proto-toggle-row">
        <input
          type="checkbox"
          checked={on}
          onChange={(e) => {
            audio.uiClick();
            onChange(e.target.checked);
          }}
        />
        <span className="proto-toggle-name">{label}</span>
        <span className="proto-toggle-pip" aria-hidden />
      </label>
      <p className="proto-toggle-hint">{hint}</p>
      {children}
    </div>
  );
}

export default function SettingsScreen({
  onBack,
  onHowto,
}: {
  onBack: () => void;
  onHowto: () => void;
}) {
  const s = useSettings();
  const ghost = typeof window === "undefined" ? null : loadGhost();

  const cameras: CameraMode[] = ["chimney", "follow"];

  return (
    <>
      <p className="proto-lottery-title">{t("settings.title")}</p>

      <Preview s={s} />

      <section className="proto-sec proto-settings">
        <h4>{t("settings.sizes")}</h4>
        <Slider
          label={t("settings.dust")}
          value={s.dustScale}
          onChange={(v) => patchSettings("dustScale", v)}
        />
        <Slider
          label={t("settings.anchors")}
          value={s.anchorScale}
          onChange={(v) => patchSettings("anchorScale", v)}
        />
        <Slider
          label={t("settings.prism")}
          value={s.prismScale}
          onChange={(v) => patchSettings("prismScale", v)}
        />
      </section>

      <section className="proto-sec proto-settings">
        <h4>{t("settings.view")}</h4>

        <div className="proto-choice">
          {cameras.map((c) => (
            <button
              key={c}
              className={`proto-choice-btn${s.camera === c ? " picked" : ""}`}
              onPointerEnter={() => audio.uiHover()}
              onClick={() => {
                audio.uiClick();
                patchSettings("camera", c);
              }}
            >
              <span className="proto-choice-name">{t(`settings.camera.${c}`)}</span>
              <span className="proto-choice-hint">{t(`settings.camera.${c}.d`)}</span>
            </button>
          ))}
        </div>

        <Toggle
          label={t("settings.thumb")}
          hint={t("settings.thumb.d")}
          on={s.thumbGuard}
          onChange={(v) => patchSettings("thumbGuard", v)}
        />

        <Toggle
          label={t("settings.ghost")}
          hint={t("settings.ghost.d")}
          on={s.ghost}
          onChange={(v) => patchSettings("ghost", v)}
        >
          <p className="proto-toggle-hint proto-toggle-meta">
            {ghost ? t("settings.ghost.best", { n: ghost.best }) : t("settings.ghost.none")}
            {ghost && (
              <button
                className="proto-inline-btn"
                onClick={() => {
                  audio.uiClick();
                  clearGhost();
                  // Re-render through the settings store rather than local state
                  patchSettings("ghost", s.ghost);
                }}
              >
                {t("settings.ghost.clear")}
              </button>
            )}
          </p>
        </Toggle>
      </section>

      <p className="proto-empty proto-settings-note">{t("settings.note")}</p>

      <button
        className="proto-btn"
        onPointerEnter={() => audio.uiHover()}
        onPointerDown={() => audio.uiClick()}
        onClick={onBack}
      >
        {t("board.back")}
      </button>

      <div className="proto-actions-row">
        <button className="proto-reset" onClick={onHowto}>
          {t("settings.howto")}
        </button>
        <button
          className="proto-reset"
          onClick={() => {
            audio.uiClick();
            resetSettings();
          }}
        >
          {t("settings.reset")}
        </button>
      </div>
    </>
  );
}
