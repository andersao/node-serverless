const moment = require('moment');
const Service = require('./service');
const { articles, articleBatches } = require('../schemas');
const AWS = require('aws-sdk');
const sqs = new AWS.SQS({
  region: 'us-east-1'
});
const s3 = new AWS.S3();
const uuid = require('uuid').v4;
const { BATCH_BUCKET, BATCH_QUEUE_URL } = process.env;

module.exports = class ArticlesService extends Service {
  constructor(serviceManager) {
    super(serviceManager, {
      schema: articles,
      primaryKey: 'id',
      tableName: 'articles',
    });
  }

  async uploadBatch(id, data) {
    const objectKey = `${moment().format('YYYY/DD/MM')}/${id}.json`;
    await s3
      .putObject({
        Bucket: BATCH_BUCKET,
        Key: objectKey,
        Body: JSON.stringify(data),
        ContentType: `application/json`,
      })
      .promise();
    return objectKey;
  }

  async validateBatch(data) {
    return Promise.all(data.map(async (entity, index) => {
      try {
        await this.validateSchemaCreate(entity);
      } catch (e) {
        throw {
          name: 'UnprocessableEntityError',
          message: 'Erro na validação do batch',
          reasons: `Entidade no indice ${index}: ${e.reasons.join('\n')}`
        };
      }
    }));
  }

  async queueBatch(data) {
    if (!await this.validateBatch(data))
      return;

    const batchId = uuid();
    const payload = {
      id: batchId,
      path: await this.uploadBatch(batchId, data)
    };

    await sqs
      .sendMessage({
        QueueUrl: BATCH_QUEUE_URL,
        MessageBody: JSON.stringify(payload),
      })
      .promise();

    const batch = {
      id: batchId,
      status: 'PENDING'
    };
    await this.queryBuilder('articles_batches')
      .insert(batch);

    return batch;
  }

  async getBatch(id) {
    const entity = await this.queryBuilder('articles_batches').where({ id }).first();
    if (!entity) throw {
      name: 'NotFoundError',
      message: 'lote não encontrado'
    };
    return {
      id: entity.id,
      status: entity.status,
      ...(entity.mensagem ? { mensagem: entity.mensagem } : {})
    };
  }

  async saveBatch(id, data) {
    try {
      return await this.connection.transaction(async transaction => {
        const articles = this.queryBuilder('articles').transacting(transaction);
        const articlesBatches = this.queryBuilder('articles_batches').transacting(transaction);
        await transaction.raw(
          '? ON DUPLICATE KEY UPDATE title=values(title), content=values(content) ',
          [articles.insert({id: uuid(), ...data})]
        );
        await articlesBatches.where({ id }).update({
          status: 'FINISHED'
        });
      })
    } catch (e) {
      await this.queryBuilder('articles_batches').where({ id }).update({
        status: 'FAILED',
        mensagem: e.message
      });
    }
  }
};
