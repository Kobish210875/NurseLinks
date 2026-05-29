export type ModerationContentType = "post" | "comment" | "message";

export type ModerationFlagSource = "auto" | "user_report";

export type ModerationFlagStatus = "pending" | "reviewed" | "dismissed";

export type ModerationResolution = "dismissed" | "content_deleted" | "user_suspended";
