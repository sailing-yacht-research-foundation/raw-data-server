module.exports = (sequelize, Sequelize) => {
  const metasailBoat = sequelize.define(
    'MetasailBoat',
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
      race_original_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      serial: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      sail_number: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      is_dummy: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
    },
    {
      tableName: 'MetasailBoats',
      timestamps: false,
    },
  );
  return metasailBoat;
};
