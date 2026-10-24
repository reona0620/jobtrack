"use client";

import { useCallback, useSyncExternalStore } from "react";
import { mockApplications } from "@/data/mock-applications";
import type {
  ApplicationSchedule,
  ApplicationTrack,
  ApplicationStatus,
  EntrySheetResponse,
  JobApplication,
  JobApplicationInput,
  ScheduleType,
  SelectionType,
} from "@/types/application";

const STORAGE_KEY = "jobtrack.applications.v1";
const STORAGE_EVENT = "jobtrack:applications-updated";
const serverSnapshot = mockApplications;

let cachedApplications: JobApplication[] | null = null;
const applicationStatuses: ApplicationStatus[] = [
  "applied",
  "interview",
  "offer",
  "offer_declined",
  "rejected",
];
const scheduleTypes: ScheduleType[] = ["interview", "internship", "other"];
const selectionTypes: SelectionType[] = ["full_time", "early_selection", "internship"];

function normalizeSchedule(value: unknown): ApplicationSchedule | null {
  if (!value || typeof value !== "object") return null;

  const schedule = value as Partial<ApplicationSchedule>;
  if (
    typeof schedule.id !== "string" ||
    typeof schedule.type !== "string" ||
    typeof schedule.startsAt !== "string" ||
    typeof schedule.note !== "string"
  ) {
    return null;
  }

  const type = scheduleTypes.includes(schedule.type as ScheduleType)
    ? (schedule.type as ScheduleType)
    : "other";

  return {
    id: schedule.id,
    type,
    startsAt: schedule.startsAt,
    endsAt: typeof schedule.endsAt === "string" ? schedule.endsAt : null,
    note: schedule.note,
  };
}

function normalizeTrack(value: unknown): ApplicationTrack | null {
  if (!value || typeof value !== "object") return null;
  const track = value as Partial<ApplicationTrack>;
  if (typeof track.id !== "string") return null;
  const selectionType = selectionTypes.includes(track.selectionType as SelectionType)
    ? (track.selectionType as SelectionType)
    : null;
  const status = applicationStatuses.includes(track.status as ApplicationStatus)
    ? (track.status as ApplicationStatus)
    : "considering";
  const schedules = Array.isArray(track.schedules)
    ? track.schedules.map(normalizeSchedule).filter((item): item is ApplicationSchedule => item !== null)
    : [];
  const entrySheetResponses = Array.isArray(track.entrySheetResponses)
    ? track.entrySheetResponses.filter(
        (item): item is EntrySheetResponse =>
          !!item && typeof item.id === "string" && typeof item.question === "string" && typeof item.answer === "string",
      )
    : [];
  return {
    id: track.id,
    selectionType,
    position: typeof track.position === "string" ? track.position : "",
    status: status === "considering" ? "applied" : status,
    deadline: typeof track.deadline === "string" ? track.deadline : null,
    schedules,
    memo: typeof track.memo === "string" ? track.memo : "",
    entrySheetResponses,
  };
}

