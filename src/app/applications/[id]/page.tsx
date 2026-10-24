import type { Metadata } from "next";
import { ApplicationDetailView } from "@/components/application-detail-view";

export const metadata: Metadata = {
  title: "企業の詳細 | JobTrack",
};

export default async function ApplicationDetailPage({
  params,
}: PageProps<"/applications/[id]">) {
  const { id } = await params;
  return <ApplicationDetailView id={id} />;
}
