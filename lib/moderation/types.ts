export type ModerationContentType = "post" | "comment" | "message" | "discussion" | "discussion_reply";

export type ModerationFlagSource = "auto" | "user_report";

export type ModerationFlagStatus = "pending" | "reviewed" | "dismissed";

export type ModerationResolution = "dismissed" | "content_deleted" | "user_suspended";
