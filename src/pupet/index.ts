import { Browser, Page } from 'puppeteer';
import { JobDoc, ProgressItem } from '../db/job';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs/promises';
import AdmZip from 'adm-zip';
import { DB } from '../db';

type RunConfig = {
  job: JobDoc;
  db: DB;
  browser: Browser;
};

const folderName = '.data';

const tryProcessUrl = async (url: URL, { viewports, quality }: JobDoc, fullPath: string, page: Page): Promise<ProgressItem> => {
  try {
    await page.goto(url.href);

    for (const viewport of viewports) {
      await page.setViewport(viewport);

      const ext = quality >= 100 ? 'png' : 'jpeg';
      const imgName = `${viewport.height}x${viewport.width}.${ext}`;
      const imgPath = path.join('./', folderName, fullPath);
      fs.mkdir(imgPath, { recursive: true });

      await page.screenshot({
        path: path.join(imgPath, imgName),
        type: ext,
        quality: quality >= 100 ? undefined : Math.max(0, Math.min(quality, 100)),
      });
    }

    return { path: fullPath, status: true };
  } catch (err) {
    console.error(err);
    return { path: fullPath, status: false, errorMessage: err.toString() };
  }
};

const processUrl = async (url: URL, job: JobDoc, jobModel: mongoose.Model<JobDoc>, pagePromise: Promise<Page>, percentage: number) => {
  const page = await pagePromise;
  const fullPath = path.join(url.pathname, url.search, url.hash).replace('?', '$');
  const resultItem: ProgressItem = await tryProcessUrl(url, job, fullPath, page);

  await jobModel.updateOne({ _id: job._id }, { $inc: { progress: percentage }, $push: { items: resultItem } });
};

const createUrls = (url: string, subsites: string[]) => {
  return [...new Set(['/', ...subsites])].map((sub) => new URL(sub, url));
};

const run = async ({ job, db, browser }: RunConfig): Promise<void> => {
  const { url, subsites } = job;
  const { jobModel, fileBucket } = db;

  try {
    const urls = createUrls(url, subsites);

    const promises: Promise<void>[] = [];
    const percentageEach = 99 / urls.length;
    urls.forEach(async (url) => {
      const promise = processUrl(url, job, jobModel, browser.newPage(), percentageEach);
      promises.push(promise);
    });
    await Promise.all(promises);
    
    const zip = new AdmZip();

    zip.addLocalFolder(folderName);
    zip.writeZip(`${folderName}.zip`);

    const result = await fileBucket.uploadFile(`${folderName}.zip`, { filename: '`${folderName}.zip`' }, true);
    console.log(await fileBucket.downloadFile(result._id.toString(), { filename: './test.zip' }));

    await jobModel.updateOne({ _id: job._id }, { $set: { progress: 100, status: true, zipFileId: result._id } });
  } catch (err) {
    console.log(err);
    await jobModel.updateOne({ _id: job._id }, { $set: { progress: 100, status: false, errorMessage: err.toString() } });
  }
};

export default run;
