const { DataTypes } = require('sequelize');
const ModelBase = require('../ModelBase');

class Geometry extends ModelBase {
  static initGeometry(attr, options) {
    this.init(
      {
        ...attr,
        geometryType: {
          type: DataTypes.STRING,
        },
        order: {
          type: DataTypes.INTEGER,
        },
        coordinates: {
          type: DataTypes.JSON,
        },
        properties: {
          type: DataTypes.JSON,
        },
      },
      options,
    );
  }
}

module.exports = Geometry;
