export type ApplicationStatus =
  | "considering"
  | "applied"
  | "interview"
  | "offer"
  | "rejected";

export type SelectionType = "full_time" | "internship";

export type ScheduleType = "interview" | "internship" | "other";

export type ApplicationSchedule = {
  id: string;
  type: ScheduleType;
  startsAt: string;
  endsAt: string | null;
  note: string;
};

export type JobApplication = {
  id: string;
  selectionType: SelectionType;
  companyName: string;
  position: string;
  status: ApplicationStatus;
  deadline: string | null;
  schedules: ApplicationSchedule[];
  companyUrl: string | null;
  memo: string;
  createdAt: string;
  updatedAt: string;
};

export type JobApplicationInput = Omit<
  JobApplication,
  "id" | "createdAt" | "updatedAt"
>;
