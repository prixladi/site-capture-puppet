import Redis, { Redis as RedisClient } from 'ioredis';
import { redisConfig } from '../configs';
import { promisify } from 'util';

type ProgressItem = {
  url: string;
  status: boolean;
  errorMessage?: string;
};

type ProgressDto = {
  id: string;
  status: boolean;
  progress: number;
  errorMessage?: string;
  zipFileId?: string;
  item?: ProgressItem;
};

const connect = (): RedisClient => {
  return new Redis({
    port: redisConfig.port,
    host: redisConfig.host,
    lazyConnect: true,
    maxRetriesPerRequest: 4,
    retryStrategy: times => {
      return Math.min(times * 50, 2000);
    }
  });
};

const disconnect = (redisClient: RedisClient): void => {
  try {
    redisClient.disconnect();
  } catch (err) {
    console.error('Error while disconnection from redis:', err);
  }
};

const sendProgressUpdate = async (redisClient: RedisClient, progress: ProgressDto): Promise<void> => {
  try {
    const publish = promisify<string, string>(redisClient.publish).bind(redisClient);
    await publish('progress', JSON.stringify(progress));
  } catch (err) {
    console.error('Error while publishing to redis.', err);
  }
};

export { connect, disconnect, sendProgressUpdate };
