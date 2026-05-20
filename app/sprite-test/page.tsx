"use client";

import { useState } from "react";
import { KeeperSprite, KEEPER_DIVE_FRAME_COUNT } from "@/components/svg/KeeperSprite";

export default function SpriteTestPage() {
  const [size, setSize] = useState(200);
  const [fps, setFps] = useState(24);
  const [showGrid, setShowGrid] = useState(true);
  const [scrubFrame, setScrubFrame] = useState<number | "">("");
  const [playKey, setPlayKey] = useState(0);

  const isScrubbing = scrubFrame !== "";

  return (
    <div className="min-h-screen bg-[#1E1D30] text-white p-6 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-black mb-1">Keeper Dive Sprite Test</h1>
        <p className="text-white/60 text-sm mb-6">
          <strong>File:</strong> <code className="text-amber-300">/public/Keeper_dive_2_sprite.png</code>
          <br />
          Animation มี <span className="text-emerald-300 font-bold tabular-nums">{KEEPER_DIVE_FRAME_COUNT}</span> frames.
          ถ้า frame ไม่ตรง แก้ <code className="text-amber-300">DIVE_FRAMES</code> ใน
          <code className="text-amber-300">src/components/svg/KeeperSprite.tsx</code>
        </p>

        {/* Controls */}
        <div className="bg-white/5 border border-white/10 rounded-md p-4 mb-6 flex flex-col gap-3">
          <label className="text-sm flex items-center gap-3 flex-wrap">
            <span className="w-16 shrink-0">Size:</span>
            <input
              type="range"
              min={80}
              max={400}
              value={size}
              onChange={(e) => setSize(parseInt(e.target.value, 10))}
              className="accent-amber-400 flex-1 min-w-[200px]"
            />
            <span className="tabular-nums w-14">{size}px</span>
          </label>

          <label className="text-sm flex items-center gap-3 flex-wrap">
            <span className="w-16 shrink-0">FPS:</span>
            <input
              type="range"
              min={6}
              max={60}
              value={fps}
              onChange={(e) => setFps(parseInt(e.target.value, 10))}
              className="accent-amber-400 flex-1 min-w-[200px]"
            />
            <span className="tabular-nums w-14">{fps}</span>
          </label>

          <label className="text-sm flex items-center gap-3 flex-wrap">
            <span className="w-16 shrink-0">Frame:</span>
            <input
              type="range"
              min={0}
              max={KEEPER_DIVE_FRAME_COUNT - 1}
              value={isScrubbing ? Number(scrubFrame) : 0}
              onChange={(e) => setScrubFrame(parseInt(e.target.value, 10))}
              className="accent-amber-400 flex-1 min-w-[200px]"
            />
            <span className="tabular-nums w-14">
              {isScrubbing ? scrubFrame : "auto"}
            </span>
            <button
              onClick={() => {
                setScrubFrame("");
                setPlayKey((k) => k + 1);
              }}
              className="text-xs px-3 py-1 bg-emerald-500/25 text-emerald-200 rounded-md font-bold border border-emerald-400/40"
            >
              ▶ Play
            </button>
          </label>

          <label className="text-sm flex items-center gap-2">
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
              className="accent-amber-400"
            />
            แสดง checker grid พื้นหลัง
          </label>
        </div>

        {/* Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <PreviewCard label="DIVE RIGHT" showGrid={showGrid}>
            <KeeperSprite
              key={`right-${playKey}`}
              width={size}
              fps={fps}
              loop
              pausedFrame={isScrubbing ? Number(scrubFrame) : undefined}
            />
          </PreviewCard>

          <PreviewCard label="DIVE LEFT (flipX)" showGrid={showGrid}>
            <KeeperSprite
              key={`left-${playKey}`}
              width={size}
              fps={fps}
              flipX
              loop
              pausedFrame={isScrubbing ? Number(scrubFrame) : undefined}
            />
          </PreviewCard>
        </div>

        {/* Sprite sheet with adjustable grid overlay */}
        <SpriteSheetInspector />

        <div className="bg-white/5 border border-white/10 rounded-md p-4 mt-6 hidden">
          <div className="text-xs uppercase tracking-widest text-white/50 mb-3 font-bold">
            Sprite sheet ต้นฉบับ (raw)
          </div>
          <img
            src="/Keeper_dive_2_sprite.png"
            alt="Keeper dive sprite sheet"
            className="w-full block"
            style={{
              background: "rgba(255,255,255,0.05)",
            }}
          />
        </div>

        <div className="mt-6 text-xs text-white/40 leading-relaxed">
          <strong className="text-white/60">วิธีใช้ใน code:</strong>
          <pre className="bg-black/30 rounded-md p-3 mt-2 text-amber-200 text-[11px] overflow-x-auto">
{`import { KeeperSprite } from "@/components/svg/KeeperSprite";

// One-shot dive
<KeeperSprite width={160} fps={24} onComplete={() => setDone(true)} />

// Mirror to dive the other way
<KeeperSprite flipX width={160} />

// Loop for preview
<KeeperSprite loop />`}
          </pre>
        </div>
      </div>
    </div>
  );
}

