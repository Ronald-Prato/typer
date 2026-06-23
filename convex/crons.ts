import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// crons.interval(
//   "update-snippets-each-minute",
//   { seconds: 30 },
//   internal.snippets.updateSnippetsScheduled // tu mutation o función server
// );

crons.interval(
  "match-queued-users-every-10-seconds",
  { seconds: 10 },
  internal.queue.matchQueuedUsers
);

export default crons;
