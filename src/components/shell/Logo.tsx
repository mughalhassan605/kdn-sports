import { site } from "@/data/site";
import { cn } from "@/lib/cn";

/** Viewfinder corners around a focus point, then the name. Text wordmark until KDN supplies a logo file. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 leading-none", className)}>
      <span aria-hidden className="relative block size-[26px]">
        <i className="absolute left-0 top-0 size-[9px] border-l-2 border-t-2 border-paper" />
        <i className="absolute right-0 top-0 size-[9px] border-r-2 border-t-2 border-paper" />
        <i className="absolute bottom-0 left-0 size-[9px] border-b-2 border-l-2 border-paper" />
        <i className="absolute bottom-0 right-0 size-[9px] border-b-2 border-r-2 border-paper" />
        <i className="absolute left-1/2 top-1/2 size-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-glow" />
      </span>
      <span className="flex items-baseline gap-1.5">
        <span className="text-[1.35rem] font-[850] tracking-[-0.03em] text-paper [font-stretch:125%]">{site.wordmark[0]}</span>
        <span className="t-hud text-paper-2">{site.wordmark[1]}</span>
      </span>
    </span>
  );
}