function normalizeApplication(value: unknown): JobApplication | null {
  if (!value || typeof value !== "object") return null;

  const application = value as Partial<JobApplication>;
  if (
    typeof application.id !== "string" ||
    typeof application.companyName !== "string" ||
    typeof application.position !== "string" ||
    typeof application.status !== "string" ||
    typeof application.memo !== "string" ||
    typeof application.createdAt !== "string" ||
    typeof application.updatedAt !== "string"
  ) {
    return null;
  }

  const storedSelectionType: SelectionType | null = selectionTypes.includes(application.selectionType as SelectionType)
    ? (application.selectionType as SelectionType)
    : null;
  const status = applicationStatuses.includes(
    application.status as ApplicationStatus,
  )
    ? (application.status as ApplicationStatus)
    : "considering";
  const schedules = Array.isArray(application.schedules)
    ? application.schedules
        .map(normalizeSchedule)
        .filter((schedule): schedule is ApplicationSchedule => schedule !== null)
    : [];
  const storedEntrySheetResponses = Array.isArray(application.entrySheetResponses)
    ? application.entrySheetResponses
        .filter(
          (item): item is { id: string; question: string; answer: string } =>
            !!item &&
            typeof item === "object" &&
            typeof item.id === "string" &&
            typeof item.question === "string" &&
            typeof item.answer === "string",
        )
    : [];
  const entrySheetResponses = storedEntrySheetResponses.length
    ? storedEntrySheetResponses
    : typeof application.entrySheetText === "string" && application.entrySheetText.trim()
      ? [{ id: `legacy-${application.id}`, question: "", answer: application.entrySheetText }]
      : [];
  const positions = Array.isArray(application.positions)
    ? application.positions.filter(
        (position): position is string => typeof position === "string" && !!position.trim(),
      )
    : application.position.trim()
      ? [application.position]
      : [];
  const isUnfilledQuickRegistration =
    storedSelectionType === "full_time" &&
    status === "considering" &&
    !application.position.trim() &&
    !application.deadline &&
    schedules.length === 0 &&
    !application.memo.trim();
  const selectionType = isUnfilledQuickRegistration ? null : storedSelectionType;
  const legacyTrackHasData = !!(
    selectionType || positions.length || status !== "considering" || application.deadline ||
    schedules.length || application.memo.trim() || entrySheetResponses.length
  );
  const tracks = Array.isArray(application.tracks)
    ? application.tracks.map(normalizeTrack).filter((track): track is ApplicationTrack => track !== null)
    : legacyTrackHasData
      ? [{
          id: `legacy-track-${application.id}`,
          selectionType,
          position: positions.join("・"),
          status: status === "considering" ? "applied" : status,
          deadline: typeof application.deadline === "string" ? application.deadline : null,
          schedules,
          memo: application.memo,
          entrySheetResponses,
        }]
      : [];
  const firstTrack = tracks[0];

  return {
    id: application.id,
    selectionType: firstTrack?.selectionType ?? selectionType,
    companyName: application.companyName,
    position: firstTrack?.position ?? positions.join("・"),
    positions: tracks.map((track) => track.position).filter(Boolean),
    status: firstTrack?.status ?? status,
    deadline: firstTrack?.deadline ?? (typeof application.deadline === "string" ? application.deadline : null),
    schedules: firstTrack?.schedules ?? schedules,
    companyUrl:
      typeof application.companyUrl === "string" ? application.companyUrl : null,
    userId: typeof application.userId === "string" ? application.userId : null,
    memo: firstTrack?.memo ?? application.memo,
    entrySheetText:
      typeof application.entrySheetText === "string" ? application.entrySheetText : "",
    entrySheetResponses: firstTrack?.entrySheetResponses ?? entrySheetResponses,
    tracks,
    createdAt: application.createdAt,
    updatedAt: application.updatedAt,
  };
}

function getSnapshot() {
  if (cachedApplications) return cachedApplications;

  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);
    if (!storedValue) {
      cachedApplications = mockApplications;
      return cachedApplications;
    }

    const parsedValue: unknown = JSON.parse(storedValue);
    if (!Array.isArray(parsedValue)) {
      cachedApplications = mockApplications;
      return cachedApplications;
    }

    const normalizedApplications = parsedValue.map(normalizeApplication);
    cachedApplications = normalizedApplications.every(
      (application): application is JobApplication => application !== null,
    )
      ? normalizedApplications
      : mockApplications;
  } catch {
    cachedApplications = mockApplications;
  }

  return cachedApplications;
}

function getServerSnapshot() {
  return serverSnapshot;
}

function subscribe(listener: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    cachedApplications = null;
    listener();
  };

  window.addEventListener(STORAGE_EVENT, listener);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(STORAGE_EVENT, listener);
    window.removeEventListener("storage", handleStorage);
  };
}

function persist(nextApplications: JobApplication[]) {
  cachedApplications = nextApplications;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextApplications));
  window.dispatchEvent(new Event(STORAGE_EVENT));
}

function createId() {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function useApplications() {
  const applications = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const addApplication = useCallback((input: JobApplicationInput) => {
    const now = new Date().toISOString();
    const application: JobApplication = {
      ...input,
      id: createId(),
      createdAt: now,
      updatedAt: now,
    };

    persist([application, ...getSnapshot()]);
    return application.id;
  }, []);

  const updateApplication = useCallback(
    (id: string, input: JobApplicationInput) => {
      const now = new Date().toISOString();
      persist(
        getSnapshot().map((application) =>
          application.id === id
            ? { ...application, ...input, updatedAt: now }
            : application,
        ),
      );
    },
    [],
  );

  const deleteApplication = useCallback((id: string) => {
    persist(getSnapshot().filter((application) => application.id !== id));
  }, []);

  return {
    applications,
    addApplication,
    updateApplication,
    deleteApplication,
  };
}
