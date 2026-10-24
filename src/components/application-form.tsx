"use client";

import { useState, type FormEvent } from "react";
import {
  applicationStatuses,
  scheduleTypeLabels,
  scheduleTypes,
  selectionTypeLabels,
  selectionTypes,
  statusLabels,
} from "@/lib/application";
import type {
  ApplicationSchedule,
  ApplicationTrack,
  EntrySheetResponse,
  JobApplicationInput,
} from "@/types/application";

type ApplicationFormProps = {
  initialValue?: JobApplicationInput;
  submitLabel: string;
  onSubmit: (input: JobApplicationInput) => void;
};

const emptyValue: JobApplicationInput = {
  selectionType: null,
  companyName: "",
  position: "",
  positions: [],
  status: "applied",
  deadline: null,
  schedules: [],
  companyUrl: null,
  userId: null,
  memo: "",
  entrySheetText: "",
  entrySheetResponses: [],
  tracks: [],
};

const inputClasses =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-50";
const secondaryButtonClasses =
  "rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700 transition hover:bg-rose-100";

function createId(prefix: string) {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : prefix + "-" + Date.now() + "-" + Math.random().toString(16).slice(2);
}
function createTrack(): ApplicationTrack {
  return {
    id: createId("track"),
    selectionType: null,
    position: "",
    status: "applied",
    deadline: null,
    schedules: [],
    memo: "",
    entrySheetResponses: [],
  };
}

