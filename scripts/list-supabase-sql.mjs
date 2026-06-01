#!/usr/bin/env node
/**
 * Prints Supabase SQL files in recommended run order (for new dev project setup).
 * Usage: npm run sql:list
 */
const order = [
  "schema.sql",
  "storage.sql",
  "post-images.sql",
  "feed-social.sql",
  "feed-post-delete.sql",
  "post-comment-likes.sql",
  "post-comment-replies.sql",
  "post-shares.sql",
  "jobs.sql",
  "job-applications.sql",
  "jobs-scaling.sql",
  "job-applications-seen.sql",
  "job-applications-read.sql",
  "job-applications-cv.sql",
  "profile-workplace.sql",
  "medical-institutions.sql",
  "connections-messaging.sql",
  "messages-open-send.sql",
  "connection-remove-friend.sql",
  "profile-cv.sql",
  "account-deletion-and-recommendations.sql",
  "recommendation-snapshots.sql",
  "recommendation-workplace.sql",
  "admin.sql",
  "moderation.sql",
];

console.log("Run these in Supabase SQL Editor (dev project), in order:\n");
order.forEach((file, i) => {
  console.log(`${String(i + 1).padStart(2, "0")}. supabase/${file}`);
});
console.log("\nFixes (only if needed):");
console.log("    supabase/profile-cv-fix.sql");
console.log("    supabase/connections-messaging-fix.sql");
console.log("    supabase/jobs-cleanup-filled.sql");
