module.exports = (sequelize, Sequelize) => {
  const iSailRace = sequelize.define(
    'iSailRace',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      event: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      original_event_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      start: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      stop: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      wind_direction: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      url: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      track_ids: {
          type: Sequelize.TEXT,
          allowNull: false,
          get() {
            return this.getDataValue('track_ids').split(';')
          },
          set(val) {
            this.setDataValue('track_ids', val.join(';'));
          },
      },
    },
    {
      tableName: 'iSailRaces',
      timestamps: false,
    },
  );

  return iSailRace;
};
