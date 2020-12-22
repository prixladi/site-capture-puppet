import { launch } from 'puppeteer';
import { connect as connectDb, DB, disconnect as disconnectDb } from './db';
import puppet from './pupet';

let exiting = false;

const runLoop = async (db: DB): Promise<void> => {
  const delay = (ms: number): Promise<void> => new Promise((res) => setTimeout(res, ms));
  const browser = await launch();

  // TODO: Use MongoDB change streams
  // TODO: Use redis to notify about new job added to DB
  // TODO: Notify server that job has been finished
  while (!exiting) {
    try {
      const job = await db.jobModel.findOneAndUpdate({ progress: { $exists: false } }, { $set: { progress: 0 } });
      if (job) {
        console.log(`Found job to proccess, id: '${job._id}'.`);
        const start = new Date();
        await puppet({ job, db, browser });
        const end = new Date();
        const elapsed = end.getTime() - start.getTime();
        console.log(`Job with id '${job._id}' proccessed in ${elapsed}ms.`);
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
