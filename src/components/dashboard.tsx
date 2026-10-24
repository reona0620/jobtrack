"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { HomeRegistrationForm } from "@/components/home-registration-form";
import { useApplications } from "@/hooks/use-applications";
import {
  applicationStatuses,
  scheduleTypeLabels,
  selectionTypeBadgeClasses,
  selectionTypeLabels,
  selectionTypes,
  statusLabels,
} from "@/lib/application";
import type {
  ApplicationStatus,
  JobApplication,
  ScheduleType,
  SelectionType,
} from "@/types/application";

type StatusFilter = "all" | ApplicationStatus;
type SelectionTypeFilter = "all" | SelectionType;
type QuickFilter = "all" | "active" | "interview" | "offer";
type SortOption = "updated" | "deadline" | "company";
type UpcomingKind = "deadline" | ScheduleType;

type UpcomingItem = {
  id: string;
  applicationId: string;
  companyName: string;
  kind: UpcomingKind;
  startsAt: string;
  endsAt: string | null;
  note: string;
  allDay: boolean;
};

const upcomingKindLabels: Record<UpcomingKind, string> = {
  deadline: "応募締切",
  ...scheduleTypeLabels,
};

function formatUpcomingDate(value: string, allDay: boolean) {
  const date = new Date(value);
  const dateLabel = new Intl.DateTimeFormat("ja-JP", {
    month: "long",
    day: "numeric",
  }).format(date);
  if (allDay) return dateLabel;

  const timeLabel = new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
  return `${dateLabel} ${timeLabel}`;
}

