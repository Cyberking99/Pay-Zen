'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('payment_links', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      creator_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      link_id: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      amount: {
        type: Sequelize.DECIMAL(18, 6),
        allowNull: false
      },
      expiration_type: {
        type: Sequelize.ENUM('one-time', 'time-based', 'public'),
        allowNull: false
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      custom_fields: {
        type: Sequelize.JSON,
        defaultValue: '[]',
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      usage_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      max_uses: {
        type: Sequelize.INTEGER,
        allowNull: true
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
    await queryInterface.addIndex('payment_links', ['creator_id'], {
      name: 'idx_payment_links_creator_id'
    });
    await queryInterface.addIndex('payment_links', ['link_id'], {
      name: 'idx_payment_links_link_id'
    });
    await queryInterface.addIndex('payment_links', ['is_active'], {
      name: 'idx_payment_links_active'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('payment_links');
  }
}; 