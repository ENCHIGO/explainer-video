// 讲解视频模板：内容来自 src/episode.json（scripts/plan.py 生成），品牌来自 src/brand.json，这里只管画面。
// 镜头类型：cover 封面 / title 小节标题 / flow 三栏流程 / screen 录屏推近 / cards 成果卡片 / points 要点宫格 / close 收尾
import React from "react";
import { AbsoluteFill, Audio, Easing, Freeze, Img, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame } from "remotion";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import data from "./episode.json";
import brand from "./brand.json";

const XF = 8; // 转场帧数（与 plan.py 一致）
const VO_AT = 4; // 配音在镜头开始后第几帧进
const KIT = 90; // 片头/片尾各 3 秒（与 plan.py 一致）
const FONT = '"PingFang SC","Hiragino Sans GB",system-ui,sans-serif';
// 品牌色全部来自 brand.json；换品牌只改那个文件。
const C = brand.colors;
export const B = {
  teal: C.primary, cyan: C.accent, green: C.accent2, ink: C.ink, sub: C.sub, line: C.line, bg: C.bg,
  grad: `linear-gradient(120deg, ${C.gradFrom} 0%, ${C.accent} 45%, ${C.accent2} 100%)`,
};
const hex = (h: string, a: number) => `rgba(${parseInt(h.slice(1, 3), 16)},${parseInt(h.slice(3, 5), 16)},${parseInt(h.slice(5, 7), 16)},${a})`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Beat = { type: string; vo?: string; audio?: string; dur: number; vlen: number; [k: string]: any };
type Ep = { series: string; label: string; intro?: boolean; outro?: boolean; music?: string; musicFrames?: number; beats: Beat[] };
const EP = data as unknown as Ep;
const hasIntro = EP.intro !== false, hasOutro = EP.outro !== false;

const lens = () => [...(hasIntro ? [KIT] : []), ...EP.beats.map((b) => b.dur), ...(hasOutro ? [KIT] : [])];
export const episodeFrames = () => { const l = lens(); return l.reduce((a, b) => a + b, 0) - XF * (l.length - 1); };

const ease = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const pad2 = (n: number) => String(n).padStart(2, "0");
const useIn = (at: number, dur = 10, dist = 28) => {
  const f = useCurrentFrame();
  const t = interpolate(f, [at, at + dur], [0, 1], { ...ease, easing: Easing.out(Easing.cubic) });
  return { opacity: t, transform: `translateY(${(1 - t) * dist}px)` };
};
const Grad: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <span style={{ background: B.grad, WebkitBackgroundClip: "text", color: "transparent", ...style }}>{children}</span>
);

