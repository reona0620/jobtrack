"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApplicationForm } from "@/components/application-form";
import { useApplications } from "@/hooks/use-applications";
import type { JobApplicationInput } from "@/types/application";

export function EditApplicationView({ id }: { id: string }) {
  const router = useRouter();
  const { applications, updateApplication } = useApplications();
  const application = applications.find((item) => item.id === id);

  if (!application) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <h1 className="text-2xl font-black text-slate-900">企業が見つかりません</h1>
          <p className="mt-2 text-slate-500">削除されたか、URLが正しくない可能性があります。</p>
          <Link href="/" className="mt-6 inline-block font-bold text-blue-600 hover:text-blue-800">
            ダッシュボードへ戻る
          </Link>
        </div>
      </main>
    );
  }

  const initialValue: JobApplicationInput = {
    selectionType: application.selectionType,
    companyName: application.companyName,
    position: application.position,
    status: application.status,
    deadline: application.deadline,
    schedules: application.schedules,
    companyUrl: application.companyUrl,
    memo: application.memo,
  };

  function handleSubmit(input: JobApplicationInput) {
    updateApplication(id, input);
    router.push("/");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-bold text-blue-600 hover:text-blue-800">
          ← ダッシュボードへ戻る
        </Link>
        <header className="my-7">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
            Edit application
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">
            {application.companyName}を編集
          </h1>
          <p className="mt-3 text-slate-600">選考の進捗や面接メモを最新の状態にします。</p>
        </header>
        <ApplicationForm
          initialValue={initialValue}
          submitLabel="変更を保存する"
          onSubmit={handleSubmit}
        />
      </div>
    </main>
  );
}
