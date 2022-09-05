const ogJob = require('./openGraph');

exports.registerWorkers = (opts) => {
  opts = { ...opts, defaultJobOptions: { removeOnComplete: true } };
  ogJob.setup(opts);
};
