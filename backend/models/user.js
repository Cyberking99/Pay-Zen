import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Define associations here
      User.hasMany(models.PaymentLink, {
        foreignKey: 'creator_id',
        as: 'paymentLinks'
      });
      
      User.hasMany(models.Transaction, {
        foreignKey: 'from_user_id',
        as: 'sentTransactions'
      });
      
      User.hasMany(models.Transaction, {
        foreignKey: 'to_user_id',
        as: 'receivedTransactions'
      });
    }
  }
  
  User.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    privy_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    wallet_address: {
      type: DataTypes.STRING(42),
      allowNull: false,
      unique: true
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true
    },
    full_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  
  return User;
}; 