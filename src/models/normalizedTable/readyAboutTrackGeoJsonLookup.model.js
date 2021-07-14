module.exports = (sequelize, Sequelize) => {
  const readyAboutTrackGeoJsonLookup = sequelize.define(
    'ReadyAboutTrackGeoJsonLookup',
    {
        id: {
            type: Sequelize.UUID,
            allowNull: false,
            primaryKey: true,
        },
        source: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        s3_id: {
            type: Sequelize.UUID,
            allowNull: false,
        },
    },
    {
        timestamps: false,
        tableName: 'ReadyAboutTrackGeoJsonLookups',
        indexes: [
            {
                fields: ['source'],
            },
        ],
    }
  );
  return readyAboutTrackGeoJsonLookup;
};
