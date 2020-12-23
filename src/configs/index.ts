import mongoConfig from './mongoConfig';
import browserConfig from './browserConfig';

const devEnvironment = process.env.NODE_ENV === 'development';

export { devEnvironment };
export { mongoConfig, browserConfig };
