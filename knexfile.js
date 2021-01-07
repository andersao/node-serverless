const codeBuildId = process.env.CODEBUILD_BUILD_ID
  ? process.env.CODEBUILD_BUILD_ID.replace(':', '-')
  : undefined;

const env = process.env.NODE_ENV ? process.env.NODE_ENV.toLowerCase() : 'development';
const database = codeBuildId || process.env.APP_DATABASE_NAME || `sample${env === 'production' ? '' : `_${env}`}`;

module.exports = {
  client: 'mysql',
  connection: {
    host: process.env.APP_DATABASE_HOST || 'localhost',
    user: process.env.APP_DATABASE_USER || 'root',
    password: process.env.APP_DATABASE_PASSWORD || '',
    database,
  },
  pool: {
    min: 0, max: 10,
  },
  migrations: {
    tableName: 'migrations',
    directory: './migrations',
  },
  seeds: {
    directory: './seeds',
  },
};
