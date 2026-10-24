"use client";

import { useState, type FormEvent } from "react";
import { useApplications } from "@/hooks/use-applications";
import type { JobApplicationInput } from "@/types/application";

const fieldClassName =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-50";

export function HomeRegistrationForm() {
  const { addApplication } = useApplications();
  const [companyName, setCompanyName] = useState("");
  const [companyUrl, setCompanyUrl] = useState("");
  const [userId, setUserId] = useState("");
  const [saved, setSaved] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input: JobApplicationInput = {
      selectionType: null,
      companyName: companyName.trim(),
      position: "",
      positions: [],
      status: "applied",
      deadline: null,
      schedules: [],
      companyUrl: companyUrl.trim() || null,
      userId: userId.trim() || null,
      memo: "",
      entrySheetText: "",
      entrySheetResponses: [],
      tracks: [],
    };

    addApplication(input);
    setCompanyName("");
    setCompanyUrl("");
    setUserId("");
    setSaved(true);
  }

  return (
    <section
      className="mt-7 rounded-[1.75rem] bg-[radial-gradient(#cbd5e1_0.8px,transparent_0.8px)] [background-size:18px_18px] p-4 sm:p-6"
      aria-labelledby="home-registration-heading"
    >
      <div className="mb-3 flex items-center gap-3">
        <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-50 text-lg font-medium text-teal-800">＋</span>
        <h2 id="home-registration-heading" className="text-sm font-semibold tracking-wide text-slate-500">
          企業を登録
        </h2>
      </div>
      <form onSubmit={handleSubmit} className="rounded-[1.4rem] border border-slate-200/90 bg-white/95 p-4 shadow-sm sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="home-company-name" className="text-sm font-semibold text-slate-700">
              企業名 <span className="text-rose-500">*</span>
            </label>
            <input
              id="home-company-name"
              name="companyName"
              required
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              placeholder="例：サンプル株式会社"
              className={fieldClassName}
            />
          </div>
          <div>
            <label htmlFor="home-company-url" className="text-sm font-semibold text-slate-700">
              マイページのURL
            </label>
            <input
              id="home-company-url"
              name="companyUrl"
              type="url"
              value={companyUrl}
              onChange={(event) => setCompanyUrl(event.target.value)}
              placeholder="https://example.com"
              className={fieldClassName}
            />
          </div>
          <div>
            <label htmlFor="home-user-id" className="text-sm font-semibold text-slate-700">
              ログインID
            </label>
            <input
              id="home-user-id"
              name="userId"
              autoComplete="off"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              placeholder="ログインIDなど"
              className={fieldClassName}
            />
          </div>
        </div>
        {saved ? (
          <p role="status" className="mt-4 text-sm font-medium text-teal-800">
            企業を登録しました。登録企業一覧から詳細を追加できます。
          </p>
        ) : null}
        <div className="mt-4 flex justify-end">
          <button type="submit" className="rounded-xl bg-teal-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-teal-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-100">
            企業を登録
          </button>
        </div>
      </form>
    </section>
  );
}
