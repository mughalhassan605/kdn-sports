import { ViewTransition } from "react";
import { RevealText } from "@/components/fx/Reveal";
import { AmbientSet } from "@/components/shell/Ambient";
import { cn } from "@/lib/cn";

/** Wraps a route so navigation plays the page transition (see ::view-transition rules in globals.css). */
export function Page({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <ViewTransition enter="page-in" exit="page-out" default="none">
      <div className={className}>{children}</div>
    </ViewTransition>
  );
}

/** The opening of every inner page: one large title that rises letter by letter, an optional line under it. */
export function PageHead({
  title,
  sub,
  palette,
  children,
  className,
}: {
  title: string;
  sub?: string;
  palette?: string[];
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("wrap pb-8 pt-28 md:pb-10 md:pt-36", className)}>
      {palette && <AmbientSet palette={palette} level={0.3} />}
      <RevealText as="h1" by="chars" start="top 100%" className="t-h1 max-w-[18ch]">
        {title}
      </RevealText>
      {sub && (
        <RevealText as="p" by="lines" start="top 100%" delay={0.25} className="t-lede mt-5 max-w-[56ch]">
          {sub}
        </RevealText>
      )}
      {children}
    </header>
  );
}
