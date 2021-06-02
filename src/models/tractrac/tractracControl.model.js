module.exports = (sequelize, Sequelize) => {
  const tractracControl = sequelize.define(
    'TracTracControl',
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
    },
    {
      tableName: 'TracTracControls',
      timestamps: false,
    },
  );
  return tractracControl;
};