// ---------- 品牌底板 ----------
const BG: React.FC = () => (
  <AbsoluteFill style={{ background: B.bg, overflow: "hidden" }}>
    <div style={{ position: "absolute", width: 1400, height: 1400, right: -420, top: -520, borderRadius: "50%", background: `radial-gradient(circle, ${hex(C.accent, 0.28)}, ${hex(C.accent, 0)} 65%)` }} />
    <div style={{ position: "absolute", width: 1100, height: 1100, left: -380, bottom: -560, borderRadius: "50%", background: `radial-gradient(circle, ${hex(C.accent2, 0.22)}, ${hex(C.accent2, 0)} 65%)` }} />
    <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(${hex(C.primary, 0.13)} 1.6px, transparent 1.6px)`, backgroundSize: "34px 34px" }} />
  </AbsoluteFill>
);
// 品牌标：有 logo 用 logo，没有就用品牌名首字做一个渐变方块
const Mark: React.FC<{ size: number; radius?: number }> = ({ size, radius = 0.28 }) => (brand.logo
  ? <Img src={staticFile(brand.logo)} style={{ width: size, height: size, borderRadius: size * radius }} />
  : <div style={{ width: size, height: size, borderRadius: size * radius, background: B.grad, color: "#fff", fontFamily: FONT, fontWeight: 900, fontSize: size * 0.55, display: "flex", alignItems: "center", justifyContent: "center" }}>{brand.name.slice(0, 1)}</div>);
const Lockup: React.FC<{ size?: number }> = ({ size = 1 }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 16 * size, fontFamily: FONT }}>
    <Mark size={64 * size} />
    <div style={{ fontSize: 40 * size, fontWeight: 700, color: B.ink, letterSpacing: 2 }}>{brand.name}</div>
    <div style={{ width: 2, height: 30 * size, background: B.line }} />
    <div style={{ fontSize: 24 * size, color: B.sub, letterSpacing: 1 }}>{brand.tagline}</div>
  </div>
);
const Pill: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ display: "inline-flex", alignItems: "center", gap: 12, padding: "8px 22px 8px 8px", borderRadius: 999, background: B.grad, color: "#fff", fontFamily: FONT, fontSize: 26, fontWeight: 600 }}>
    <div style={{ background: "#fff", borderRadius: 12, padding: 3 }}><Mark size={34} /></div>{text}
  </div>
);
// 字幕条：头像（brand.avatar，没有就用品牌标）+ 当前配音原文
const Caption: React.FC<{ text?: string }> = ({ text }) => (text ? (
  <div style={{ position: "absolute", left: 160, right: 160, bottom: 34, display: "flex", alignItems: "center", gap: 18, padding: "14px 30px 14px 14px", borderRadius: 20, background: "rgba(255,255,255,.92)", boxShadow: "0 12px 40px rgba(15,42,51,.12)", border: `1.5px solid ${B.line}`, fontFamily: FONT }}>
    {brand.avatar ? <Img src={staticFile(brand.avatar)} style={{ width: 64, height: 64 }} /> : <Mark size={56} />}
    <div style={{ fontSize: 32, lineHeight: 1.4, color: B.ink }}>{text}</div>
  </div>
) : null);
const Art: React.FC<{ src: string; dur: number; style?: React.CSSProperties }> = ({ src, dur, style }) => {
  const f = useCurrentFrame();
  const s = interpolate(f, [0, dur], [1.04, 1.16], ease), x = interpolate(f, [0, dur], [0, -30], ease);
  return <div style={{ position: "absolute", inset: 0, overflow: "hidden", ...style }}><Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `translateX(${x}px) scale(${s})` }} /></div>;
};
const Header: React.FC<{ b: Beat }> = ({ b }) => (
  <>
    <div style={{ position: "absolute", left: 80, top: 44, display: "flex", alignItems: "center", gap: 18, fontFamily: FONT, ...useIn(0, 8) }}>
      {b.tag && <div style={{ padding: "8px 22px", borderRadius: 999, background: B.grad, color: "#fff", fontSize: 26, fontWeight: 800 }}>{b.tag}</div>}
      <div style={{ fontSize: 28, color: B.sub }}>{EP.label}{b.header ? <> · <span style={{ color: B.ink, fontWeight: 700 }}>{b.header}</span></> : null}</div>
    </div>
    <div style={{ position: "absolute", right: 80, top: 46, ...useIn(2, 8) }}><Lockup size={0.65} /></div>
  </>
);

// 片头/片尾：代码生成的品牌标版（品牌标弹入 + 光带扫过 + 名称与一句话），不依赖任何视频素材
const Sting: React.FC<{ line: string; out?: boolean }> = ({ line, out }) => {
  const f = useCurrentFrame();
  const m = spring({ frame: f - 4, fps: 30, config: { damping: 12, mass: 0.8 } });
  const ring = interpolate(f, [0, 40], [0.6, 1.6], { ...ease, easing: Easing.out(Easing.cubic) });
  const sweep = interpolate(f, [10, 60], [-40, 140], ease);
  const fadeOut = out ? interpolate(f, [KIT - 18, KIT - 2], [0, 1], ease) : 0;
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <BG />
      <div style={{ position: "absolute", left: 960 - 360, top: 540 - 360, width: 720, height: 720, borderRadius: "50%", border: `6px solid ${hex(C.accent, 0.35 * (1.6 - ring))}`, transform: `scale(${ring})` }} />
      <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 30 }}>
        <div style={{ transform: `scale(${m})`, boxShadow: `0 30px 80px ${hex(C.primary, 0.3)}`, borderRadius: 48 }}><Mark size={170} /></div>
        <div style={{ fontSize: 110, fontWeight: 900, letterSpacing: 8, ...useIn(12, 12, 30) }}><Grad>{brand.name}</Grad></div>
        <div style={{ fontSize: 44, color: B.ink, letterSpacing: 8, ...useIn(20, 12, 20) }}>{line}</div>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: `linear-gradient(105deg, rgba(255,255,255,0) ${sweep - 10}%, rgba(255,255,255,.6) ${sweep}%, rgba(255,255,255,0) ${sweep + 10}%)` }} />
      <AbsoluteFill style={{ background: "#fff", opacity: fadeOut }} />
    </AbsoluteFill>
  );
};

// ---------- 镜头 ----------
const Cover: React.FC<{ b: Beat }> = ({ b }) => {
  const f = useCurrentFrame();
  const sweep = interpolate(f, [4, 54], [-60, 160], ease);
  return (
    <AbsoluteFill style={{ fontFamily: FONT, background: B.bg }}>
      {b.art ? <Art src={b.art} dur={b.dur} /> : <BG />}
      <AbsoluteFill style={{ background: `linear-gradient(90deg, ${hex(C.bg, 0.97)} 0%, ${hex(C.bg, 0.93)} 36%, ${hex(C.bg, 0.35)} 62%, ${hex(C.bg, 0)} 78%)` }} />
      <AbsoluteFill style={{ background: `linear-gradient(105deg, rgba(255,255,255,0) ${sweep - 12}%, rgba(255,255,255,.55) ${sweep}%, rgba(255,255,255,0) ${sweep + 12}%)` }} />
      <div style={{ position: "absolute", left: 120, top: 70, ...useIn(0) }}><Lockup size={0.8} /></div>
      <div style={{ position: "absolute", left: 120, top: 230 }}>
        <div style={{ fontSize: 30, letterSpacing: 10, color: B.teal, fontWeight: 700, ...useIn(3) }}>{b.eyebrow}</div>
        <div style={{ marginTop: 14, fontSize: 140, fontWeight: 900, color: B.ink, lineHeight: 1.05, ...useIn(6, 12, 40) }}>{b.title}</div>
        <div style={{ marginTop: 18, width: 420 * interpolate(f, [12, 32], [0, 1], ease), height: 10, borderRadius: 5, background: B.grad }} />
        <div style={{ marginTop: 26, fontSize: 34, color: B.sub, ...useIn(14) }}>{b.subtitle}</div>
        <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 16 }}>
          {((b.items ?? []) as string[][]).map(([main, sub], i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 18, ...useIn(22 + i * 6, 10, 20) }}>
              <div style={{ width: 54, height: 54, borderRadius: 14, background: B.grad, color: "#fff", fontSize: 26, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{pad2(i + 1)}</div>
              <div style={{ fontSize: 40, fontWeight: 700, color: B.ink }}>{main}</div>
              {sub && <div style={{ fontSize: 26, color: B.sub }}>{sub}</div>}
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Title: React.FC<{ b: Beat }> = ({ b }) => {
  const f = useCurrentFrame();
  const m = spring({ frame: f - 2, fps: 30, config: { damping: 15, mass: 0.8 } });
  const chars = Array.from((b.line ?? "") as string);
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <BG />
      <div style={{ position: "absolute", right: 80, top: 46, ...useIn(2, 8) }}><Lockup size={0.65} /></div>
      {b.art && (
        <div style={{ position: "absolute", right: 100, top: 160, width: 700, height: 620, borderRadius: 32, overflow: "hidden", boxShadow: "0 40px 90px rgba(15,42,51,.18)", opacity: m, transform: `translateX(${(1 - m) * 120}px) rotate(${(1 - m) * 4}deg)` }}>
          <Art src={b.art} dur={b.dur} />
        </div>
      )}
      <div style={{ position: "absolute", left: 110, top: 150, width: b.art ? 1000 : 1700 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 22, ...useIn(0, 8) }}>
          {b.num != null && <Grad style={{ fontSize: 150, fontWeight: 900, lineHeight: 1 }}>{pad2(b.num)}</Grad>}
          {b.tag && <Pill text={b.tag} />}
        </div>
        <div style={{ marginTop: 24, fontSize: 100, fontWeight: 900, color: B.ink, lineHeight: 1.1, ...useIn(4, 10, 36) }}>{b.title}</div>
        <div style={{ marginTop: 46, fontSize: 52, fontWeight: 800, color: B.ink, lineHeight: 1.45 }}>
          {chars.map((c, i) => {
            const t = interpolate(f, [12 + i * 0.8, 18 + i * 0.8], [0, 1], ease);
            return <span key={i} style={{ display: "inline-block", opacity: t, transform: `translateY(${(1 - t) * 22}px)` }}>{c}</span>;
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Flow: React.FC<{ b: Beat }> = ({ b }) => {
  const f = useCurrentFrame();
  const span = b.dur - 24;
  const left: string[] = b.left ?? [], mid: string[] = b.mid ?? [], right: string[] = b.right ?? [];
  const [lA, lB, lC] = (b.labels as string[]) ?? ["你提供", `${brand.name}来做`, "你拿到"];
  const tm = (i: number) => 4 + i * 5, ts = (i: number) => Math.round(span * 0.28) + i * Math.round((span * 0.4) / Math.max(1, mid.length)), tr = (i: number) => Math.round(span * 0.7) + i * 5;
  const TOP = 200, H = 640;
  const item = (t: string, at: number, i: number) => (
    <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 22px", borderRadius: 16, background: "#fff", border: `1.5px solid ${B.line}`, boxShadow: "0 10px 26px rgba(15,42,51,.07)", fontSize: 31, fontWeight: 700, color: B.ink, ...useIn(at, 10, 20) }}>
      <div style={{ width: 12, height: 12, borderRadius: 6, background: B.grad, flexShrink: 0 }} />{t}
    </div>
  );
  const arrow = (x: number, at: number) => {
    const d = interpolate(f, [at, at + 14], [0, 1], ease);
    return (
      <svg key={x} style={{ position: "absolute", left: x, top: TOP + H / 2 - 40, overflow: "visible" }} width={90} height={80}>
        <line x1={0} y1={40} x2={70 * d} y2={40} stroke={B.cyan} strokeWidth={6} strokeLinecap="round" strokeDasharray="2 14" strokeDashoffset={-f * 1.5} />
        <path d="M60 22 L84 40 L60 58" fill="none" stroke={B.cyan} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" opacity={d} />
      </svg>
    );
  };
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <BG /><Header b={b} />
      {[{ x: 90, w: 500, h: lA, a: 0 }, { x: 700, w: 520, h: lB, a: ts(0) - 12 }, { x: 1330, w: 500, h: lC, a: tr(0) - 10 }].map((c) => (
        <div key={c.x} style={{ position: "absolute", left: c.x, top: TOP - 62, width: c.w, textAlign: "center", fontSize: 30, letterSpacing: 6, fontWeight: 800, color: B.teal, ...useIn(c.a, 10, 12) }}>{c.h}</div>
      ))}
      <div style={{ position: "absolute", left: 90, top: TOP, width: 500, height: H, display: "flex", flexDirection: "column", justifyContent: "center", gap: 18 }}>{left.map((t, i) => item(t, tm(i), i))}</div>
      {arrow(600, ts(0) - 18)}
      <div style={{ position: "absolute", left: 700, top: TOP, width: 520, height: H, padding: 3, borderRadius: 30, background: B.grad, boxShadow: `0 30px 80px ${hex(C.primary, 0.25)}`, ...useIn(ts(0) - 14, 12, 20) }}>
        <div style={{ width: "100%", height: "100%", borderRadius: 27, background: "#fff", padding: 34, boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "center", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
            <Mark size={58} />
            <div style={{ fontSize: 34, fontWeight: 900, color: B.ink }}>{brand.name}</div>
            <div style={{ marginLeft: "auto", fontSize: 22, color: B.sub }}>{f < ts(mid.length - 1) + 20 ? "处理中…" : "完成"}</div>
          </div>
          {mid.map((s, i) => {
            const on = interpolate(f, [ts(i), ts(i) + 10], [0, 1], ease), done = f > ts(i) + 18;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 18px", borderRadius: 16, background: `${hex(C.accent, 0.04 + on * 0.1)}`, border: `2px solid ${on > 0.5 ? B.cyan : B.line}`, opacity: 0.35 + on * 0.65 }}>
                <div style={{ width: 44, height: 44, borderRadius: 22, background: done ? B.grad : on > 0.5 ? B.cyan : B.line, color: "#fff", fontSize: 24, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{done ? "✓" : i + 1}</div>
                <div style={{ fontSize: 31, fontWeight: 700, color: B.ink }}>{s}</div>
              </div>
            );
          })}
        </div>
      </div>
      {arrow(1232, tr(0) - 18)}
      <div style={{ position: "absolute", left: 1330, top: TOP, width: 500, height: H, display: "flex", flexDirection: "column", justifyContent: "center", gap: 18 }}>{right.map((t, i) => item(t, tr(i), i))}</div>
    </AbsoluteFill>
  );
};

// 录屏/截图：先看全貌，再推近到 focus=[x, y, 放大倍数]（坐标按画面原始尺寸 clipSize 计）
const Screen: React.FC<{ b: Beat }> = ({ b }) => {
  const f = useCurrentFrame();
  const [cw, ch] = (b.clipSize as number[]) ?? [1920, 1050];
  const [fx1, fy1, z1] = (b.focus as number[]) ?? [cw / 2, ch / 2, 1];
  const W = 1440, H = Math.round((W * ch) / cw);
  const k = (a: number, z: number) => interpolate(f, [2, 32], [a, z], { ...ease, easing: Easing.inOut(Easing.cubic) });
  const z = k(1, z1), fx = k(cw / 2, fx1), fy = k(ch / 2, fy1), s = (W / cw) * z;
  const tx = Math.min(0, Math.max(W - cw * s, W / 2 - fx * s)), ty = Math.min(0, Math.max(H - ch * s, H / 2 - fy * s));
  const from = Math.round((b.from ?? 0) * 30), len = Math.round((b.clipSeconds ?? 9999) * 30);
  // 录屏视频用 clip，静态截图用 image
  const v = b.image ? <Img src={staticFile(b.image)} style={{ width: cw, height: ch }} /> : <OffthreadVideo src={staticFile(b.clip)} startFrom={from} muted style={{ width: cw, height: ch }} />;
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <BG /><Header b={b} />
      <div style={{ position: "absolute", left: (1920 - W) / 2, top: 130, width: W, height: Math.min(H, 790), borderRadius: 24, overflow: "hidden", background: "#fff", border: `1.5px solid ${B.line}`, boxShadow: "0 40px 90px rgba(15,42,51,.18)", ...useIn(0, 10, 20) }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: cw, height: ch, transformOrigin: "0 0", transform: `translate(${tx}px, ${ty}px) scale(${s})` }}>
          {b.image || f < len - from - 2 ? v : <Freeze frame={Math.max(0, len - from - 3)}>{v}</Freeze>}
        </div>
      </div>
      {b.tip && <div style={{ position: "absolute", right: 150, top: 820, padding: "14px 28px", borderRadius: 16, background: B.ink, color: "#fff", fontSize: 30, fontWeight: 700, ...useIn(36, 10, 16) }}>{b.tip}</div>}
    </AbsoluteFill>
  );
};

const Cards: React.FC<{ b: Beat }> = ({ b }) => {
  const f = useCurrentFrame();
  const cards: string[] = b.cards ?? [];
  const w = Math.min(320, (1700 - 40 * (cards.length - 1)) / cards.length);
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <BG /><Header b={b} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 180, display: "flex", justifyContent: "center", gap: 40, perspective: 1600 }}>
        {cards.map((t, i) => {
          const m = spring({ frame: f - 3 - i * 4, fps: 30, config: { damping: 14, mass: 0.7 } });
          return (
            <div key={i} style={{ position: "relative", width: w, height: 420, borderRadius: 24, background: "#fff", border: `1.5px solid ${B.line}`, boxShadow: "0 30px 70px rgba(15,42,51,.14)", overflow: "hidden", opacity: m, transform: `translateY(${(1 - m) * 120}px) rotateY(${(1 - m) * 40}deg) rotateZ(${(i - (cards.length - 1) / 2) * 1.2}deg)` }}>
              <div style={{ height: 14, background: B.grad }} />
              <div style={{ padding: "30px 28px" }}>
                <div style={{ fontSize: 22, color: B.teal, fontWeight: 700, letterSpacing: 2 }}>{b.cardLabel ?? "成果"} {pad2(i + 1)}</div>
                <div style={{ marginTop: 14, fontSize: 36, fontWeight: 900, color: B.ink, lineHeight: 1.3, minHeight: 94 }}>{t}</div>
                {[0.92, 0.78, 0.86, 0.6].map((k, j) => <div key={j} style={{ marginTop: 18, height: 12, borderRadius: 6, width: `${k * 100}%`, background: j === 0 ? hex(C.accent, 0.25) : hex(C.line, 0.6) }} />)}
              </div>
              <div style={{ position: "absolute", right: 22, bottom: 22, width: 60, height: 60, borderRadius: 30, background: B.grad, color: "#fff", fontSize: 32, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${spring({ frame: f - 14 - i * 4, fps: 30, config: { damping: 10 } })})` }}>✓</div>
            </div>
          );
        })}
      </div>
      {b.note && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 650, display: "flex", justifyContent: "center", ...useIn(Math.min(40, b.dur * 0.35), 10, 20) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "16px 34px 16px 16px", borderRadius: 999, background: "#fff", border: `2px solid ${B.cyan}` }}>
            <div style={{ width: 52, height: 52, borderRadius: 26, background: B.grad, color: "#fff", fontSize: 34, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>!</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: B.ink }}>{b.note}</div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// 要点宫格：按配音进度依次点亮
