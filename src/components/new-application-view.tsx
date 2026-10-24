"use client";

import { useRouter } from "next/navigation";
import { ApplicationForm } from "@/components/application-form";
import { PageHeader } from "@/components/page-header";
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
    <main className="min-h-screen bg-[#f5f7fb]">
      <PageHeader title="企業を登録" subtitle="企業情報と選考の予定をまとめて登録できます。" />
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-8 sm:py-10">
        <ApplicationForm submitLabel="企業を登録する" onSubmit={handleSubmit} />
      </div>
    </main>
  );
}
