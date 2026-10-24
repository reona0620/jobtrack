"use client";

import Link from "next/link";
import { useState } from "react";

export function PageHeader({
  title,
  subtitle,
  brandSubtitle,
  backHref = "/",
  backLabel = "ホームへ戻る",
  showTitle = true,
  showBrand = true,
  titleClassName,
  showBackLink = true,
  titlePlacement = "below",
  titleBlockClassName = "mt-6",
}: {
  title: string;
  subtitle?: string;
  brandSubtitle?: string;
  backHref?: string;
  backLabel?: string;
  showTitle?: boolean;
  showBrand?: boolean;
  titleClassName?: string;
  showBackLink?: boolean;
  titlePlacement?: "header" | "below";
  titleBlockClassName?: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
    <header className="relative w-full overflow-hidden bg-gradient-to-br from-slate-950 via-[#142c4b] to-[#176b75] px-4 py-7 text-white shadow-xl shadow-slate-900/10 sm:px-8 sm:py-8">
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full border-[38px] border-white/5" />
      <div className="relative mx-auto max-w-6xl">
      <p className="mb-2 inline-flex rounded-full border border-teal-200/20 bg-teal-100/10 px-3 py-1 text-xs font-bold tracking-wide text-teal-100">
        就活の進捗を、ひと目で。
      </p>
      <div className="relative flex flex-row items-center justify-between gap-3 sm:items-end">
        {showBrand ? (
          <div>
            <Link href="/" className="text-3xl font-black tracking-tight transition hover:text-teal-100 focus:outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-teal-200 sm:text-4xl">
              JobTrack
            </Link>
            {brandSubtitle ? <p className="mt-2 text-sm leading-6 text-slate-300">{brandSubtitle}</p> : null}
          </div>
        ) : <span aria-hidden="true" />}
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={menuOpen ? "メニューを閉じる" : "メニューを開く"}
            aria-expanded={menuOpen}
            aria-controls="page-navigation"
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 text-white transition hover:bg-white/10 sm:hidden"
          >
            <span aria-hidden="true" className="text-2xl leading-none">{menuOpen ? "×" : "☰"}</span>
          </button>
        </div>
      </div>
      {showTitle && titlePlacement === "header" ? (
        <div className={`relative ${titleBlockClassName}`}>
          <h1 className={titleClassName ?? "text-2xl font-black tracking-tight sm:text-3xl"}>{title}</h1>
          {subtitle ? <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{subtitle}</p> : null}
        </div>
      ) : null}
      <nav id="page-navigation" aria-label="メインメニュー" className={`relative mt-5 border-t border-white/15 pt-3 text-sm font-semibold ${menuOpen ? "flex" : "hidden"} flex-col gap-1 sm:flex sm:flex-row sm:flex-wrap sm:gap-2`}>
        <Link href="/" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 text-slate-300 transition hover:bg-white/10 hover:text-white">ホーム</Link>
        <Link href="/applications?filter=all" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 text-slate-300 transition hover:bg-white/10 hover:text-white">登録企業</Link>
        <Link href="/assistant" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 text-slate-300 transition hover:bg-white/10 hover:text-white">AIに質問</Link>
      </nav>
      </div>
    </header>
    {(showTitle && titlePlacement === "below") || showBackLink ? (
      <div className="mx-auto flex max-w-6xl flex-wrap items-start justify-between gap-4 px-4 pt-6 sm:px-8">
        {showTitle && titlePlacement === "below" ? (
          <div className="min-w-0 flex-1">
            <h1 className={titleClassName ?? "text-2xl font-black tracking-tight text-slate-900 sm:text-3xl"}>{title}</h1>
            {subtitle ? <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{subtitle}</p> : null}
          </div>
        ) : null}
        {showBackLink ? (
          <Link href={backHref} className="inline-flex shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-900">
            ← {backLabel}
          </Link>
        ) : null}
      </div>
    ) : null}
    </>
  );
}
