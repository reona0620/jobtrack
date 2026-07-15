import type { JobApplication } from "@/types/application";

export const mockApplications: JobApplication[] = [
  {
    id: 1,
    companyName: "サンプル株式会社",
    position: "Webエンジニア",
    status: "applied",
    deadline: "2026-07-31",
  },
  {
    id: 2,
    companyName: "テストテクノロジー株式会社",
    position: "フロントエンドエンジニア",
    status: "considering",
    deadline: null,
  },
];