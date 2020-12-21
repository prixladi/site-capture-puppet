import mongoose from 'mongoose';
import { ObjectID } from 'mongodb';

type Viewport = {
  width: number;
  height: number;
};

type ProgressItem = {
  path: string;
  status: boolean;
  errorMessage?: string;
};

type JobDoc = mongoose.Document & {
  _id: ObjectID;
  userId?: ObjectID;
  url: string;
  subsites: string[];
  viewports: Viewport[];
  quality: number;
  progress?: number;
  errorMessage?: string;
  status: boolean;
  zipFileId?: ObjectID;
  items?: ProgressItem[];
};

const collectionName = 'jobs';

const jobSchema = new mongoose.Schema(
  {
    _id: mongoose.Types.ObjectId,
    userId: { type: mongoose.Types.ObjectId, required: false },
    url: String,
    subsites: [String],
    viewports: [
      {
        width: Number,
        height: Number,
      },
    ],
    quality: Number,
    progress: { type: Number, required: false },
    status: Boolean,
    zipFileId: mongoose.Types.ObjectId,
    items: {
      type: [
        {
          path: String,
          status: Boolean,
          message: { type: String, required: false },
        },
      ],
      required: false,
    },
  },
  { collection: collectionName, versionKey: false, timestamps: true },
);

export default mongoose.model<JobDoc>(collectionName, jobSchema, collectionName);
export { Viewport, JobDoc, ProgressItem };
