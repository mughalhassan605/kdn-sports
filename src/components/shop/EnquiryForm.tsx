"use client";

import { ArrowRightIcon, CheckCircleIcon, CircleNotchIcon } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/cn";

type Field = "name" | "email" | "event" | "date" | "place" | "size" | "message";

/** Organiser enquiry. Labels above, errors below, one submit. Posts to /api/anfrage. */
export function EnquiryForm() {
  const { t } = useI18n();
  const f = t.organisers.form;
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [bad, setBad] = useState<string[]>([]);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const missing = (["name", "email", "event"] as const).filter((k) => !data[k]?.trim());
    if (data.email && !/^\S+@\S+\.\S+$/.test(data.email.trim()) && !missing.includes("email")) missing.push("email");
    if (missing.length) {
      setBad(missing);
      return;
    }
    setBad([]);
    setState("sending");
    try {
      const res = await fetch("/api/anfrage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { fields?: string[] };
        setBad(body.fields ?? ["name", "email", "event"]);
        setState("idle");
        return;
      }
      setState("done");
    } catch {
      setBad(["name"]);
      setState("idle");
    }
  };

  if (state === "done") {
    return (
      <div className="panel flex items-start gap-4 p-7 md:p-10" role="status">
        <CheckCircleIcon size={34} weight="fill" className="shrink-0 text-glow" />
        <p className="t-h3">{f.done}</p>
      </div>
    );
  }

  const input = (name: Field, label: string, opts: { type?: string; required?: boolean; autoComplete?: string; wide?: boolean } = {}) => {
    const invalid = bad.includes(name);
    return (
      <div className={cn("grid gap-2", opts.wide && "sm:col-span-2")}>
        <label htmlFor={`eq-${name}`} className="t-hud text-paper-2">
          {label}
          {opts.required && <span className="text-glow"> *</span>}
        </label>
        {name === "message" ? (
          <textarea id={`eq-${name}`} name={name} rows={5} className="field" />
        ) : (
          <input id={`eq-${name}`} name={name} type={opts.type ?? "text"} autoComplete={opts.autoComplete} required={opts.required} aria-invalid={invalid} className="field" />
        )}
        {invalid && <p className="text-sm text-rec">{name === "email" ? f.invalidEmail : f.required}</p>}
      </div>
    );
  };

  return (
    <form onSubmit={submit} noValidate className="panel p-5 md:p-8">
      <h2 className="t-h2">{f.title}</h2>
      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        {input("name", f.name, { required: true, autoComplete: "name" })}
        {input("email", f.email, { required: true, type: "email", autoComplete: "email" })}
        {input("event", f.event, { required: true, wide: true })}
        {input("date", f.date, { type: "date" })}
        {input("place", f.place, { autoComplete: "address-level2" })}
        {input("size", f.size, { wide: true })}
        {input("message", f.message, { wide: true })}
        <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      </div>
      {bad.length > 0 && (
        <p role="alert" className="mt-5 text-sm text-rec">
          {f.error}
        </p>
      )}
      <button type="submit" disabled={state === "sending"} className="btn btn-glow mt-7 h-14 px-8 text-base">
        {state === "sending" ? (
          <>
            <CircleNotchIcon size={18} weight="bold" className="animate-spin" />
            {f.sending}
          </>
        ) : (
          <>
            {f.send}
            <ArrowRightIcon size={18} weight="bold" />
          </>
        )}
      </button>
    </form>
  );
}
