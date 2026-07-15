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
  JobApplicationInput,
} from "@/types/application";

type ApplicationFormProps = {
  initialValue?: JobApplicationInput;
  submitLabel: string;
  onSubmit: (input: JobApplicationInput) => void;
};

const emptyValue: JobApplicationInput = {
  selectionType: "full_time",
  companyName: "",
  position: "",
  status: "considering",
  deadline: null,
  schedules: [],
  companyUrl: null,
  memo: "",
};

const inputClasses =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

function createScheduleId() {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `schedule-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function ApplicationForm({
  initialValue = emptyValue,
  submitLabel,
  onSubmit,
}: ApplicationFormProps) {
  const [form, setForm] = useState(initialValue);
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.companyName.trim() || !form.position.trim()) {
      setError("企業名と応募職種を入力してください。");
      return;
    }

    const invalidScheduleIndex = form.schedules.findIndex(
      (schedule) =>
        schedule.endsAt !== null && schedule.endsAt < schedule.startsAt,
    );
    if (invalidScheduleIndex !== -1) {
      setError(
        `予定${invalidScheduleIndex + 1}の終了日時は、開始日時より後に設定してください。`,
      );
      return;
    }

    setError("");
    onSubmit({
      ...form,
      companyName: form.companyName.trim(),
      position: form.position.trim(),
      schedules: form.schedules
        .filter((schedule) => schedule.startsAt)
        .map((schedule) => ({
          ...schedule,
          endsAt: schedule.endsAt || null,
          note: schedule.note.trim(),
        })),
      companyUrl: form.companyUrl?.trim() || null,
      memo: form.memo.trim(),
    });
  }

  function addSchedule() {
    const schedule: ApplicationSchedule = {
      id: createScheduleId(),
      type: form.selectionType === "internship" ? "internship" : "interview",
      startsAt: "",
      endsAt: null,
      note: "",
    };
    setForm((current) => ({
      ...current,
      schedules: [...current.schedules, schedule],
    }));
  }

  function updateSchedule(
    id: string,
    updates: Partial<ApplicationSchedule>,
  ) {
    setForm((current) => ({
      ...current,
      schedules: current.schedules.map((schedule) =>
        schedule.id === id ? { ...schedule, ...updates } : schedule,
      ),
    }));
  }

  function removeSchedule(id: string) {
    setForm((current) => ({
      ...current,
      schedules: current.schedules.filter((schedule) => schedule.id !== id),
    }));
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      {error ? (
        <p
          role="alert"
          className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
        >
          {error}
        </p>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="companyName" className="text-sm font-semibold text-slate-700">
            企業名 <span className="text-rose-500">*</span>
          </label>
          <input
            id="companyName"
            name="companyName"
            required
            value={form.companyName}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                companyName: event.target.value,
              }))
            }
            placeholder="例：サンプル株式会社"
            className={inputClasses}
          />
        </div>

        <div>
          <label htmlFor="selectionType" className="text-sm font-semibold text-slate-700">
            応募区分
          </label>
          <select
            id="selectionType"
            name="selectionType"
            value={form.selectionType}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                selectionType: event.target.value as JobApplicationInput["selectionType"],
              }))
            }
            className={inputClasses}
          >
            {selectionTypes.map((selectionType) => (
              <option key={selectionType} value={selectionType}>
                {selectionTypeLabels[selectionType]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="position" className="text-sm font-semibold text-slate-700">
            応募職種 <span className="text-rose-500">*</span>
          </label>
          <input
            id="position"
            name="position"
            required
            value={form.position}
            onChange={(event) =>
              setForm((current) => ({ ...current, position: event.target.value }))
            }
            placeholder="例：Webエンジニア"
            className={inputClasses}
          />
        </div>

        <div>
          <label htmlFor="status" className="text-sm font-semibold text-slate-700">
            選考状況
          </label>
          <select
            id="status"
            name="status"
            value={form.status}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                status: event.target.value as JobApplicationInput["status"],
              }))
            }
            className={inputClasses}
          >
            {applicationStatuses.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="deadline" className="text-sm font-semibold text-slate-700">
            応募締切
          </label>
          <input
            id="deadline"
            name="deadline"
            type="date"
            value={form.deadline ?? ""}
            onInput={(event) => {
              const deadline = event.currentTarget.value || null;
              setForm((current) => ({ ...current, deadline }));
            }}
            className={inputClasses}
          />
        </div>

        <div>
          <label htmlFor="companyUrl" className="text-sm font-semibold text-slate-700">
            求人・企業URL
          </label>
          <input
            id="companyUrl"
            name="companyUrl"
            type="url"
            value={form.companyUrl ?? ""}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                companyUrl: event.target.value || null,
              }))
            }
            placeholder="https://example.com/jobs"
            className={inputClasses}
          />
        </div>

        <div className="sm:col-span-2">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h3 className="text-sm font-semibold text-slate-700">
                面接・インターン予定
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                開始日時は必須、終了日時は必要な予定だけ入力します。
              </p>
            </div>
            <button
              type="button"
              onClick={addSchedule}
              className="shrink-0 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
            >
              ＋ 予定を追加
            </button>
          </div>

          {form.schedules.length ? (
            <div className="mt-4 space-y-3">
              {form.schedules.map((schedule, index) => (
                <div
                  key={schedule.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[0.8fr_1fr_1fr_auto] lg:items-end">
                    <div>
                      <label
                        htmlFor={`schedule-type-${schedule.id}`}
                        className="text-sm font-semibold text-slate-700"
                      >
                        予定{index + 1}の種類
                      </label>
                      <select
                        id={`schedule-type-${schedule.id}`}
                        value={schedule.type}
                        onChange={(event) =>
                          updateSchedule(schedule.id, {
                            type: event.target
                              .value as ApplicationSchedule["type"],
                          })
                        }
                        className={inputClasses}
                      >
                        {scheduleTypes.map((type) => (
                          <option key={type} value={type}>
                            {scheduleTypeLabels[type]}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor={`schedule-at-${schedule.id}`}
                        className="text-sm font-semibold text-slate-700"
                      >
                        予定{index + 1}の開始日時
                      </label>
                      <input
                        id={`schedule-at-${schedule.id}`}
                        type="datetime-local"
                        required
                        value={schedule.startsAt}
                        onInput={(event) => {
                          const startsAt = event.currentTarget.value;
                          updateSchedule(schedule.id, { startsAt });
                        }}
                        className={inputClasses}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`schedule-end-${schedule.id}`}
                        className="text-sm font-semibold text-slate-700"
                      >
                        予定{index + 1}の終了日時
                        <span className="ml-1 font-normal text-slate-400">
                          （任意）
                        </span>
                      </label>
                      <input
                        id={`schedule-end-${schedule.id}`}
                        type="datetime-local"
                        min={schedule.startsAt || undefined}
                        value={schedule.endsAt ?? ""}
                        onInput={(event) => {
                          const endsAt = event.currentTarget.value || null;
                          updateSchedule(schedule.id, { endsAt });
                        }}
                        className={inputClasses}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => removeSchedule(schedule.id)}
                      className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 transition hover:bg-rose-100"
                    >
                      削除
                    </button>
                  </div>

                  <div className="mt-4">
                    <label
                      htmlFor={`schedule-note-${schedule.id}`}
                      className="text-sm font-semibold text-slate-700"
                    >
                      予定{index + 1}のメモ
                    </label>
                    <input
                      id={`schedule-note-${schedule.id}`}
                      value={schedule.note}
                      onChange={(event) =>
                        updateSchedule(schedule.id, {
                          note: event.target.value,
                        })
                      }
                      placeholder="例：一次面接（オンライン）"
                      className={inputClasses}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-7 text-center text-sm text-slate-500">
              予定はまだ登録されていません。
            </div>
          )}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="memo" className="text-sm font-semibold text-slate-700">
            メモ
          </label>
          <textarea
            id="memo"
            name="memo"
            rows={5}
            value={form.memo}
            onChange={(event) =>
              setForm((current) => ({ ...current, memo: event.target.value }))
            }
            placeholder="企業研究、面接で聞きたいこと、選考の振り返りなど"
            className={`${inputClasses} resize-y`}
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full rounded-xl bg-blue-600 px-5 py-3.5 font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200"
      >
        {submitLabel}
      </button>
    </form>
  );
}
