module.exports = (sequelize, Sequelize) => {
  const tractracControlPoint = sequelize.define(
    'TracTracControlPoint',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      race: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      race_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      route: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      route_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      control: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      control_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
    },
    {
      tableName: 'TracTracControlPoints',
      timestamps: false,
    },
  );
  return tractracControlPoint;
};
