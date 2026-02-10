import { Sequelize } from 'sequelize';
import { config } from './index';
import logger from '../utils/logger';

export const sequelize = new Sequelize({
  database: config.database.name,
  username: config.database.user,
  password: config.database.password,
  host: config.database.host,
  port: config.database.port,
  dialect: 'mysql',
  logging: (msg) => logger.debug(msg),
  pool: {
    max: config.database.poolMax,
    min: config.database.poolMin,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

export const connectDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully');
  } catch (error: any) {
    logger.error('Unable to connect to the database:', error);
    throw error;
  }
};

export const closeDatabase = async (): Promise<void> => {
  try {
    await sequelize.close();
    logger.info('Database connection closed');
  } catch (error: any) {
    logger.error('Error closing database connection:', error);
  }
};
