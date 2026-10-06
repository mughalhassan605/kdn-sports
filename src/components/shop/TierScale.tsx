import { TIERS } from "@/data/pricing";
import { cn } from "@/lib/cn";

const MAX = 10;
const marks = new Map<number, number>(TIERS.map((t) => [t.min, t.pct]));

/** The volume discount drawn like a lens scale: one tick per photo, a longer one where a tier starts. */
export function TierScale({ count, className }: { count: number; className?: string }) {
  return (
    <div className={cn("flex items-end justify-between", className)} aria-hidden>
      {Array.from({ length: MAX }, (_, i) => {
        const n = i + 1;
        const pct = marks.get(n);
        const lit = count >= n;
        return (
          <div key={n} className="relative flex h-9 flex-1 flex-col items-center justify-end">
            {pct !== undefined && (
              <span className={cn("t-hud absolute top-0 transition-colors duration-300", lit ? "text-glow" : "text-paper-3")}>{pct}%</span>
            )}
            <span
              className={cn(
                "w-px origin-bottom transition-[background-color,transform] duration-300",
                pct !== undefined ? "h-4" : "h-2",
                lit ? "bg-glow" : "bg-line-2",
              )}
            />
          </div>
        );
      })}
    </div>
  );
}
