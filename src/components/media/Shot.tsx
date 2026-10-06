/* eslint-disable @next/next/no-img-element -- derivatives are pre-sized by scripts/build-media.mjs; the watermark must not be re-encoded per request */
import { src, type Media } from "@/data/media";
import { cn } from "@/lib/cn";

type Props = {
  m: Media;
  /** thumb: small centre mark. preview: tiled watermark. clean: marketing picks only. */
  variant?: "thumb" | "preview" | "clean";
  sizes?: string;
  alt?: string;
  priority?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

export function Shot({ m, variant = "thumb", sizes = "(min-width: 64rem) 30vw, 50vw", alt = "", priority, className, style }: Props) {
  const common = {
    width: m.w,
    height: m.h,
    decoding: "async" as const,
    loading: priority ? ("eager" as const) : ("lazy" as const),
    fetchPriority: priority ? ("high" as const) : undefined,
    draggable: false,
    className: cn("size-full object-cover", className),
    style: { backgroundColor: m.avg, ...style },
  };

  if (variant === "preview") return <img src={src.preview(m.id)} alt={alt} {...common} />;

  if (variant === "clean" && m.clean) {
    return <img src={src.clean(m.id)} srcSet={`${src.cleanM(m.id)} 960w, ${src.clean(m.id)} 1920w`} sizes={sizes} alt={alt} {...common} />;
  }

  return <img src={src.thumb(m.id)} srcSet={`${src.thumb(m.id)} 520w, ${src.thumb2(m.id)} 1040w`} sizes={sizes} alt={alt} {...common} />;
}

/** Four corner brackets. They close in when the host (`.vf-host`) is hovered or `on` is set; `out` hugs the frame from outside. */
export function Viewfinder({ on, tone, out }: { on?: boolean; tone?: "glow"; out?: boolean }) {
  return (
    <span className="vf" data-on={on ? "true" : undefined} data-tone={tone} data-out={out ? "true" : undefined} aria-hidden>
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}
