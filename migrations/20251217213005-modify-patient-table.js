'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Rend le user_id optionnel et enlève l'unicité stricte pour permettre plusieurs patients sans compte
    await queryInterface.changeColumn('patients', 'user_id', {
      type: Sequelize.UUID,
      allowNull: true,
      unique: false,
      references: { model: 'users', key: 'user_id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('patients', 'user_id', {
      type: Sequelize.UUID,
      allowNull: false,
      unique: true,
      references: { model: 'users', key: 'user_id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
  }
};