import type {
  ApplicationStatus,
  ScheduleType,
  SelectionType,
} from "@/types/application";

export const scheduleTypes: ScheduleType[] = [
  "interview",
  "internship",
  "other",
];

export const scheduleTypeLabels: Record<ScheduleType, string> = {
  interview: "面接",
  internship: "インターン",
  other: "その他",
};

export const scheduleTypeBadgeClasses: Record<ScheduleType, string> = {
  interview: "bg-amber-50 text-amber-700 ring-amber-200",
  internship: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  other: "bg-slate-100 text-slate-700 ring-slate-200",
};

export const selectionTypes: SelectionType[] = ["full_time", "internship"];

export const selectionTypeLabels: Record<SelectionType, string> = {
  full_time: "本選考",
  internship: "インターン",
};

export const selectionTypeBadgeClasses: Record<SelectionType, string> = {
  full_time: "bg-violet-50 text-violet-700 ring-violet-200",
  internship: "bg-cyan-50 text-cyan-700 ring-cyan-200",
};

export const applicationStatuses: ApplicationStatus[] = [
  "considering",
  "applied",
  "interview",
  "offer",
  "rejected",
];

export const statusLabels: Record<ApplicationStatus, string> = {
  considering: "検討中",
  applied: "応募済み",
  interview: "面接中",
  offer: "内定",
  rejected: "不採用",
};

export const statusBadgeClasses: Record<ApplicationStatus, string> = {
  considering: "bg-slate-100 text-slate-700 ring-slate-200",
  applied: "bg-blue-50 text-blue-700 ring-blue-200",
  interview: "bg-amber-50 text-amber-700 ring-amber-200",
  offer: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  rejected: "bg-rose-50 text-rose-700 ring-rose-200",
};

export function formatDate(date: string | null) {
  if (!date) return "未設定";

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

export function formatDateTime(dateTime: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "short",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateTime));
}

export function isDeadlineSoon(date: string | null) {
  if (!date) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(`${date}T00:00:00`);
  const difference = deadline.getTime() - today.getTime();

  return difference >= 0 && difference <= 7 * 24 * 60 * 60 * 1000;
}
