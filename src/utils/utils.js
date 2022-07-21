exports.getHullsCount = (type) => {
  let hullsCount;
  switch (type) {
    case 'monohull':
      hullsCount = 1;
      break;
    case 'catamaran':
    case 'm32':
      hullsCount = 2;
      break;
    case 'trimaran':
      hullsCount = 3;
      break;
    default:
      hullsCount = null;
  }
  return hullsCount;
};
