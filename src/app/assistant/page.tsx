import type { Metadata } from "next";
import { AssistantView } from "@/components/assistant-view";

export const metadata: Metadata = {
  title: "AIに質問 | JobTrack",
};

export default function AssistantPage() {
  return <AssistantView />;
}
