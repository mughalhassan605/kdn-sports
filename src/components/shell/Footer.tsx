import { ArrowUpRightIcon, InstagramLogoIcon, YoutubeLogoIcon } from "@phosphor-icons/react/dist/ssr";
import { ZoomWord } from "@/components/ui/Motion";
import { site } from "@/data/site";
import { LLink } from "@/i18n/client";
import { getI18n } from "@/i18n/server";
import { LangSwitch } from "./LangSwitch";
import { Logo } from "./Logo";

export async function Footer() {
  const { t } = await getI18n();
  const year = new Date().getFullYear();

  const cols = [
    {
      title: t.footer.discover,
      links: [
        { href: "/events", label: t.nav.events },
        { href: "/clips", label: t.nav.clips },
        { href: "/preise", label: t.nav.pricing },
        { href: "/downloads", label: t.nav.downloads },
      ],
    },
    {
      title: t.footer.forOrganisers,
      links: [
        { href: "/veranstalter", label: t.organisers.cta },
        { href: "/veranstalter#leistungen", label: t.footer.services },
        { href: "/ueber", label: t.nav.about },
      ],
    },
    {
      title: t.footer.legal,
      links: [
        { href: "/impressum", label: t.footer.imprint },
        { href: "/datenschutz", label: t.footer.privacy },
        { href: "/agb", label: t.footer.terms },
      ],
    },
  ];

  return (
    <footer className="relative z-10 border-t border-line bg-ink-0/70">
      <div className="wrap pb-6 pt-14 md:pt-20">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div>
            <LLink href="/" aria-label={site.name}>
              <Logo />
            </LLink>
            <p className="t-h3 mt-6 max-w-[22ch]">{t.footer.tagline}</p>
            <a href={`mailto:${site.email}`} className="link-u mt-5 inline-block text-paper-2">
              {site.email}
            </a>
            <div className="mt-6 flex gap-2">
              <a
                href={site.instagram}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="grid size-10 place-items-center rounded-full border border-line text-paper transition-colors hover:bg-white/10"
              >
                <InstagramLogoIcon size={18} />
              </a>
              <a
                href={site.youtube}
                target="_blank"
                rel="noreferrer"
                aria-label="YouTube"
                className="grid size-10 place-items-center rounded-full border border-line text-paper transition-colors hover:bg-white/10"
              >
                <YoutubeLogoIcon size={18} />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3">
            {cols.map((c) => (
              <nav key={c.title} aria-label={c.title}>
                <h2 className="t-hud text-paper-3">{c.title}</h2>
                <ul className="mt-4 space-y-2.5">
                  {c.links.map((l) => (
                    <li key={l.href}>
                      <LLink href={l.href} className="link-u text-paper-2">
                        {l.label}
                      </LLink>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-line pt-6">
          <span className="t-hud mr-2 text-paper-3">{t.footer.payments}</span>
          {site.payments.map((p) => (
            <span key={p} className="chip">
              {p}
            </span>
          ))}
        </div>

        <LLink href="/events" aria-label={t.hero.cta} className="group mt-10 block [container-type:inline-size] md:mt-14">
          <ZoomWord
            text={site.name.toUpperCase()}
            className="select-none whitespace-nowrap text-[9.25cqw] font-[850] uppercase leading-[0.78] tracking-[-0.03em] text-paper transition-colors duration-500 group-hover:text-glow"
          />
          <span className="mt-5 flex items-center justify-between gap-4 border-t border-line pt-4">
            <span className="t-h3">{t.hero.cta}</span>
            <ArrowUpRightIcon size={24} className="text-paper transition-transform duration-500 ease-out-expo group-hover:-translate-y-1 group-hover:translate-x-1" />
          </span>
        </LLink>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 text-sm text-paper-3">
          <p>
            © {year} {site.name}. {t.footer.rights}
          </p>
          <LangSwitch />
        </div>
      </div>
    </footer>
  );
}
