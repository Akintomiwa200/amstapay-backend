exports.leanPaginate = async (Model, filter = {}, options = {}) => {
  const {
    page = 1, limit = 20, sort = { createdAt: -1 },
    select = null, populate = null, maxLimit = 100,
  } = options;

  const safeLimit = Math.min(parseInt(limit), maxLimit);
  const skip = (parseInt(page) - 1) * safeLimit;

  let query = Model.find(filter).lean().sort(sort).skip(skip).limit(safeLimit);
  if (select) query = query.select(select);
  if (populate) query = query.populate(populate);

  const [data, total] = await Promise.all([
    query,
    Model.countDocuments(filter).lean(),
  ]);

  return {
    data,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / safeLimit),
    hasMore: parseInt(page) * safeLimit < total,
  };
};

exports.findOneOr404 = async (Model, filter, options = {}) => {
  const { select = null, populate = null, errorMsg = "Resource not found" } = options;
  let query = Model.findOne(filter).lean();
  if (select) query = query.select(select);
  if (populate) query = query.populate(populate);
  const doc = await query;
  if (!doc) {
    const err = new Error(errorMsg);
    err.status = 404;
    throw err;
  }
  return doc;
};

exports.safeBatch = async (items, handler, concurrency = 5) => {
  const results = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(batch.map(item => handler(item)));
    results.push(...batchResults.map(r => r.status === "fulfilled" ? r.value : null));
  }
  return results;
};
