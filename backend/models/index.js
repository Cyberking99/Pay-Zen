import fs from 'fs';
import path from 'path';
import { Sequelize } from 'sequelize';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';

// Import config based on environment
let config;
if (env === 'development') {
  config = {
    username: 'root',
    password: '',
    database: 'stable',
    host: '127.0.0.1',
    port: 3306,
    dialect: 'mysql'
  };
} else if (env === 'test') {
  config = {
    username: 'root',
    password: '',
    database: 'stable_test',
    host: '127.0.0.1',
    port: 3306,
    dialect: 'mysql'
  };
} else {
  config = {
    username: 'root',
    password: '',
    database: 'stable',
    host: '127.0.0.1',
    port: 3306,
    dialect: 'mysql'
  };
}

const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

// Read model files
const modelFiles = fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  });

// Import models
for (const file of modelFiles) {
  const modelModule = await import(path.join(__dirname, file));
  const model = modelModule.default(sequelize);
  db[model.name] = model;
}

// Set up associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;
