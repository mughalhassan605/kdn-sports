import { EyeSlashIcon, LightningIcon, ScalesIcon, ShieldCheckIcon } from "@phosphor-icons/react/dist/ssr";
import { RevealBlock } from "@/components/fx/Reveal";
import { getI18n } from "@/i18n/server";

const ICONS = [EyeSlashIcon, ShieldCheckIcon, ScalesIcon, LightningIcon];

/** Four promises that matter when strangers photograph you: removal, payment, licence, delivery. */
export async function TrustBand() {
  const { t } = await getI18n();
  return (
    <section className="relative z-10 border-y border-line bg-ink-0/50">
      <RevealBlock as="ul" className="wrap grid sm:grid-cols-2 lg:grid-cols-4">
        {t.trust.map((item, i) => {
          const Icon = ICONS[i];
          return (
            <li
              key={item.t}
              data-rv-item
              className="border-line py-8 max-sm:border-b max-sm:last:border-b-0 sm:px-6 sm:first:pl-0 sm:last:pr-0 sm:max-lg:odd:border-r sm:max-lg:odd:pl-0 sm:max-lg:[&:nth-child(-n+2)]:border-b lg:border-r lg:py-10 lg:last:border-r-0"
            >
              <Icon size={30} weight="light" className="text-paper" />
              <h3 className="t-h3 mt-5">{item.t}</h3>
              <p className="mt-2 max-w-[30ch] text-[0.9375rem] text-paper-2">{item.d}</p>
            </li>
          );
        })}
      </RevealBlock>
    </section>
  );
}
