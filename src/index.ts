import { launch } from 'puppeteer';
import { browserConfig } from './configs';
import { percentOnAquire } from './constants';
import { connect as connectDb, DB, disconnect as disconnectDb } from './db';
import { logJobFinish, logJobStart } from './logger';
import puppet from './pupet';
import StopWatch from './stopwatch';

let exiting = false;

const runLoop = async (db: DB): Promise<void> => {
  const delay = (ms: number): Promise<void> => new Promise((res) => setTimeout(res, ms));
  const browser = await launch(browserConfig.useSandbox ? undefined : { args: ['--no-sandbox'] });

  // TODO: Use MongoDB change streams
  // TODO: Use redis to notify about new job added to DB
  // TODO: Notify server that job has been finished
  while (!exiting) {
    try {
      const job = await db.jobModel.findOneAndUpdate({ aquired: false }, { $set: { progress: percentOnAquire, aquired: true } });
      if (job) {
        logJobStart(job._id.toString());
        const stopwatch = new StopWatch();
        await puppet({ job, db, browser });
        logJobFinish(job._id.toString(), stopwatch);
      } else {
        await delay(2000);
      }
    } catch (err) {
      console.error(err);
      await delay(2000);
    }
  }

  await browser.close();
};

const main = async () => {
  const db = await connectDb();

  const shutdown = async () => {
    exiting = true;

    await disconnectDb();

    process.exit();
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  await runLoop(db);
};

main().catch((err) => {
  console.error(err);
});
