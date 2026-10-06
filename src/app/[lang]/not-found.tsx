import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { de } from "@/i18n/dict/de";

// not-found has no access to the route params, so it speaks the default language.
export default function NotFound() {
  const t = de.notFound;
  return (
    <section className="wrap flex min-h-[78svh] flex-col items-start justify-center pt-24">
      <p className="t-num text-[clamp(7rem,22vw,16rem)] text-paper-3">404</p>
      <h1 className="t-h1 mt-4">{t.title}</h1>
      <p className="t-lede mt-4 text-paper-2">{t.sub}</p>
      <Link href="/" className="btn btn-paper mt-8">
        {t.cta}
        <ArrowRightIcon size={16} weight="bold" />
      </Link>
    </section>
  );
}
