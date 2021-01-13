/* eslint-disable no-template-curly-in-string */
const yup = require('yup');
const isUUID = require('validator/lib/isUUID');

const postBatchSchema = yup
  .object()
  .shape({
    id: yup.string().test({
      name: 'id',
      message: '${path} deve ser um uuid',
      test: (value) => (value ? isUUID(value) : true),
    }),
    status: yup.string().trim(),
    mensagem: yup.string().trim(),
  })
  .noUnknown();

module.exports = postBatchSchema;
