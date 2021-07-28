module.exports = (sequelize, Sequelize) => {
  const readyAboutRaceMetadata = sequelize.define(
    'ReadyAboutRaceMetadata',
    {
        id: {
            type: Sequelize.UUID,
            allowNull: false,
            primaryKey: true,
        },
        name: {
            type: Sequelize.TEXT,
            allowNull: false,
        },
        event: {
            type: Sequelize.UUID,
            allowNull: true,
        },
        source: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        url: {
            type: Sequelize.TEXT,
            allowNull: false,
        },
        start_country: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        start_year: {
            type: Sequelize.BIGINT,
            allowNull: false,
        },
        start_month: {
            type: Sequelize.BIGINT,
            allowNull: false,
        },
        start_day: {
            type: Sequelize.BIGINT,
            allowNull: false,
        },
        approx_start_time_ms: {
            type: Sequelize.BIGINT,
            allowNull: false,
        },
        approx_end_time_ms: {
            type: Sequelize.BIGINT,
            allowNull: false,
        },
        approx_duration_ms: {
            type: Sequelize.BIGINT,
            allowNull: false,
        },
        approx_start_point: {
            type: Sequelize.GEOMETRY('POINT', 4326),
            allowNull: false,
        },
        approx_start_lat: {
            type: Sequelize.DOUBLE,
            allowNull: false,
        },
        approx_start_lon: {
            type: Sequelize.DOUBLE,
            allowNull: false,
        },
        approx_end_point: {
            type: Sequelize.GEOMETRY('POINT', 4326),
            allowNull: false,
        },
        approx_end_lat: {
            type: Sequelize.DOUBLE,
            allowNull: false,
        },
        approx_end_lon: {
            type: Sequelize.DOUBLE,
            allowNull: false,
        },
        approx_mid_point: {
            type: Sequelize.GEOMETRY('POINT', 4326),
            allowNull: false,
        },
        bounding_box: {
            type: Sequelize.GEOMETRY('POLYGON', 4326),
            allowNull: true,
        },
        approx_area_sq_km: {
            type: Sequelize.DOUBLE,
            allowNull: false,
        },
        approx_distance_km: {
            type: Sequelize.DOUBLE,
            allowNull: false,
        },
        num_boats: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        avg_time_between_positions: {
            type: Sequelize.DOUBLE,
            allowNull: false,
        },
        boat_models: {
            type: Sequelize.TEXT,
            allowNull: false,
            get() {
              return this.getDataValue('boat_models').split(';')
            },
            set(val) {
              this.setDataValue('boat_models', val.join(';'));
            },
        },
        handicap_rules: {
            type: Sequelize.TEXT,
            allowNull: false,
            get() {
              return this.getDataValue('handicap_rules').split(';')
            },
            set(val) {
              this.setDataValue('handicap_rules', val.join(';'));
            },
        },
        great_circle: {
            type: Sequelize.GEOMETRY,
            allowNull: true,
        },
    },
    {
        timestamps: false,
        tableName: 'ReadyAboutRaceMetadatas',
        indexes: [
            {
                fields: ['source'],
            },
        ],
        charset: 'utf8',
        collate: 'utf8_unicode_ci' // For storing accented char in name
    },
  );
  return readyAboutRaceMetadata;
};
