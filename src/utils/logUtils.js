exports.logFunctionTime = function (name, startTime) {
  const endTime = new Date();
  const totalTime = (endTime.getTime() - startTime.getTime()) / 1000;
  console.log(`Function: ${name} takes ${totalTime} seconds`);
};
