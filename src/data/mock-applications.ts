import type { JobApplication } from "@/types/application";

export const mockApplications: JobApplication[] = [
  {
    id: "sample-1",
    selectionType: "full_time",
    companyName: "サンプル株式会社",
    position: "Webエンジニア",
    status: "applied",
    deadline: "2026-07-31",
    schedules: [
      {
        id: "sample-schedule-1",
        type: "interview",
        startsAt: "2026-07-24T14:00",
        endsAt: null,
        note: "一次面接（オンライン）",
      },
    ],
    companyUrl: "https://example.com",
    memo: "自社開発のプロダクトについて、面接前に確認する。",
    createdAt: "2026-07-15T00:00:00.000Z",
    updatedAt: "2026-07-15T00:00:00.000Z",
  },
  {
    id: "sample-2",
    selectionType: "internship",
    companyName: "テストテクノロジー株式会社",
    position: "フロントエンドエンジニア",
    status: "considering",
    deadline: null,
    schedules: [
      {
        id: "sample-schedule-2",
        type: "internship",
        startsAt: "2026-08-05T10:00",
        endsAt: "2026-08-07T18:00",
        note: "1day開発インターン",
      },
    ],
    companyUrl: null,
    memo: "募集要項と技術スタックを確認する。",
    createdAt: "2026-07-15T00:00:00.000Z",
    updatedAt: "2026-07-15T00:00:00.000Z",
  },
];