function SpriteSheetInspector() {
  const [cols, setCols] = useState(10);
  const [rows, setRows] = useState(10);

  return (
    <div className="bg-white/5 border border-white/10 rounded-md p-4">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="text-xs uppercase tracking-widest text-white/50 font-bold">
          Sprite sheet — Grid Inspector
        </div>
        <div className="flex gap-3 text-xs text-white/70">
          <label className="flex items-center gap-1">
            cols
            <input
              type="number"
              min={1}
              max={32}
              value={cols}
              onChange={(e) => setCols(parseInt(e.target.value, 10) || 1)}
              className="w-12 bg-black/40 rounded px-1 py-0.5 tabular-nums text-white"
            />
          </label>
          <label className="flex items-center gap-1">
            rows
            <input
              type="number"
              min={1}
              max={32}
              value={rows}
              onChange={(e) => setRows(parseInt(e.target.value, 10) || 1)}
              className="w-12 bg-black/40 rounded px-1 py-0.5 tabular-nums text-white"
            />
          </label>
        </div>
      </div>

      <div
        className="relative w-full"
        style={{ background: "rgba(255,255,255,0.05)" }}
      >
        <img
          src="/Keeper_dive_2_sprite.png"
          alt="Keeper dive sprite sheet"
          className="w-full block"
        />
        {/* Grid overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {/* vertical lines */}
          {Array.from({ length: cols + 1 }).map((_, i) => (
            <div
              key={`v-${i}`}
              className="absolute top-0 bottom-0"
              style={{
                left: `${(i / cols) * 100}%`,
                width: 1,
                background: "rgba(255, 200, 0, 0.6)",
              }}
            />
          ))}
          {/* horizontal lines */}
          {Array.from({ length: rows + 1 }).map((_, i) => (
            <div
              key={`h-${i}`}
              className="absolute left-0 right-0"
              style={{
                top: `${(i / rows) * 100}%`,
                height: 1,
                background: "rgba(255, 200, 0, 0.6)",
              }}
            />
          ))}
        </div>
      </div>

      <div className="mt-3 text-[11px] text-white/50 leading-relaxed">
        ปรับ cols/rows จนเส้น <span className="text-amber-300">สีเหลือง</span> ตรงกับขอบของทุก frame
        แล้วบอกผมตัวเลขที่ถูก เพื่อ update <code>SHEET.cols</code> และ <code>SHEET.rows</code> ใน
        <code> KeeperSprite.tsx</code>
      </div>
    </div>
  );
}

function PreviewCard({
  label,
  children,
  showGrid,
}: {
  label: string;
  children: React.ReactNode;
  showGrid: boolean;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-md p-4 flex flex-col items-center">
      <div className="text-xs uppercase tracking-widest text-amber-300 mb-3 font-bold">
        {label}
      </div>
      <div
        className="relative"
        style={{
          backgroundImage: showGrid
            ? "linear-gradient(45deg, rgba(255,255,255,0.05) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.05) 75%), linear-gradient(45deg, rgba(255,255,255,0.05) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.05) 75%)"
            : undefined,
          backgroundSize: "20px 20px",
          backgroundPosition: "0 0, 10px 10px",
        }}
      >
        {children}
      </div>
    </div>
  );
}
