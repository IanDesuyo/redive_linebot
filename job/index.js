const CronJob = require("cron").CronJob;
const script = require("./bin");

let monthJob = new CronJob("0 0 0 1 * *", script.Group.resetRecords);
let dailyJob = new CronJob("0 0 0 * * *", daily);
let nonStopJob = new CronJob("0 0 * * * *", script.heartbeat);
let eventRunning = false;
let eventJob = new CronJob("* * * * * *", async () => {
  if (eventRunning) return;
  eventRunning = true;
  await script.Event.eventDequeue();
  eventRunning = false;
});
let updateRunning = false;
let updateRecordJob = new CronJob("*/5 * * * * *", async () => {
  if (updateRunning) return;
  updateRunning = true;
  await script.Event.updateRecord();
  updateRunning = false;
});

dailyJob.start();
nonStopJob.start();
eventJob.start();
monthJob.start();
updateRecordJob.start();

async function daily() {
  await Promise.all([
    script.CustomerOrder.removeDeleted(),
    script.CustomerOrder.markUseless(),
    script.Group.clearClosed(),
    script.Group.clearLeftMembers(),
  ]);
}
