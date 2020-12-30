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
  progress: number;
  item?: ProgressItem;
};

const connect = (): RedisClient => {
  return new Redis({
    port: redisConfig.port,
    host: redisConfig.host,
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
  const publish = promisify<string, string>(redisClient.publish).bind(redisClient);
  await publish('progress', JSON.stringify(progress));
};

export { connect, disconnect, sendProgressUpdate };
