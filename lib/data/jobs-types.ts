export type JobStatus = "active" | "filled";

export type JobApplicationView = {
  id: string;
  applicantId: string;
  fullName: string;
  phone: string;
  note: string | null;
  cvUrl: string | null;
  cvFileName: string | null;
  createdAt: string;
  timeLabel: string;
  isUnread: boolean;
};

export type JobApplicationInboxItem = {
  application: JobApplicationView;
  job: {
    id: string;
    title: string;
    hospital: string | null;
    city: string | null;
  };
};

export type JobListing = {
  id: string;
  isOwner: boolean;
  title: string;
  body: string;
  hospital: string | null;
  city: string | null;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
  filledAt: string | null;
  timeLabel: string;
  isUnread: boolean;
  hasApplied: boolean;
  /** Owner: unread applications since last visit to jobs. */
  hasNewApplications: boolean;
  applications: JobApplicationView[];
};
