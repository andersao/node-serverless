/* eslint-disable no-template-curly-in-string */
const yup = require('yup');
const isUUID = require('validator/lib/isUUID');

const postSchema = yup
  .object()
  .shape({
    id: yup.string().test({
      name: 'id',
      message: '${path} deve ser um uuid',
      test: (value) => (value ? isUUID(value) : true),
    }),
    titulo: yup.string().required().trim().trim(),
    conteudo: yup.string().default('').trim(),
    autor: yup.string().default('').trim(),
  })
  .noUnknown();

module.exports = postSchema;
