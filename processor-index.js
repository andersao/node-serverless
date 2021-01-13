const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const ServiceManager = require('./services/service-manager');
const { createConnection } = require('./config/db');
const connection = createConnection();
const services = new ServiceManager(connection);
const { BATCH_BUCKET, APP_DEBUG } = process.env;

async function executeRecord(payload) {
    const { articlesService } = services;
    const { id, path } = JSON.parse(payload.body);

    const { Body } = await s3
        .getObject({
            Bucket: BATCH_BUCKET,
            Key: path,
        })
        .promise();

    const batchData = JSON.parse(Body.toString());

    try {
        console.log(`processando lote ${id}`);
        await articlesService.saveBatch(id, batchData);
        console.log(`lote ${id} processado com sucesso`);
        return true;
    } catch (e) {
        console.error(`erro no lote: ${id}`, e);
    }
}


async function processRecords(records) {
    if (!Array.isArray(records) || records.length === 0) return true;
    const [record] = records.splice(0, 1);

    try {
        await executeRecord(record);
    } catch (error) {
        console.log(error);
    } finally {
        return processRecords(records);
    }
}

const handler = async (event) => {
    if (APP_DEBUG === 'true') {
        console.log('event: %j', event);
    }
    if (!event || !event.Records) return;
    try {
        const filterSQS = (rec) => rec.eventSource === 'aws:sqs';
        const records = event.Records.filter(filterSQS);
        await processRecords(records);
    } catch (error) {
        console.log(error);
    } finally {
        return true;
    }
};

module.exports.handler = handler;
