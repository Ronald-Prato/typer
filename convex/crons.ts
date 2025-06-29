import { cronJobs } from "convex/server";
import { api, internal } from "./_generated/api";

const crons = cronJobs();

// crons.interval(
//   "update-snippets-each-minute",
//   { minutes: 1 }, // mínimo permitido
//   internal.snippets.updateSnippetsScheduled // tu mutation o función server
// );

export default crons;
