import type { Metadata } from "next";
import { NewApplicationView } from "@/components/new-application-view";

export const metadata: Metadata = {
  title: "企業を追加 | JobTrack",
};

export default function NewApplicationPage() {
  return <NewApplicationView />;
}
