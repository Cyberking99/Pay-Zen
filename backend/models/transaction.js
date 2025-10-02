import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class Transaction extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Define associations here
      Transaction.belongsTo(models.User, {
        foreignKey: 'from_user_id',
        as: 'fromUser'
      });
      
      Transaction.belongsTo(models.User, {
        foreignKey: 'to_user_id',
        as: 'toUser'
      });
      
      Transaction.belongsTo(models.PaymentLink, {
        foreignKey: 'payment_link_id',
        as: 'paymentLink'
      });
    }
  }
  
  Transaction.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    tx_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    from_user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    to_user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    from_address: {
      type: DataTypes.STRING(42),
      allowNull: false
    },
    to_address: {
      type: DataTypes.STRING(42),
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(18, 6),
      allowNull: false
    },
    memo: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    payment_link_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'payment_links',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'failed'),
      defaultValue: 'pending',
      allowNull: false
    },
    block_number: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    gas_used: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    gas_price: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    network: {
      type: DataTypes.STRING(20),
      defaultValue: 'base-sepolia',
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Transaction',
    tableName: 'transactions',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  
  return Transaction;
}; 