const Points: React.FC<{ b: Beat }> = ({ b }) => {
  const f = useCurrentFrame();
  const items: string[][] = b.items ?? [];
  const cols = items.length <= 4 ? items.length : 3;
  const at = (i: number) => Math.round(b.vlen * 0.12) + i * Math.round((b.vlen * 0.8) / Math.max(1, items.length));
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <BG /><Header b={b} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 130, textAlign: "center", fontSize: 64, fontWeight: 900, color: B.ink, ...useIn(3) }}>{b.title}</div>
      <div style={{ position: "absolute", left: 160, right: 160, top: 280, display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 30 }}>
        {items.map(([big, small], i) => {
          const on = interpolate(f, [at(i), at(i) + 10], [0, 1], ease);
          return (
            <div key={i} style={{ padding: "34px 34px", borderRadius: 24, background: "#fff", border: `2px solid ${on > 0.5 ? B.cyan : B.line}`, boxShadow: `0 20px 50px ${hex(C.primary, 0.05 + on * 0.16)}`, ...useIn(4 + i * 3, 10, 20) }}>
              <Grad style={{ fontSize: 44, fontWeight: 900 }}>{pad2(i + 1)}</Grad>
              <div style={{ marginTop: 6, fontSize: 44, fontWeight: 900, color: B.ink }}>{big}</div>
              {small && <div style={{ marginTop: 8, fontSize: 30, color: B.sub, lineHeight: 1.4 }}>{small}</div>}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const Close: React.FC<{ b: Beat }> = ({ b }) => (
  <AbsoluteFill style={{ fontFamily: FONT }}>
    {b.art ? <Art src={b.art} dur={b.dur} /> : <BG />}
    <AbsoluteFill style={{ background: hex(C.bg, 0.86) }} />
    <div style={{ position: "absolute", left: 0, right: 0, top: 120, display: "flex", justifyContent: "center", ...useIn(0) }}><Lockup size={0.9} /></div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 250, textAlign: "center", fontSize: 32, letterSpacing: 10, color: B.teal, fontWeight: 800, ...useIn(3) }}>{EP.label} · 回顾</div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 330, display: "flex", justifyContent: "center", gap: 22, flexWrap: "wrap" }}>
      {((b.items ?? []) as string[]).map((t, i) => (
        <div key={i} style={{ padding: "18px 32px", borderRadius: 20, background: "#fff", border: `1.5px solid ${B.line}`, fontSize: 40, fontWeight: 800, color: B.ink, ...useIn(8 + i * 5) }}><span style={{ color: B.teal }}>✓ </span>{t}</div>
      ))}
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 520, textAlign: "center", fontSize: 76, fontWeight: 900, color: B.ink, ...useIn(24, 12) }}>{b.title}</div>
  </AbsoluteFill>
);

