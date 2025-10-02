'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('transactions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      tx_hash: {
        type: Sequelize.STRING(66),
        allowNull: false,
        unique: true
      },
      from_user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      to_user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      from_address: {
        type: Sequelize.STRING(42),
        allowNull: false
      },
      to_address: {
        type: Sequelize.STRING(42),
        allowNull: false
      },
      amount: {
        type: Sequelize.DECIMAL(18, 6),
        allowNull: false
      },
      memo: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      payment_link_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'payment_links',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      status: {
        type: Sequelize.ENUM('pending', 'confirmed', 'failed'),
        defaultValue: 'pending',
        allowNull: false
      },
      block_number: {
        type: Sequelize.BIGINT,
        allowNull: true
      },
      gas_used: {
        type: Sequelize.BIGINT,
        allowNull: true
      },
      gas_price: {
        type: Sequelize.BIGINT,
        allowNull: true
      },
      network: {
        type: Sequelize.STRING(20),
        defaultValue: 'ethereum',
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
    await queryInterface.addIndex('transactions', ['from_user_id'], {
      name: 'idx_transactions_from_user_id'
    });
    await queryInterface.addIndex('transactions', ['to_user_id'], {
      name: 'idx_transactions_to_user_id'
    });
    await queryInterface.addIndex('transactions', ['tx_hash'], {
      name: 'idx_transactions_tx_hash'
    });
    await queryInterface.addIndex('transactions', ['status'], {
      name: 'idx_transactions_status'
    });
    await queryInterface.addIndex('transactions', ['created_at'], {
      name: 'idx_transactions_created_at'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('transactions');
  }
}; 