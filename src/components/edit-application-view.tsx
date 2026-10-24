"use client";

import { useRouter } from "next/navigation";
import { ApplicationForm } from "@/components/application-form";
import { PageHeader } from "@/components/page-header";
import { useApplications } from "@/hooks/use-applications";
import type { JobApplicationInput } from "@/types/application";

export function EditApplicationView({ id }: { id: string }) {
  const router = useRouter();
  const { applications, updateApplication } = useApplications();
  const application = applications.find((item) => item.id === id);

  if (!application) {
    return (
      <main className="min-h-screen bg-[#f5f7fb]">
        <PageHeader title="企業が見つかりません" subtitle="削除されたか、URLが正しくない可能性があります。" />
      </main>
    );
  }

  const initialValue: JobApplicationInput = {
    selectionType: application.selectionType,
    companyName: application.companyName,
    position: application.position,
    positions: application.positions ?? (application.position ? [application.position] : []),
    status: application.status,
    deadline: application.deadline,
    schedules: application.schedules,
    companyUrl: application.companyUrl,
    userId: application.userId ?? null,
    memo: application.memo,
    entrySheetText: application.entrySheetText ?? "",
    entrySheetResponses: application.entrySheetResponses ?? [],
    tracks: application.tracks ?? [],
  };

  function handleSubmit(input: JobApplicationInput) {
    updateApplication(id, input);
    router.push("/");
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb]">
      <PageHeader title={`${application.companyName}の情報`} brandSubtitle="応募区分ごとに職種や選考状況、面接日程を管理できます。" />
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-8 sm:py-10">
        <ApplicationForm
          initialValue={initialValue}
          submitLabel="変更を保存する"
          onSubmit={handleSubmit}
        />
      </div>
    </main>
  );
}