export function Dashboard({
  view = "home",
  initialFilter = "all",
}: {
  view?: "home" | "applications";
  initialFilter?: QuickFilter;
}) {
  const { applications, deleteApplication } = useApplications();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectionTypeFilter, setSelectionTypeFilter] =
    useState<SelectionTypeFilter>("all");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>(initialFilter);
  const [sort, setSort] = useState<SortOption>("updated");
  const [currentTime] = useState(() => new Date().getTime());

  const filteredApplications = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ja-JP");

    return applications
      .filter((application) => {
        const tracks = application.tracks ?? [];
        const matchesQuery =
          !normalizedQuery ||
          application.companyName.toLocaleLowerCase("ja-JP").includes(normalizedQuery);
        const matchesStatus =
          statusFilter === "all" || tracks.some((track) => track.status === statusFilter);
        const matchesSelectionType =
          selectionTypeFilter === "all" ||
          tracks.some((track) => track.selectionType === selectionTypeFilter);
        const matchesQuickFilter =
          quickFilter === "all" ||
          tracks.some((track) =>
            (quickFilter === "active" && ["applied", "interview"].includes(track.status)) ||
            (quickFilter === "interview" && track.status === "interview") ||
            (quickFilter === "offer" && track.status === "offer"),
          );
        return (
          matchesQuery &&
          matchesStatus &&
          matchesSelectionType &&
          matchesQuickFilter
        );
      })
      .toSorted((first, second) => {
        if (sort === "company") {
          return first.companyName.localeCompare(second.companyName, "ja");
        }
        if (sort === "deadline") {
          const firstDeadline = first.tracks?.map((track) => track.deadline).filter((date): date is string => !!date).sort()[0];
          const secondDeadline = second.tracks?.map((track) => track.deadline).filter((date): date is string => !!date).sort()[0];
          if (!firstDeadline) return 1;
          if (!secondDeadline) return -1;
          return firstDeadline.localeCompare(secondDeadline);
        }
        return second.updatedAt.localeCompare(first.updatedAt);
      });
  }, [
    applications,
    query,
    quickFilter,
    selectionTypeFilter,
    sort,
    statusFilter,
  ]);

  const upcomingItems = useMemo(() => {
    const items = applications.flatMap<UpcomingItem>((application) => {
      return (application.tracks ?? []).flatMap((track) => {
        const deadlineItem: UpcomingItem[] = track.deadline ? [{
          id: `${application.id}-${track.id}-deadline`,
          applicationId: application.id,
          companyName: application.companyName,
          kind: "deadline",
          startsAt: `${track.deadline}T23:59`,
          endsAt: null,
          note: `${track.position || application.companyName}の応募締切`,
          allDay: true,
        }] : [];
        const scheduleItems = track.schedules.map((schedule) => ({
          id: `${application.id}-${track.id}-${schedule.id}`,
          applicationId: application.id,
          companyName: application.companyName,
          kind: schedule.type,
          startsAt: schedule.startsAt,
          endsAt: schedule.endsAt,
          note: [track.position, schedule.note].filter(Boolean).join("・") || scheduleTypeLabels[schedule.type],
          allDay: false,
        }));
        return [...deadlineItem, ...scheduleItems];
      });
    });

    return items
      .filter(
        (item) =>
          new Date(item.endsAt ?? item.startsAt).getTime() >= currentTime,
      )
      .toSorted(
        (first, second) =>
          new Date(first.startsAt).getTime() -
          new Date(second.startsAt).getTime(),
      )
      .slice(0, 5);
  }, [applications, currentTime]);

  function applyQuickFilter(filter: QuickFilter) {
    setQuickFilter(filter);
    setStatusFilter("all");
  }

  function handleDelete(application: JobApplication) {
    if (window.confirm(`${application.companyName}を削除しますか？`)) {
      deleteApplication(application.id);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb]">
      <header className="relative w-full overflow-hidden bg-gradient-to-br from-slate-950 via-[#142c4b] to-[#176b75] px-4 py-7 text-white shadow-xl shadow-slate-900/10 sm:px-8 sm:py-8">
          <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full border-[38px] border-white/5" />
          <div className="relative mx-auto max-w-6xl">
          <div className="relative flex flex-row items-center justify-between gap-3 sm:items-end">
            <div>
              <p className="mb-2 inline-flex rounded-full border border-teal-200/20 bg-teal-100/10 px-3 py-1 text-xs font-bold tracking-wide text-teal-100">
                就活の進捗を、ひと目で。
              </p>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                <Link href="/" className="rounded-sm transition hover:text-teal-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-200">
                  JobTrack
                </Link>
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {view === "home"
                  ? "企業を登録して、直近のスケジュールを確認できます。"
                  : "登録した企業を検索・整理できます。"}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                aria-label={menuOpen ? "メニューを閉じる" : "メニューを開く"}
                aria-expanded={menuOpen}
                aria-controls="main-navigation"
                onClick={() => setMenuOpen((open) => !open)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 text-white transition hover:bg-white/10 sm:hidden"
              >
                <span aria-hidden="true" className="text-2xl leading-none">{menuOpen ? "×" : "☰"}</span>
              </button>
            </div>
          </div>
          <nav id="main-navigation" aria-label="メインメニュー" className={`relative mt-5 border-t border-white/15 pt-3 text-sm font-semibold ${menuOpen ? "flex" : "hidden"} flex-col gap-1 sm:flex sm:flex-row sm:flex-wrap sm:gap-2`}>
            <Link href="/" onClick={() => setMenuOpen(false)} aria-current={view === "home" ? "page" : undefined} className={`rounded-lg px-3 py-2 transition hover:bg-white/10 ${view === "home" ? "bg-white/15 text-white" : "text-slate-300"}`}>ホーム</Link>
            {([["all", "登録企業"]] as const).map(([filter, label]) => (
              <Link
                key={filter}
                href={`/applications?filter=${filter}`}
                onClick={() => setMenuOpen(false)}
                aria-current={view === "applications" && quickFilter === filter ? "page" : undefined}
                className={`rounded-lg px-3 py-2 transition hover:bg-white/10 ${view === "applications" && quickFilter === filter ? "bg-white/15 text-white" : "text-slate-300"}`}
              >
                {label}
              </Link>
            ))}
            <Link href="/assistant" onClick={() => setMenuOpen(false)} aria-current={undefined} className="rounded-lg px-3 py-2 text-slate-300 transition hover:bg-white/10 hover:text-white">
              AIに質問
            </Link>
          </nav>
          </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
        {view === "home" ? (
          <HomeRegistrationForm />
        ) : null}

        {view === "home" ? <section
          className="mt-8 rounded-[1.75rem] bg-[radial-gradient(#cbd5e1_0.8px,transparent_0.8px)] [background-size:18px_18px] p-4 sm:p-6"
          aria-labelledby="upcoming-heading"
        >
          <h2 id="upcoming-heading" className="text-sm font-semibold tracking-wide text-slate-500">
            直近のスケジュール
          </h2>

          {upcomingItems.length ? (
            <ul className="mt-3 divide-y divide-slate-100 overflow-hidden rounded-[1.4rem] border border-slate-200/90 bg-white/95 px-4 shadow-sm sm:px-5">
              {upcomingItems.map((item) => {
                const dateLabel = new Intl.DateTimeFormat("ja-JP", {
                  month: "numeric",
                  day: "numeric",
                  weekday: "short",
                }).format(new Date(item.startsAt));
                const timeLabel = item.allDay
                  ? "終日"
                  : new Intl.DateTimeFormat("ja-JP", {
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(item.startsAt));

                return (
                  <li key={item.id}>
                    <Link
                      href={`/applications/${item.applicationId}`}
                      aria-label={`${formatUpcomingDate(item.startsAt, item.allDay)}、${item.companyName}の詳細を見る`}
                      className="group flex min-h-20 items-center gap-3 py-4 outline-none sm:gap-4"
                    >
                      <span aria-hidden="true" className="ml-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-slate-900 ring-4 ring-slate-100" />
                      <time dateTime={item.startsAt} className="w-[4.5rem] shrink-0 text-sm text-slate-500 sm:w-20">
                        {dateLabel}
                      </time>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-base font-bold text-slate-900 transition group-hover:text-teal-800 sm:text-lg">
                          {item.companyName}
                        </span>
                        <span className="mt-1 block truncate text-xs text-slate-500">
                          {item.note && item.note !== upcomingKindLabels[item.kind]
                            ? `${item.note} ・ ${upcomingKindLabels[item.kind]}`
                            : upcomingKindLabels[item.kind]}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1 text-xs tabular-nums text-slate-400 sm:text-sm">
                        <span aria-hidden="true">◷</span>{timeLabel}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="mt-3 rounded-[1.4rem] border border-slate-200/90 bg-white/95 px-5 py-8 text-center text-sm text-slate-500 shadow-sm">
              これからの予定はまだ登録されていません。
            </div>
          )}
        </section> : null}

        {view === "applications" ? <section className="mt-8 rounded-[1.75rem] bg-[radial-gradient(#cbd5e1_0.8px,transparent_0.8px)] [background-size:18px_18px] p-4 sm:p-6">
          <div className="rounded-[1.4rem] border border-slate-200/90 bg-white/95 p-4 shadow-sm sm:p-5">
          <div>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="text-sm font-semibold tracking-wide text-slate-500">登録企業</h2>
              <p className="text-sm text-slate-500">
                {filteredApplications.length}件{filteredApplications.length !== applications.length ? ` / 全${applications.length}件` : ""}
              </p>
            </div>

            <div className="mt-4">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">企業を検索</span>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="企業名を入力"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-50"
                />
              </label>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <label>
                  <span className="text-sm font-semibold text-slate-700">応募区分</span>
                  <select
                    value={selectionTypeFilter}
                    onChange={(event) => {
                      setSelectionTypeFilter(event.target.value as SelectionTypeFilter);
                      setQuickFilter("all");
                    }}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-50"
                  >
                    <option value="all">すべての応募区分</option>
                    {selectionTypes.map((selectionType) => (
                      <option key={selectionType} value={selectionType}>
                        {selectionTypeLabels[selectionType]}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="text-sm font-semibold text-slate-700">選考状況</span>
                  <select
                    value={statusFilter}
                    onChange={(event) => {
                      setStatusFilter(event.target.value as StatusFilter);
                      setQuickFilter("all");
                    }}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-50"
                  >
                    <option value="all">すべての状況</option>
                    {applicationStatuses.map((status) => (
                      <option key={status} value={status}>
                        {statusLabels[status]}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="text-sm font-semibold text-slate-700">並び順</span>
                  <select
                    value={sort}
                    onChange={(event) => setSort(event.target.value as SortOption)}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-50"
                  >
                    <option value="updated">更新が新しい順</option>
                    <option value="deadline">締切が近い順</option>
                    <option value="company">企業名順</option>
                  </select>
                </label>
              </div>
            </div>
          </div>
          </div>

          {applications.length === 0 ? (
            <div className="mt-5 overflow-hidden rounded-[1.4rem] border border-slate-200/90 bg-white shadow-sm">
              <div className="grid gap-8 px-6 py-9 sm:grid-cols-[1fr_auto] sm:items-center sm:px-10 sm:py-12">
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-slate-900">企業はまだ登録されていません</h3>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">ホーム画面から企業名や応募情報を追加できます。</p>
                </div>
                <div aria-hidden="true" className="hidden h-36 w-36 items-center justify-center rounded-full bg-teal-50 text-6xl sm:flex">🗂️</div>
              </div>
            </div>
          ) : filteredApplications.length ? (
            <div className="mt-5 grid gap-4">
              {filteredApplications.map((application) => (
                <article
                  key={application.id}
                  className="relative cursor-pointer rounded-[1.4rem] border border-slate-200/90 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md sm:p-5"
                >
                  <Link
                    href={`/applications/${application.id}/edit`}
                    aria-label={`${application.companyName}の編集画面を開く`}
                    className="absolute inset-0 z-0 rounded-2xl focus:outline-none focus:ring-4 focus:ring-inset focus:ring-teal-200"
                  />
                  <div className="pointer-events-none relative z-10 flex items-center justify-between gap-4">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="flex shrink-0 flex-wrap gap-1.5">
                        {[...new Set((application.tracks ?? []).map((track) => track.selectionType).filter((type): type is SelectionType => !!type))].map((type) => (
                          <span key={type} className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${selectionTypeBadgeClasses[type]}`}>
                            {selectionTypeLabels[type]}
                          </span>
                        ))}
                      </div>
                      <h3 className="min-w-0 truncate text-lg font-bold text-slate-900 sm:text-xl">
                        {application.companyName}
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(application)}
                      className="pointer-events-auto shrink-0 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700 transition hover:bg-rose-100"
                    >
                      削除
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-[1.4rem] border border-slate-200/90 bg-white px-6 py-16 text-center shadow-sm">
              <p className="text-4xl" aria-hidden="true">⌕</p>
              <p className="mt-3 text-lg font-bold text-slate-800">条件に合う企業が見つかりません</p>
              <p className="mt-2 text-sm text-slate-500">
                キーワードや絞り込み条件を変えて、もう一度お試しください。
              </p>
              <button type="button" onClick={() => { setQuery(""); setSelectionTypeFilter("all"); setStatusFilter("all"); applyQuickFilter("all"); }} className="mt-5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">検索条件をクリア</button>
            </div>
          )}
        </section> : null}
      </div>
    </main>
  );
}
