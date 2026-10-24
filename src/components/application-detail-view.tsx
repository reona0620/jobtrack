"use client";

import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { useApplications } from "@/hooks/use-applications";
import {
  formatDate,
  formatDateTime,
  scheduleTypeBadgeClasses,
  scheduleTypeLabels,
  selectionTypeBadgeClasses,
  selectionTypeLabels,
  statusBadgeClasses,
  statusLabels,
} from "@/lib/application";

export function ApplicationDetailView({ id }: { id: string }) {
  const { applications } = useApplications();
  const company = applications.find((item) => item.id === id);

  if (!company) {
    return (
      <main className="min-h-screen bg-[#f5f7fb]">
        <PageHeader title="企業が見つかりません" subtitle="削除されたか、URLが正しくない可能性があります。" showBackLink={false} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb]">
      <PageHeader title={company.companyName} subtitle="企業の基本情報と応募情報を管理できます。" showBackLink={false} />
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-8 sm:py-10">
        <section className="overflow-hidden rounded-[1.4rem] border border-slate-200/90 bg-white shadow-sm">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-8">
            <h2 className="font-bold text-slate-900">企業の基本情報</h2>
            <Link href={"/applications/" + company.id + "/edit"} className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50">
              企業情報を編集
            </Link>
          </header>
          <dl className="grid gap-5 px-5 py-5 sm:grid-cols-2 sm:px-8">
            <div>
              <dt className="text-sm font-bold text-slate-500">企業名</dt>
              <dd className="mt-1 font-semibold text-slate-900">{company.companyName}</dd>
            </div>
            <div>
              <dt className="text-sm font-bold text-slate-500">ログインID</dt>
              <dd className="mt-1 break-all font-semibold text-slate-900">{company.userId || "未登録"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-bold text-slate-500">マイページのURL</dt>
              <dd className="mt-1 break-all">
                {company.companyUrl ? (
                  <a href={company.companyUrl} target="_blank" rel="noreferrer" className="font-semibold text-teal-800 underline underline-offset-2">{company.companyUrl} ↗</a>
                ) : (
                  <span className="text-slate-400">未登録</span>
                )}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-[1.4rem] border border-slate-200/90 bg-white p-5 shadow-sm sm:p-8">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-bold text-slate-900">応募情報</h2>
              <p className="mt-1 text-sm text-slate-500">応募区分ごとに職種・選考状況・日程を管理できます。</p>
            </div>
            <Link href={"/applications/" + company.id + "/edit"} className="inline-flex rounded-xl bg-teal-700 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800">
              ＋ 応募情報を追加・編集
            </Link>
          </header>

          {company.tracks?.length ? (
            <div className="mt-5 space-y-5">
              {company.tracks.map((track, index) => (
                <article key={track.id} className="overflow-hidden rounded-[1.2rem] border border-slate-200 bg-slate-50">
                  <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-400">応募情報 {index + 1}</p>
                      <h3 className="mt-1 truncate text-lg font-bold text-slate-900">{track.position || "職種未入力"}</h3>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {track.selectionType ? (
                          <span className={"rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset " + selectionTypeBadgeClasses[track.selectionType]}>{selectionTypeLabels[track.selectionType]}</span>
                        ) : null}
                        <span className={"rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset " + statusBadgeClasses[track.status]}>{statusLabels[track.status]}</span>
                      </div>
                    </div>
                    <Link href={"/applications/" + company.id + "/edit"} className="inline-flex rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                      応募情報を編集
                    </Link>
                  </header>

                  <div className="divide-y divide-slate-200 px-5 sm:px-6">
                    <section className="py-4">
                      <h4 className="text-sm font-bold text-slate-500">応募締切</h4>
                      <p className="mt-1 font-semibold text-slate-900">{formatDate(track.deadline)}</p>
                    </section>

                    <section className="py-4">
                      <h4 className="text-sm font-bold text-slate-500">面接・選考の日程</h4>
                      {track.schedules.length ? (
                        <ul className="mt-3 space-y-3">
                          {track.schedules.map((schedule) => (
                            <li key={schedule.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                              <span className={"inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset " + scheduleTypeBadgeClasses[schedule.type]}>{scheduleTypeLabels[schedule.type]}</span>
                              <p className="mt-2 font-semibold text-slate-900">
                                {formatDateTime(schedule.startsAt)}
                                {schedule.endsAt ? " 〜 " + formatDateTime(schedule.endsAt) : ""}
                              </p>
                              {schedule.note ? <p className="mt-1 text-sm text-slate-600">{schedule.note}</p> : null}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-sm text-slate-500">日程はまだ登録されていません。</p>
                      )}
                    </section>

                    <section className="py-4">
                      <div>
                        <h4 className="text-sm font-bold text-slate-500">ES内容</h4>
                        <p className="mt-1 text-xs text-slate-400">この応募情報に紐づく設問と回答</p>
                      </div>
                      {track.entrySheetResponses.length ? (
                        <div className="mt-3 space-y-3">
                          {track.entrySheetResponses.map((response, responseIndex) => (
                            <div key={response.id} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                              <h5 className="text-xs font-bold text-slate-500">設問 {responseIndex + 1}</h5>
                              {response.question ? <p className="mt-2 whitespace-pre-wrap break-words font-semibold leading-6 text-slate-800">{response.question}</p> : null}
                              <p className="mt-4 text-xs font-bold text-slate-500">回答</p>
                              <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">{response.answer || "未入力"}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-slate-500">ESはまだ登録されていません。</p>
                      )}
                    </section>

                    {track.memo ? (
                      <section className="py-4">
                        <h4 className="text-sm font-bold text-slate-500">メモ</h4>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{track.memo}</p>
                      </section>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
              <p className="text-sm text-slate-600">応募情報はまだ登録されていません。</p>
              <p className="mt-1 text-sm text-slate-400">応募区分ごとに追加できます。</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

