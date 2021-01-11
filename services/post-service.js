/* eslint-disable no-param-reassign */
const AWS = require('aws-sdk');
const uuid = require('uuid').v4;

const Service = require('./service');
const { post } = require('../schemas');
const { database: objectPrefix } = require('../knexfile').connection;

const s3 = new AWS.S3();
const BUCKET = 'workshop-aws-cm';
// const CDN_URL = 'https://d1b09rsatqfa42.cloudfront.net';

module.exports = class PostService extends (
  Service
) {
  constructor(serviceManager) {
    super(serviceManager, {
      schema: post,
      primaryKey: 'id',
      tableName: 'posts',
      searchable: ['titulo', 'conteudo', 'autor'],
      filterable: ['autor'],
    });
  }

  async prepareResultObject(data) {
    await super.prepareResultObject(data);

    if (data.avatarPath) {
      // data.avatarPath = `${CDN_URL}/${data.avatarPath}`;
      data.avatarPath = await this.getImagePreSignedUrl(data.avatarPath);
    }

    return data;
  }

  async create(data, options = {}) {
    const avatarPath = await this.uploadImage(data);
    const entity = await super.create({ ...data, avatarPath }, options);
    return entity;
  }

  async update(id, data, options = {}) {
    const avatarPath = await this.uploadImage(data);
    const entity = await super.update(id, { ...data, avatarPath }, options);
    return entity;
  }

  async getImagePreSignedUrl(objectKey) {
    if (!objectKey) return null;
    const url = await s3.getSignedUrlPromise('getObject', { Bucket: BUCKET, Key: objectKey });
    return url;
  }

  async uploadImage(data, entity) {
    if (data && data.avatar) {
      const { data: fileData, extension } = data.avatar;
      const buffer = Buffer.from(fileData, 'base64');
      const objectKey = `${objectPrefix}/${uuid()}.${extension}`;

      await s3
        .putObject({
          Bucket: BUCKET,
          Key: objectKey,
          Body: buffer,
          ContentType: `image/${extension}`,
        })
        .promise();

      // eslint-disable-next-line no-param-reassign
      delete data.avatar;

      return `${objectKey}`;
    }

    return entity ? entity.avatarPath || null : null;
  }
};
