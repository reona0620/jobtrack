import type { Metadata } from "next";
import { Dashboard } from "@/components/dashboard";

export const metadata: Metadata = {
  title: "応募企業 | JobTrack",
};

export default async function ApplicationsPage({
  searchParams,
}: PageProps<"/applications">) {
  const { filter } = await searchParams;
  const validFilters = ["all", "active", "interview", "offer"] as const;
  const initialFilter = validFilters.includes(filter as (typeof validFilters)[number])
    ? (filter as (typeof validFilters)[number])
    : "all";

  return <Dashboard key={initialFilter} view="applications" initialFilter={initialFilter} />;
}
