"use client";

// app/ui.tsx
// Les briques d'interface partagées par toutes les pages.
//
// Elles existent pour deux raisons :
//  1. l'application doit être utilisable au doigt sur iPhone — toutes les
//     zones tactiles font au moins 44 px de haut (la règle d'Apple), et tous
//     les champs font 16 px pour que Safari n'agrandisse pas la page à chaque
//     fois qu'on touche un champ ;
//  2. la lisibilité (écritures nettes, contrastes francs) s'applique partout
//     d'un coup, au lieu d'être recopiée écran par écran.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { VERSION } from "./version";

const LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/dashboard", label: "Tableau de bord" },
  { href: "/import", label: "Importer" },
  { href: "/command", label: "Commande" },
  { href: "/analytics", label: "Analyse" },
  { href: "/marketing", label: "Marketing" },
  { href: "/design", label: "Design" },
  { href: "/advertising", label: "Publicité" },
  { href: "/overview", label: "Vue d'ensemble" },
];

// Barre de navigation présente sur toutes les pages. Sans elle, sur iPhone, on
// arrivait sur un écran sans aucun moyen d'en repartir.
export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
      <div className="scroll-touch flex gap-1 overflow-x-auto px-3 py-2">
        {LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-[44px] shrink-0 items-center rounded-lg px-4 text-[15px] font-medium transition ${
                active
                  ? "bg-amber-400 text-slate-950"
                  : "text-slate-300 hover:bg-slate-900 hover:text-amber-300"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function Page({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-[calc(100dvh-60px)] px-4 py-8 pb-[calc(2rem+env(safe-area-inset-bottom))] sm:px-6">
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
        {intro && <p className="mt-2 text-[15px] leading-relaxed text-slate-400">{intro}</p>}
        <div className="mt-7">{children}</div>
      </div>
    </main>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-slate-800 bg-slate-900 p-5 ${className}`}>
      {children}
    </div>
  );
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[15px] text-slate-300">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[48px] w-full rounded-lg border border-slate-700 bg-slate-900 px-4 text-slate-100 placeholder:text-slate-500 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
      />
    </label>
  );
}

export function Button({
  children,
  onClick,
  disabled,
  variant = "primary",
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
  type?: "button" | "submit";
}) {
  const styles = {
    primary: "bg-amber-400 text-slate-950 hover:bg-amber-300",
    secondary: "border border-slate-700 text-slate-200 hover:border-amber-400",
    danger: "border border-slate-700 text-slate-300 hover:border-red-400 hover:text-red-300",
  }[variant];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`min-h-[48px] rounded-lg px-5 font-medium transition disabled:opacity-40 ${styles}`}
    >
      {children}
    </button>
  );
}

export function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-full bg-slate-800 px-3 py-1.5 text-[13px] text-slate-200">
      {children}
    </span>
  );
}

export function Alert({
  children,
  tone = "info",
}: {
  children: React.ReactNode;
  tone?: "info" | "error" | "success";
}) {
  const styles = {
    info: "border-slate-700 bg-slate-900 text-slate-300",
    error: "border-red-500/40 bg-red-500/10 text-red-200",
    success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
  }[tone];

  return (
    <div className={`rounded-lg border px-4 py-3 text-[15px] leading-relaxed ${styles}`}>
      {children}
    </div>
  );
}

// Le fil des messages que les agents s'échangent. C'est la preuve visible
// qu'ils travaillent les uns à la suite des autres, et pas chacun dans son coin.
export function AgentConversation({
  messages,
  names,
}: {
  messages: { agent: string; content: string }[];
  names: Record<string, string>;
}) {
  if (messages.length === 0) return null;

  return (
    <Card>
      <h2 className="mb-1 font-medium">Ce que les agents se sont dit</h2>
      <p className="mb-4 text-[13px] text-slate-500">
        Chaque agent lit ce que le précédent a déposé avant de répondre.
      </p>
      <ol className="space-y-3">
        {messages.map((message, index) => (
          <li key={index} className="flex gap-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-400/15 text-[13px] font-semibold text-amber-300">
              {index + 1}
            </span>
            <div>
              <p className="text-[13px] uppercase tracking-wide text-amber-400">
                {names[message.agent] ?? message.agent}
              </p>
              <p className="text-[15px] leading-relaxed text-slate-200">{message.content}</p>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

// Affiché en bas de chaque écran : indispensable quand plusieurs copies du
// projet cohabitent sur l'ordinateur. Si ce numéro ne change pas après une
// mise à jour, c'est que la mise à jour n'a pas pris.
export function PiedDePage() {
  return (
    <footer className="border-t border-slate-900 px-4 py-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] text-center">
      <p className="text-[13px] text-slate-600">Azuska Z — version {VERSION}</p>
    </footer>
  );
}
