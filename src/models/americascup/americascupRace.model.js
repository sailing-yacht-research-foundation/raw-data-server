module.exports = (sequelize, Sequelize) => {
  const americasCupRace = sequelize.define(
    'AmericasCupRace',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      original_id: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      type: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      start_time: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      postpone: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      creation_time_date: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      regatta: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      regatta_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      participants: {
        type: Sequelize.TEXT,
        allowNull: false,
        get() {
          return this.getDataValue('participants').split(';')
        },
        set(val) {
          this.setDataValue('participants', val.join(';'));
        },
      },
    },
    {
      tableName: 'AmericasCupRaces',
      timestamps: false,
    },
  );
  return americasCupRace;
};
