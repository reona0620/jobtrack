import type { Metadata } from "next";
import { EditApplicationView } from "@/components/edit-application-view";

export const metadata: Metadata = {
  title: "企業情報を編集 | JobTrack",
};

export default async function EditApplicationPage({
  params,
}: PageProps<"/applications/[id]/edit">) {
  const { id } = await params;
  return <EditApplicationView id={id} />;
}
