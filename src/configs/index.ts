import mongoConfig from './mongoConfig';

const devEnvironment = process.env.NODE_ENV === 'development';

export { devEnvironment };
export { mongoConfig };
