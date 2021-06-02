module.exports = (sequelize, Sequelize) => {
  const tractracRaceClass = sequelize.define(
    'TracTracRaceClass',
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
      boat_class: {
        type: Sequelize.UUID,
        allowNull: false,
      },
    },
    {
      tableName: 'TracTracRaceClasses',
      timestamps: false,
    },
  );
  return tractracRaceClass;
};
