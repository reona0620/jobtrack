"use client";

import { useCallback, useSyncExternalStore } from "react";
import { mockApplications } from "@/data/mock-applications";
import type {
  ApplicationSchedule,
  ApplicationStatus,
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
  "considering",
  "applied",
  "interview",
  "offer",
  "rejected",
];
const scheduleTypes: ScheduleType[] = ["interview", "internship", "other"];

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

  const selectionType: SelectionType =
    application.selectionType === "internship" ? "internship" : "full_time";
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

  return {
    id: application.id,
    selectionType,
    companyName: application.companyName,
    position: application.position,
    status,
    deadline:
      typeof application.deadline === "string" ? application.deadline : null,
    schedules,
    companyUrl:
      typeof application.companyUrl === "string" ? application.companyUrl : null,
    memo: application.memo,
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
