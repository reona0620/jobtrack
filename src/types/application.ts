export type ApplicationStatus =
  | "considering"
  | "applied"
  | "interview"
  | "offer"
  | "offer_declined"
  | "rejected";

export type SelectionType = "full_time" | "early_selection" | "internship";

export type ScheduleType = "interview" | "internship" | "other";

export type ApplicationSchedule = {
  id: string;
  type: ScheduleType;
  startsAt: string;
  endsAt: string | null;
  note: string;
};

export type EntrySheetResponse = {
  id: string;
  question: string;
  answer: string;
};

export type ApplicationTrack = {
  id: string;
  selectionType: SelectionType | null;
  position: string;
  status: ApplicationStatus;
  deadline: string | null;
  schedules: ApplicationSchedule[];
  memo: string;
  entrySheetResponses: EntrySheetResponse[];
};

export type JobApplication = {
  id: string;
  selectionType: SelectionType | null;
  companyName: string;
  position: string;
  positions?: string[];
  status: ApplicationStatus;
  deadline: string | null;
  schedules: ApplicationSchedule[];
  companyUrl: string | null;
  userId?: string | null;
  memo: string;
  entrySheetText?: string;
  entrySheetResponses?: EntrySheetResponse[];
  tracks?: ApplicationTrack[];
  createdAt: string;
  updatedAt: string;
};

export type JobApplicationInput = Omit<
  JobApplication,
  "id" | "createdAt" | "updatedAt"
>;
