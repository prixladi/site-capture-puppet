import { Browser } from 'puppeteer';
import { JobDoc } from '../db/job';
import fs from 'fs/promises';
import { DB } from '../db';
import zipAndStore from './fileStorage';
import processUrl from './urlProcessor';

type RunConfig = {
  job: JobDoc;
  db: DB;
  browser: Browser;
};

const createUrls = (url: string, subsites: string[]) => {
  return [...new Set(['/', ...subsites])].map((sub) => new URL(sub, url));
};

const run = async ({ job, db, browser }: RunConfig): Promise<void> => {
  const { url, subsites } = job;
  const { jobModel, fileBucket } = db;
  const folderName = `.data/${job._id}`;

  try {
    const urls = createUrls(url, subsites);
    const promises: Promise<void>[] = [];
    const percentageEach = 99 / urls.length;

    // Test for basic errors, eg. ERR_CERT_AUTHORITY_INVALID
    const rootPage = await browser.newPage();
    await rootPage.goto(job.url);
    await rootPage.close();

    await fs.mkdir(folderName, { recursive: true });

    urls.forEach(async (url) => {
      const promise = processUrl({
        url,
        job,
        jobModel,
        pagePromise: browser.newPage(),
        folderName,
        percentage: percentageEach,
      });

      promises.push(promise);
    });
    await Promise.all(promises);

    const bucketId = await zipAndStore({
      fileBucket,
      folderName,
      jobId: job._id,
      fileName: 'result.zip',
    });

    await fs.rm(folderName, { recursive: true, force: true });

    await jobModel.updateOne({ _id: job._id }, { $set: { progress: 100, status: true, zipFileId: bucketId } });
  } catch (err) {
    console.log(err);
    await jobModel.updateOne({ _id: job._id }, { $set: { progress: 100, status: false, errorMessage: err.toString() } });
  }
};

export default run;
