module.exports = (tableName, primaryKey = 'id', defaultValues = () => ({})) => ({
  create: async (connection, value) => {
    const data = { ...(await defaultValues(value)), ...value };
    await connection(tableName).insert(data);
    const [row] = await connection(tableName).where({ [primaryKey]: data[primaryKey] }).select('*');
    return row;
  },
  data: async (value = {}) => ({ ...(await defaultValues(value)), ...value }),
});
