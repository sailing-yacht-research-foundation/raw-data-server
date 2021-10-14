exports.setCreateMeta = (data = {}) => {
  const now = Date.now();
  data.createdAt = now;
  return data;
};

exports.setUpdateMeta = (data = {}, user) => {
  const now = Date.now();
  data.updatedAt = now;
  return data;
};
