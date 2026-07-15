export type ApplicationStatus =
  | "considering"
  | "applied"
  | "interview"
  | "offer"
  | "rejected";

export type JobApplication = {
  id: number;
  companyName: string;
  position: string;
  status: ApplicationStatus;
  deadline: string | null;
};