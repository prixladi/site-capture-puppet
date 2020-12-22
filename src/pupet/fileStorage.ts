import AdmZip from 'adm-zip';
import { MongoGridFS } from 'mongo-gridfs';
import { ObjectID } from 'mongodb';

type StorageConfig = {
  fileBucket: MongoGridFS;
  folderName: string;
  jobId: ObjectID;
  fileName: string;
};

const zipAndStore = async ({ fileBucket, folderName, jobId, fileName }: StorageConfig): Promise<ObjectID> => {
  const zip = new AdmZip();
  zip.addLocalFolder(folderName);
  zip.writeZip(`./${jobId}.zip`);
  const result = await fileBucket.uploadFile(`./${jobId}.zip`, { filename: fileName }, true);

  return result._id;
};

export default zipAndStore;
