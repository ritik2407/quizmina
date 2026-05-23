'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('tokens', 'timeZone', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });
    await queryInterface.addColumn('tokens', 'gmt', {
      type: Sequelize.STRING(20),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('tokens', 'timeZone');
    await queryInterface.removeColumn('tokens', 'gmt');
  },
};
