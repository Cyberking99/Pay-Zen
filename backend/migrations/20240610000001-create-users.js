'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      privy_id: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      wallet_address: {
        type: Sequelize.STRING(42),
        allowNull: false,
        unique: true
      },
      username: {
        type: Sequelize.STRING(50),
        allowNull: true,
        unique: true
      },
      full_name: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      age: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      }
    });

    // Create indexes
    await queryInterface.addIndex('users', ['wallet_address'], {
      name: 'idx_users_wallet_address'
    });
    await queryInterface.addIndex('users', ['username'], {
      name: 'idx_users_username'
    });
    await queryInterface.addIndex('users', ['privy_id'], {
      name: 'idx_users_privy_id'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
  }
}; 