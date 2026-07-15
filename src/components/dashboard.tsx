"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useApplications } from "@/hooks/use-applications";
import {
  applicationStatuses,
  formatDate,
  formatDateTime,
  isDeadlineSoon,
  scheduleTypeBadgeClasses,
  scheduleTypeLabels,
  selectionTypeBadgeClasses,
  selectionTypeLabels,
  selectionTypes,
  statusBadgeClasses,
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

const upcomingKindClasses: Record<UpcomingKind, string> = {
  deadline: "bg-rose-50 text-rose-700 ring-rose-200",
  ...scheduleTypeBadgeClasses,
};

function downloadCsv(applications: JobApplication[]) {
  const escapeCell = (value: string) => `"${value.replaceAll('"', '""')}"`;
  const rows = [
    [
      "応募区分",
      "企業名",
      "応募職種",
      "選考状況",
      "応募締切",
      "予定",
      "URL",
      "メモ",
    ],
    ...applications.map((application) => [
      selectionTypeLabels[application.selectionType],
      application.companyName,
      application.position,
      statusLabels[application.status],
      application.deadline ?? "",
      application.schedules
        .map(
          (schedule) =>
            `${scheduleTypeLabels[schedule.type]}: ${schedule.startsAt}${
              schedule.endsAt ? ` 〜 ${schedule.endsAt}` : ""
            }${
              schedule.note ? ` (${schedule.note})` : ""
            }`,
        )
        .join(" / "),
      application.companyUrl ?? "",
      application.memo,
    ]),
  ];
  const csv = `\uFEFF${rows.map((row) => row.map(escapeCell).join(",")).join("\n")}`;
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `jobtrack-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function Dashboard() {
  const { applications, deleteApplication } = useApplications();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectionTypeFilter, setSelectionTypeFilter] =
    useState<SelectionTypeFilter>("all");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [sort, setSort] = useState<SortOption>("updated");
  const [currentTime] = useState(() => new Date().getTime());

  const filteredApplications = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ja-JP");

    return applications
      .filter((application) => {
        const matchesQuery =
          !normalizedQuery ||
          application.companyName.toLocaleLowerCase("ja-JP").includes(normalizedQuery) ||
          application.position.toLocaleLowerCase("ja-JP").includes(normalizedQuery) ||
          application.memo.toLocaleLowerCase("ja-JP").includes(normalizedQuery);
        const matchesStatus =
          statusFilter === "all" || application.status === statusFilter;
        const matchesSelectionType =
          selectionTypeFilter === "all" ||
          application.selectionType === selectionTypeFilter;
        const matchesQuickFilter =
          quickFilter === "all" ||
          (quickFilter === "active" &&
            ["applied", "interview"].includes(application.status)) ||
          (quickFilter === "interview" && application.status === "interview") ||
          (quickFilter === "offer" && application.status === "offer");
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
          if (!first.deadline) return 1;
          if (!second.deadline) return -1;
          return first.deadline.localeCompare(second.deadline);
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

  const statsApplications =
    selectionTypeFilter === "all"
      ? applications
      : applications.filter(
          (application) => application.selectionType === selectionTypeFilter,
        );
  const stats = {
    total: statsApplications.length,
    active: statsApplications.filter((application) =>
      ["applied", "interview"].includes(application.status),
    ).length,
    interviews: statsApplications.filter(
      (application) => application.status === "interview",
    ).length,
    offers: statsApplications.filter((application) => application.status === "offer")
      .length,
  };

  const statCards: Array<{
    label: string;
    value: number;
    filter: QuickFilter;
  }> = [
    { label: "登録企業", value: stats.total, filter: "all" },
    { label: "選考中", value: stats.active, filter: "active" },
    { label: "面接中", value: stats.interviews, filter: "interview" },
    { label: "内定", value: stats.offers, filter: "offer" },
  ];

  const upcomingItems = useMemo(() => {
    const items = applications.flatMap<UpcomingItem>((application) => {
      const deadlineItem: UpcomingItem[] = application.deadline
        ? [
            {
              id: `${application.id}-deadline`,
              applicationId: application.id,
              companyName: application.companyName,
              kind: "deadline",
              startsAt: `${application.deadline}T23:59`,
              endsAt: null,
              note: "応募締切",
              allDay: true,
            },
          ]
        : [];
      const scheduleItems: UpcomingItem[] = application.schedules.map(
        (schedule) => ({
          id: `${application.id}-${schedule.id}`,
          applicationId: application.id,
          companyName: application.companyName,
          kind: schedule.type,
          startsAt: schedule.startsAt,
          endsAt: schedule.endsAt,
          note: schedule.note,
          allDay: false,
        }),
      );

      return [...deadlineItem, ...scheduleItems];
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
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
        <header className="overflow-hidden rounded-3xl bg-slate-950 px-6 py-8 text-white shadow-xl shadow-slate-900/10 sm:px-10 sm:py-10">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-300">
                Job hunting workspace
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
                JobTrack
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                応募先、締切、選考の進み具合をひとつの場所で管理できます。
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => downloadCsv(applications)}
                disabled={applications.length === 0}
                className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
              >
                CSV出力
              </button>
              <Link
                href="/applications/new"
                className="rounded-xl bg-blue-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-400"
              >
                ＋ 企業を追加
              </Link>
            </div>
          </div>
        </header>

        <section
          aria-label="応募状況の集計"
          className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4"
        >
          {statCards.map(({ label, value, filter }) => (
            <button
              key={label}
              type="button"
              aria-pressed={quickFilter === filter}
              onClick={() => applyQuickFilter(filter)}
              className={`rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                quickFilter === filter
                  ? "border-blue-500 ring-2 ring-blue-100"
                  : "border-slate-200"
              }`}
            >
              <p className="text-sm font-semibold text-slate-500">{label}</p>
              <p className="mt-2 text-3xl font-black text-slate-900">
                {value}
                <span className="ml-1 text-sm font-semibold text-slate-400">社</span>
              </p>
              <p className="mt-2 text-xs font-semibold text-blue-600">
                クリックして表示
              </p>
            </button>
          ))}
        </section>

        <section className="mt-8" aria-labelledby="upcoming-heading">
          <div>
            <p className="text-sm font-bold text-blue-600">UPCOMING</p>
            <h2
              id="upcoming-heading"
              className="mt-1 text-2xl font-black text-slate-900"
            >
              直近の予定
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              応募締切、面接、インターンを近い順に5件表示します。
            </p>
          </div>

          {upcomingItems.length ? (
            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              {upcomingItems.map((item) => (
                <Link
                  key={item.id}
                  href={`/applications/${item.applicationId}/edit`}
                  className="group flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md sm:flex-row sm:items-center"
                >
                  <div className="min-w-36 rounded-xl bg-slate-950 px-4 py-3 text-white">
                    <p className="text-sm font-bold">
                      {item.allDay
                        ? formatDate(item.startsAt.slice(0, 10))
                        : `${formatDateTime(item.startsAt)}${
                            item.endsAt
                              ? ` 〜 ${formatDateTime(item.endsAt)}`
                              : ""
                          }`}
                    </p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${upcomingKindClasses[item.kind]}`}
                      >
                        {upcomingKindLabels[item.kind]}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">
                        編集する →
                      </span>
                    </div>
                    <h3 className="mt-2 truncate font-black text-slate-900">
                      {item.companyName}
                    </h3>
                    {item.note ? (
                      <p className="mt-1 truncate text-sm text-slate-500">
                        {item.note}
                      </p>
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center text-sm text-slate-500">
              これからの予定はまだ登録されていません。
            </div>
          )}
        </section>

        <section className="mt-8">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <p className="text-sm font-bold text-blue-600">APPLICATIONS</p>
              <h2 className="mt-1 text-2xl font-black text-slate-900">応募企業</h2>
              <p className="mt-1 text-sm text-slate-500">
                {filteredApplications.length}件を表示しています
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label>
                <span className="sr-only">企業を検索</span>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="企業名・職種・メモ"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </label>
              <label>
                <span className="sr-only">応募区分で絞り込み</span>
                <select
                  value={selectionTypeFilter}
                  onChange={(event) => {
                    setSelectionTypeFilter(
                      event.target.value as SelectionTypeFilter,
                    );
                    setQuickFilter("all");
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="all">本選考・インターン</option>
                  {selectionTypes.map((selectionType) => (
                    <option key={selectionType} value={selectionType}>
                      {selectionTypeLabels[selectionType]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="sr-only">選考状況で絞り込み</span>
                <select
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(event.target.value as StatusFilter);
                    setQuickFilter("all");
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
                <span className="sr-only">並び順</span>
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as SortOption)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="updated">更新が新しい順</option>
                  <option value="deadline">締切が近い順</option>
                  <option value="company">企業名順</option>
                </select>
              </label>
            </div>
          </div>

          {filteredApplications.length ? (
            <div className="mt-5 grid gap-4">
              {filteredApplications.map((application) => (
                <article
                  key={application.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6"
                >
                  <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${selectionTypeBadgeClasses[application.selectionType]}`}
                        >
                          {selectionTypeLabels[application.selectionType]}
                        </span>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${statusBadgeClasses[application.status]}`}>
                          {statusLabels[application.status]}
                        </span>
                        {isDeadlineSoon(application.deadline) ? (
                          <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 ring-1 ring-inset ring-rose-200">
                            締切間近
                          </span>
                        ) : null}
                      </div>
                      <h3 className="mt-3 truncate text-xl font-black text-slate-900">
                        {application.companyName}
                      </h3>
                      <p className="mt-1 font-medium text-slate-600">{application.position}</p>
                      {application.memo ? (
                        <p className="mt-3 line-clamp-2 max-w-2xl text-sm leading-6 text-slate-500">
                          {application.memo}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 flex-col gap-4 lg:items-end">
                      <div className="text-sm text-slate-500 lg:text-right">
                        <p className="font-semibold text-slate-700">締切</p>
                        <p className="mt-1">{formatDate(application.deadline)}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {application.companyUrl ? (
                          <a
                            href={application.companyUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                          >
                            求人を見る ↗
                          </a>
                        ) : null}
                        <Link
                          href={`/applications/${application.id}/edit`}
                          className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
                        >
                          編集
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(application)}
                          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700 transition hover:bg-rose-100"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <p className="text-lg font-bold text-slate-800">該当する企業がありません</p>
              <p className="mt-2 text-sm text-slate-500">
                検索条件を変えるか、新しい企業を追加してください。
              </p>
              <Link
                href="/applications/new"
                className="mt-5 inline-block rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
              >
                企業を追加する
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
