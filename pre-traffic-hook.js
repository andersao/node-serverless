/* eslint-disable no-console */
const AWS = require('aws-sdk');
const knex = require('knex');
const knexfile = require('./knexfile');

const db = knex(knexfile);

const codedeploy = new AWS.CodeDeploy({ apiVersion: '2014-10-06' });

async function syncDb() {
  await db.migrate.latest();
  console.log('migrações realizadas');
  db.transaction(async (trx) => {
    const status = await trx.migrate.status();
    if (status === 0) return true;
    throw 'Migrações não realizadas';
  });
}

async function setDeployStatus(deploymentId, executionId, succeeded = true) {
  const status = succeeded ? 'Succeeded' : 'Failed';

  console.log('atualizando status do deploy...');
  console.log('status:', status);

  return codedeploy
    .putLifecycleEventHookExecutionStatus({
      deploymentId,
      lifecycleEventHookExecutionId: executionId,
      status,
    })
    .promise();
}

exports.handler = async (event) => {
  console.log('event: %j', event);

  try {
    await syncDb();
    await setDeployStatus(event.DeploymentId, event.LifecycleEventHookExecutionId);
    return 'status do deploy atualizado';
  } catch (error) {
    console.error('error: %j', error);
    await setDeployStatus(event.DeploymentId, event.LifecycleEventHookExecutionId, false);
    return 'status do deploy atualizado';
  }
};
