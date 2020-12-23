import { Db, GridFSBucket } from 'mongodb';

const createBucket = (db: Db, bucketName: string) => {
  return new GridFSBucket(db, { bucketName: bucketName });
};

export default createBucket;
