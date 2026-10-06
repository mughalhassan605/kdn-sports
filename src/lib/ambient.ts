// The ambient layer is one fixed element behind the page (#ambient). Sections
// set its base palette as they pass the middle of the viewport; a hovered
// frame overrides it until the pointer leaves. Colours are written as CSS
// custom properties so the gradient itself can transition (see globals.css).

type Light = { palette: string[]; level: number };

const HOVER_LEVEL = 0.46;

let base: Light | null = null;
let hovering = false;

function apply({ palette, level }: Light) {
  const el = document.getElementById("ambient");
  if (!el || palette.length === 0) return;
  el.style.setProperty("--a1", palette[0]);
  el.style.setProperty("--a2", palette[1] ?? palette[0]);
  el.style.setProperty("--a3", palette[2] ?? palette[0]);
  el.style.setProperty("--ambient-level", String(level));
}

export const ambient = {
  base(palette: string[], level = 0.3) {
    base = { palette, level };
    if (!hovering) apply(base);
  },
  hover(palette: string[]) {
    hovering = true;
    apply({ palette, level: HOVER_LEVEL });
  },
  leave() {
    hovering = false;
    if (base) apply(base);
  },
};

export const spillVars = (palette: string[]) =>
  ({ "--c1": palette[0], "--c2": palette[1] ?? palette[0], "--c3": palette[2] ?? palette[0] }) as React.CSSProperties;
