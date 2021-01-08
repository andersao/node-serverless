/* eslint-disable no-template-curly-in-string */
const yup = require('yup');
const isUUID = require('validator/lib/isUUID');

const articleSchema = yup
  .object()
  .shape({
    id: yup.string().test({
      name: 'id',
      message: '${path} deve ser um uuid',
      test: (value) => (value ? isUUID(value) : true),
    }),
    title: yup.string().required().trim().trim(),
    content: yup.string().default('').trim(),
  })
  .noUnknown();

module.exports = articleSchema;
