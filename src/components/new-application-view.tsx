"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApplicationForm } from "@/components/application-form";
import { useApplications } from "@/hooks/use-applications";
import type { JobApplicationInput } from "@/types/application";

export function NewApplicationView() {
  const router = useRouter();
  const { addApplication } = useApplications();

  function handleSubmit(input: JobApplicationInput) {
    addApplication(input);
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
            New application
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">
            企業を追加
          </h1>
          <p className="mt-3 text-slate-600">
            応募先と選考情報を登録します。あとからいつでも編集できます。
          </p>
        </header>
        <ApplicationForm submitLabel="企業を登録する" onSubmit={handleSubmit} />
      </div>
    </main>
  );
}
