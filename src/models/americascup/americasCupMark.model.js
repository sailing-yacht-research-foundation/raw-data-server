module.exports = (sequelize, Sequelize) => {
  const americasCupMark = sequelize.define(
    'AmericasCupMark',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      original_id: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      race: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      race_original_id: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      compound_mark: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      compound_mark_original_id: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      seq_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lat: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      lon: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
    },
    {
      tableName: 'AmericasCupMarks',
      timestamps: false,
      indexes: [
        {
          name: 'race_index',
          unique: true,
          fields: ['original_id', 'compound_mark_original_id', 'race_original_id'],
        },
      ],
    },
  );
  return americasCupMark;
};
