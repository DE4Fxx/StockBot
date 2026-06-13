import { retrieveUpcomingSplitsFromTipRanks } from "./marketdata.js";

// Helper function to update cache every interval

async function run() {
  try {
    await retrieveUpcomingSplitsFromTipRanks(process.env.TIP_RANKS_UPCOMING);
    console.log("Updated at", new Date().toISOString());
    process.exit(0);
  } catch (err) {
    console.error("Update failed:", err);
    process.exit(1);
  }
}

run();