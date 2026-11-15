"use client";

export function PowerMeter({
  value,
  hidden = false,
  target = 5,
  large = false,
  label = "스마트 전력량계",
}: {
  value: number;
  hidden?: boolean;
  target?: number;
  large?: boolean;
  label?: string;
}) {
  const display = hidden ? "?.??" : value.toFixed(2);
  const over = !hidden && value > target;

  return (
    <div
      className={`rounded-3xl border border-sky-300/30 bg-[#06141c] p-4 shadow-inner ${
        large ? "p-6 md:p-8" : ""
      }`}
    >
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.25em] text-sky-200/60 md:text-xs">
        <span>{label}</span>
        <span>kWh</span>
      </div>
      <div
        className={`mt-3 font-mono font-bold tabular-nums tracking-wider ${
          large ? "text-6xl md:text-8xl" : "text-5xl"
        } ${
          hidden
            ? "anim-go text-white/35 blur-[2px]"
            : over
              ? "text-[var(--coral)]"
              : "text-[var(--gold)]"
        }`}
      >
        {display}
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all ${
            over ? "bg-[var(--coral)]" : "bg-teal-400"
          }`}
          style={{
            width: `${Math.min(100, (hidden ? 40 : (value / (target * 1.6)) * 100))}%`,
          }}
        />
      </div>
      <p className="mt-2 text-right text-xs text-white/40">목표 {target.toFixed(2)} kWh</p>
    </div>
  );
}
