'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('payment_links', 'amount', {
      type: Sequelize.DECIMAL(18, 6),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('payment_links', 'amount', {
      type: Sequelize.DECIMAL(18, 6),
      allowNull: false,
    });
  }
};