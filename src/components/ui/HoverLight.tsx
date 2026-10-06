"use client";

import { ambient } from "@/lib/ambient";

/** Whatever sits inside lights the page with its palette while the pointer is over it. */
export function HoverLight({
  palette,
  children,
  ...rest
}: { palette: string[]; children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div onPointerEnter={() => ambient.hover(palette)} onPointerLeave={ambient.leave} {...rest}>
      {children}
    </div>
  );
}
