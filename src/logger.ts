import Stopwatch from './stopwatch';

const logJobStart = (jobId: string) => {
  console.log(`Found job to process, id: '${jobId}'.`);
};

const logJobFinish = (jobId: string, stopwatch: Stopwatch) => {
console.log(`   -- Job with id '${jobId}' proccessed in ${stopwatch.elapsed}ms.`);
};

const logOperation = (operationName: string, stopwatch: Stopwatch) => {
  console.log(`   -- ${operationName} - elapsed ${stopwatch.elapsed}ms`);
};

const logError = (err: unknown) => {
  console.error(err);
};

export { logJobStart, logJobFinish, logOperation, logError };
