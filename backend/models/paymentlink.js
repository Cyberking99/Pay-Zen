import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class PaymentLink extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Define associations here
      PaymentLink.belongsTo(models.User, {
        foreignKey: 'creator_id',
        as: 'creator'
      });
      
      PaymentLink.hasMany(models.Transaction, {
        foreignKey: 'payment_link_id',
        as: 'transactions'
      });
    }
  }
  
  PaymentLink.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    creator_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    link_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    amount: {
      type: DataTypes.DECIMAL(18, 6),
      allowNull: true
    },
    expiration_type: {
      type: DataTypes.ENUM('one-time', 'time-based', 'public'),
      allowNull: false
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    custom_fields: {
      type: DataTypes.JSON,
      defaultValue: '[]',
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    usage_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    max_uses: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'PaymentLink',
    tableName: 'payment_links',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  
  return PaymentLink;
}; 