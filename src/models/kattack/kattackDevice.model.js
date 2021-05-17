module.exports = (sequelize, Sequelize) => {
  const kattackDevice = sequelize.define(
    'kattackDevice',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      original_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      race: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      original_race_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      type: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lon: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lat: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      last_course_pt_lon: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      last_course_pt_lat: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      speed_kts: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      heading_deg: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      mode: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      is_logging: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      is_blocked: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      device_row_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      yacht_club: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      original_yacht_club_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      shared_device_row_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status_msg: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      device_internal_name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      epoch_offset_sec: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      elapsed_time_dhms: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      info_html: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      info_html_2: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      js_data_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'kattackDevices',
      timestamps: false,
    },
  );

  return kattackDevice;
};
