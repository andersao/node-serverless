/* eslint-disable no-param-reassign */
const {
  src, dest, series, parallel,
} = require('gulp');
const clean = require('gulp-clean');
const install = require('gulp-install');
const shell = require('gulp-shell');
const fs = require('fs');

async function setTestEnv(cb) {
  process.env.NODE_ENV = 'test';
  cb();
}

async function runTest() {
  return shell.task('npm test');
}

async function reset() {
  return src('dist/*').pipe(clean());
}

function prepareDist() {
  return src(['**/*', '!spec/**/*', '!config/*.json', '!*.sql', '!cf-*.yaml']).pipe(
    dest('dist/tmp'),
  );
}

function prepareModules() {
  return src('./package.json')
    .pipe(dest('dist/tmp'))
    .pipe(install({ production: true }));
}

function replaceEnvVars(content) {
  content = content.replace(/\$\{APP_NAME\}/g, process.env.APP_NAME || 'Sample');
  content = content.replace(/\$\{API_PREFIX\}/g, process.env.API_PREFIX);
  content = content.replace(/\$\{APP_DEBUG\}/g, process.env.APP_DEBUG);
  content = content.replace(/\$\{APP_SECRET\}/g, process.env.APP_SECRET);
  content = content.replace(/\$\{APP_DATABASE_HOST\}/g, process.env.APP_DATABASE_HOST);
  content = content.replace(/\$\{APP_DATABASE_USER\}/g, process.env.APP_DATABASE_USER);
  content = content.replace(/\$\{APP_DATABASE_PASSWORD\}/g, process.env.APP_DATABASE_PASSWORD);
  content = content.replace(/\$\{APP_DATABASE_NAME\}/g, process.env.APP_DATABASE_NAME);
  content = content.replace(/\$\{BATCH_BUCKET\}/g, process.env.BATCH_BUCKET);
  content = content.replace(/\$\{BATCH_QUEUE_URL\}/g, process.env.BATCH_QUEUE_URL);

  let VPC_SUBNET_IDS = null;
  let VPC_SECURITY_GROUP_IDS = null;

  if (process.env.VPC_SUBNET_IDS) {
    const SubnetIds = process.env.VPC_SUBNET_IDS.split(';')
      .map((id) => `- ${id}`)
      .join('\n          ');

    content = content.replace(/\$\{VPC_SUBNET_IDS\}/g, SubnetIds);
    VPC_SUBNET_IDS = SubnetIds;
  }

  if (process.env.VPC_SECURITY_GROUP_IDS) {
    const SecurityGroupIds = process.env.VPC_SECURITY_GROUP_IDS.split(';')
      .map((id) => `- ${id}`)
      .join('\n          ');

    content = content.replace(/\$\{VPC_SECURITY_GROUP_IDS\}/g, SecurityGroupIds);
    VPC_SECURITY_GROUP_IDS = SecurityGroupIds;
  }

  if (VPC_SUBNET_IDS || VPC_SECURITY_GROUP_IDS) {
    content = content.replace(/\$\{VPC_CONFIG\}/g, `
      VpcConfig:
        SecurityGroupIds:
          ${VPC_SECURITY_GROUP_IDS}
        SubnetIds:
          ${VPC_SUBNET_IDS}
    `);
  } else {
    content = content.replace(/\$\{VPC_CONFIG\}/g, '');
  }

  return content;
}

function prepareCloudFormationPackage(srcFile, destFile, packagedFile) {
  const content = replaceEnvVars(fs.readFileSync(srcFile).toString());
  fs.writeFileSync(`dist/tmp/${destFile}`, content);
  return src('dist/tmp').pipe(
    shell(
      `aws cloudformation package --template-file dist/tmp/${destFile} --output-template-file dist/tmp/${packagedFile} --s3-bucket ${process.env.DEPLOYMENT_BUCKET || 'node-deploy'}`,
    ),
  );
}

function prepareCloudFormationService() {
  return prepareCloudFormationPackage('cf-template.yaml', 'template.yaml', 'packaged.yaml');
}

exports.prepareCloudFormation = series(
  series(reset, setTestEnv),
  series(prepareDist, prepareModules),
  parallel(prepareCloudFormationService),
);