function TrackEditor({
  track,
  index,
  onChange,
  onRemove,
}: {
  track: ApplicationTrack;
  index: number;
  onChange: (updates: Partial<ApplicationTrack>) => void;
  onRemove: () => void;
}) {
  function addSchedule() {
    const schedule: ApplicationSchedule = {
      id: createId("schedule"),
      type: track.selectionType === "internship" ? "internship" : "interview",
      startsAt: "",
      endsAt: null,
      note: "",
    };
    onChange({ schedules: [...track.schedules, schedule] });
  }

  function updateSchedule(id: string, updates: Partial<ApplicationSchedule>) {
    onChange({
      schedules: track.schedules.map((schedule) =>
        schedule.id === id ? { ...schedule, ...updates } : schedule,
      ),
    });
  }

  function removeSchedule(id: string) {
    onChange({ schedules: track.schedules.filter((schedule) => schedule.id !== id) });
  }

  function addEsResponse() {
    const response: EntrySheetResponse = {
      id: createId("es"),
      question: "",
      answer: "",
    };
    onChange({ entrySheetResponses: [...track.entrySheetResponses, response] });
  }

  function updateEsResponse(id: string, updates: Partial<EntrySheetResponse>) {
    onChange({
      entrySheetResponses: track.entrySheetResponses.map((response) =>
        response.id === id ? { ...response, ...updates } : response,
      ),
    });
  }

  function removeEsResponse(id: string) {
    onChange({
      entrySheetResponses: track.entrySheetResponses.filter((response) => response.id !== id),
    });
  }

  return (
    <section className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4 sm:p-5">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <h3 className="font-bold text-slate-900">応募情報 {index + 1}</h3>
        <button type="button" onClick={onRemove} className={secondaryButtonClasses}>削除</button>
      </header>

      <div className="mt-4 grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-semibold text-slate-700">
          応募区分
          <select
            value={track.selectionType ?? ""}
            onChange={(event) => onChange({ selectionType: (event.target.value || null) as ApplicationTrack["selectionType"] })}
            className={inputClasses}
          >
            <option value="">応募区分を選択</option>
            {selectionTypes.map((type) => <option key={type} value={type}>{selectionTypeLabels[type]}</option>)}
          </select>
        </label>

        <label className="text-sm font-semibold text-slate-700">
          職種
          <input
            value={track.position}
            onChange={(event) => onChange({ position: event.target.value })}
            placeholder="例：Webエンジニア"
            className={inputClasses}
          />
        </label>

        <label className="text-sm font-semibold text-slate-700">
          選考状況
          <select
            value={track.status}
            onChange={(event) => onChange({ status: event.target.value as ApplicationTrack["status"] })}
            className={inputClasses}
          >
            {applicationStatuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
          </select>
        </label>

        <label className="text-sm font-semibold text-slate-700">
          応募締切 <span className="font-normal text-slate-400">（任意）</span>
          <input
            type="date"
            value={track.deadline ?? ""}
            onChange={(event) => onChange({ deadline: event.target.value || null })}
            className={inputClasses}
          />
        </label>
      </div>

      <section className="mt-7 border-t border-slate-200 pt-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h4 className="font-bold text-slate-900">選考の日程</h4>
            <p className="mt-1 text-sm text-slate-500">この応募情報に関する面接やイベントを登録します。</p>
          </div>
          <button type="button" onClick={addSchedule} className="rounded-xl bg-teal-700 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-100">
            ＋ 日程を追加
          </button>
        </div>
        {track.schedules.length ? (
          <div className="mt-4 space-y-3">
            {track.schedules.map((schedule, scheduleIndex) => (
              <div key={schedule.id} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <h5 className="text-sm font-bold text-slate-700">日程 {scheduleIndex + 1}</h5>
                  <button type="button" onClick={() => removeSchedule(schedule.id)} className={secondaryButtonClasses}>削除</button>
                </div>
                <fieldset className="mt-4 min-w-0">
                  <legend className="text-sm font-semibold text-slate-700">日程の種類</legend>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {scheduleTypes.map((type) => (
                      <button
                        key={type}
                        type="button"
                        aria-pressed={schedule.type === type}
                        onClick={() => updateSchedule(schedule.id, { type })}
                        className={`min-w-0 rounded-xl border px-2 py-3 text-sm font-semibold transition ${schedule.type === type ? "border-teal-700 bg-teal-50 text-teal-900 ring-2 ring-teal-100" : "border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:bg-slate-50"}`}
                      >
                        {scheduleTypeLabels[type]}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2">
                  <label className="min-w-0 text-sm font-semibold text-slate-700">
                    開始日時
                    <input type="datetime-local" required value={schedule.startsAt} onChange={(event) => updateSchedule(schedule.id, { startsAt: event.target.value })} className={inputClasses + " box-border min-w-0 max-w-full"} />
                  </label>
                  <label className="min-w-0 text-sm font-semibold text-slate-700">
                    終了日時 <span className="font-normal text-slate-400">（任意）</span>
                    <input type="datetime-local" min={schedule.startsAt || undefined} value={schedule.endsAt ?? ""} onChange={(event) => updateSchedule(schedule.id, { endsAt: event.target.value || null })} className={inputClasses + " box-border min-w-0 max-w-full"} />
                  </label>
                </div>
                <label className="mt-4 block text-sm font-semibold text-slate-700">
                  メモ
                  <input value={schedule.note} onChange={(event) => updateSchedule(schedule.id, { note: event.target.value })} placeholder="例：一次面接（オンライン）" className={inputClasses} />
                </label>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">日程はまだ登録されていません。</p>
        )}
      </section>

      <section className="mt-7 border-t border-slate-200 pt-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h4 className="font-bold text-slate-900">ES内容</h4>
            <p className="mt-1 text-sm text-slate-500">設問ごとに回答を分けて保存できます。</p>
          </div>
          <button type="button" onClick={addEsResponse} className="rounded-xl bg-teal-700 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-100">
            ＋ 設問を追加
          </button>
        </div>
        {track.entrySheetResponses.length ? (
          <div className="mt-4 space-y-3">
            {track.entrySheetResponses.map((response, responseIndex) => (
              <div key={response.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h5 className="text-sm font-bold text-slate-700">設問 {responseIndex + 1}</h5>
                  <button type="button" onClick={() => removeEsResponse(response.id)} className={secondaryButtonClasses}>削除</button>
                </div>
                <label className="block text-sm font-semibold text-slate-700">
                  設問内容
                  <textarea rows={2} value={response.question} onChange={(event) => updateEsResponse(response.id, { question: event.target.value })} placeholder="例：学生時代に力を入れたことを教えてください。" className={inputClasses + " resize-y leading-6"} />
                </label>
                <label className="mt-4 block text-sm font-semibold text-slate-700">
                  回答
                  <textarea rows={5} value={response.answer} onChange={(event) => updateEsResponse(response.id, { answer: event.target.value })} placeholder="この設問への回答を入力してください。" className={inputClasses + " resize-y leading-6"} />
                </label>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">設問と回答を追加できます。</p>
        )}
      </section>

      <label className="mt-7 block border-t border-slate-200 pt-5 text-sm font-semibold text-slate-700">
        この応募情報のメモ
        <textarea rows={4} value={track.memo} onChange={(event) => onChange({ memo: event.target.value })} placeholder="この職種・応募区分に関するメモ" className={inputClasses + " resize-y"} />
      </label>
    </section>
  );
}

export function ApplicationForm({ initialValue = emptyValue, submitLabel, onSubmit }: ApplicationFormProps) {
  const [form, setForm] = useState(initialValue);
  const tracks = form.tracks ?? [];
  const [error, setError] = useState("");

  function updateTrack(id: string, updates: Partial<ApplicationTrack>) {
    setForm((current) => ({
      ...current,
      tracks: (current.tracks ?? []).map((track) =>
        track.id === id ? { ...track, ...updates } : track,
      ),
    }));
  }

  function addTrack() {
    setForm((current) => ({
      ...current,
      tracks: [...(current.tracks ?? []), createTrack()],
    }));
  }

  function removeTrack(id: string) {
    setForm((current) => ({
      ...current,
      tracks: (current.tracks ?? []).filter((track) => track.id !== id),
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.companyName.trim()) {
      setError("企業名を入力してください。");
      return;
    }

    for (const track of tracks) {
      const invalidSchedule = track.schedules.find(
        (schedule) => schedule.endsAt && schedule.endsAt < schedule.startsAt,
      );
      if (invalidSchedule) {
        setError("終了日時は開始日時より後に設定してください。");
        return;
      }
    }

    const savedTracks = tracks
      .map((track) => ({
        ...track,
        position: track.position.trim(),
        schedules: track.schedules
          .filter((schedule) => schedule.startsAt)
          .map((schedule) => ({
            ...schedule,
            endsAt: schedule.endsAt || null,
            note: schedule.note.trim(),
          })),
        memo: track.memo.trim(),
        entrySheetResponses: track.entrySheetResponses
          .map((response) => ({
            ...response,
            question: response.question.trim(),
            answer: response.answer.trim(),
          }))
          .filter((response) => response.question || response.answer),
      }))
      .filter(
        (track) =>
          track.selectionType ||
          track.position ||
          track.deadline ||
          track.schedules.length ||
          track.memo ||
          track.entrySheetResponses.length,
      );
    const firstTrack = savedTracks[0] ?? createTrack();

    setError("");
    onSubmit({
      ...form,
      companyName: form.companyName.trim(),
      companyUrl: form.companyUrl?.trim() || null,
      userId: form.userId?.trim() || null,
      tracks: savedTracks,
      selectionType: firstTrack.selectionType,
      position: firstTrack.position,
      positions: savedTracks.map((track) => track.position).filter(Boolean),
      status: firstTrack.status,
      deadline: firstTrack.deadline,
      schedules: firstTrack.schedules,
      memo: firstTrack.memo,
      entrySheetText: "",
      entrySheetResponses: firstTrack.entrySheetResponses,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-[1.4rem] border border-slate-200/90 bg-white p-5 shadow-sm sm:p-7">
      <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
        <span className="font-bold text-rose-600">*</span> は入力必須です。企業の基本情報を登録し、応募情報を必要な分だけ追加できます。
      </div>
      {error ? <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p> : null}

      <section className="rounded-[1.25rem] border border-slate-200 p-4 sm:p-5">
        <h2 className="font-bold text-slate-900">企業の基本情報</h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
            企業名 <span className="text-rose-500">*</span>
            <input required value={form.companyName} onChange={(event) => setForm((current) => ({ ...current, companyName: event.target.value }))} placeholder="例：サンプル株式会社" className={inputClasses} />
          </label>
          <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
            マイページのURL
            <input type="url" value={form.companyUrl ?? ""} onChange={(event) => setForm((current) => ({ ...current, companyUrl: event.target.value || null }))} placeholder="https://example.com" className={inputClasses} />
          </label>
          <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
            ログインID
            <input value={form.userId ?? ""} onChange={(event) => setForm((current) => ({ ...current, userId: event.target.value || null }))} placeholder="応募者ページのログインID" className={inputClasses} />
          </label>
        </div>
      </section>

      <section className="rounded-[1.25rem] border border-slate-200 p-4 sm:p-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-bold text-slate-900">応募情報</h2>
            <p className="mt-1 text-sm text-slate-500">応募区分ごとに職種や選考状況を登録できます。</p>
          </div>
          <button type="button" onClick={addTrack} className="rounded-xl bg-teal-700 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-100">
            ＋ 応募情報を追加
          </button>
        </div>
        {tracks.length ? (
          <div className="mt-4 space-y-4">
            {tracks.map((track, index) => (
              <TrackEditor
                key={track.id}
                track={track}
                index={index}
                onChange={(updates) => updateTrack(track.id, updates)}
                onRemove={() => removeTrack(track.id)}
              />
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
            <p className="text-sm text-slate-500">応募情報はまだありません。</p>
            <p className="mt-1 text-xs text-slate-400">インターンや本選考など、必要なものだけ追加できます。</p>
          </div>
        )}
      </section>

      <button type="submit" className="w-full rounded-xl bg-teal-700 px-5 py-4 font-bold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-100">
        {submitLabel} <span aria-hidden="true">→</span>
      </button>
    </form>
  );
}