const SHOTS: Record<string, React.FC<{ b: Beat }>> = { cover: Cover, title: Title, flow: Flow, screen: Screen, cards: Cards, points: Points, close: Close };
// 进入新小节/流程用滑入，其他用快速淡入淡出
const SLIDE = new Set(["title", "flow", "close"]);

export const Episode: React.FC = () => {
  const total = episodeFrames();
  const st = lens().reduce<number[]>((acc, _, i, l) => (i === 0 ? [0] : [...acc, acc[i - 1] + l[i - 1] - XF]), []);
  const off = hasIntro ? 1 : 0;
  const win = EP.beats.map((b, i) => [st[i + off] + VO_AT, st[i + off] + VO_AT + b.vlen]);
  // 有人声时音乐压到一半，节奏不断；首尾淡入淡出
  const vol = (abs: number) => (win.some(([a, z]) => abs >= a - 8 && abs <= z + 8) ? 0.2 : 0.4) * interpolate(abs, [0, 20, total - 60, total - 4], [0, 1, 1, 0], ease);
  const ML = EP.musicFrames || 3483;
  const segs = EP.music ? Array.from({ length: Math.ceil(total / (ML - 240)) }, (_, i) => i * (ML - 240)) : [];
  return (
    <AbsoluteFill style={{ background: "#fff" }}>
      <TransitionSeries>
        {hasIntro && <TransitionSeries.Sequence durationInFrames={KIT}><Sting line={brand.tagline} /></TransitionSeries.Sequence>}
        {EP.beats.map((b, i) => {
          const Shot = SHOTS[b.type];
          return (
            <React.Fragment key={i}>
              {(i > 0 || hasIntro) && (SLIDE.has(b.type)
                ? <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: XF, easing: Easing.inOut(Easing.cubic) })} />
                : <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: XF })} />)}
              <TransitionSeries.Sequence durationInFrames={b.dur}>
                <AbsoluteFill><Shot b={b} /><Caption text={b.caption ?? b.vo} /></AbsoluteFill>
              </TransitionSeries.Sequence>
            </React.Fragment>
          );
        })}
        {hasOutro && <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: XF })} />}
        {hasOutro && <TransitionSeries.Sequence durationInFrames={KIT}><Sting line={brand.outroLine} out /></TransitionSeries.Sequence>}
      </TransitionSeries>
      {EP.beats.map((b, i) => (b.audio ? <Sequence key={i} from={st[i + off] + VO_AT}><Audio src={staticFile(b.audio)} /></Sequence> : null))}
      {segs.map((at, i) => (
        <Sequence key={at} from={at} durationInFrames={ML}>
          <Audio src={staticFile(EP.music!)} volume={(lf) => vol(at + lf) * interpolate(lf, [0, i === 0 ? 1 : 240, ML - 240, ML], [i === 0 ? 1 : 0, 1, 1, 0], ease)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
