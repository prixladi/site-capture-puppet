import mongoose from 'mongoose';
import { launch } from 'puppeteer';
import { connect as connectDb, disconnect as disconnectDb } from './db';
import { JobDoc } from './db/job';
import puppet from './pupet';

let exiting = false;

const runLoop = async (jobModel: mongoose.Model<JobDoc>): Promise<void> => {
  const delay = (ms: number): Promise<void> => new Promise((res) => setTimeout(res, ms));
  const browser = await launch();

  while (!exiting) {
    try {
      const job = await jobModel.findOneAndUpdate({ progress: { $exists: false } }, { $set: { progress: 0 } });
      if (job) {
        console.log(`Found job to proccess id: '${job._id}'.`);
        const start = new Date();

        await puppet({ job, jobModel, browser });

        const end = new Date();
        const elapsed = end.getTime() - start.getTime();
        console.log(`Job with id '${job._id}' proccessed in ${elapsed}ms.`);
      } else {
        await delay(1000);
      }
    } catch (err) {
      console.error(err);
      await delay(1000);
    }
  }

  await browser.close();
};

const main = async () => {
  const { JobModel } = await connectDb();

  const shutdown = async () => {
    exiting = true;

    await disconnectDb();

    process.exit();
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  await runLoop(JobModel);
};

main().catch((err) => {
  console.error(err);
});
