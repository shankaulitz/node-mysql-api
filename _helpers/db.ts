import dotenv from 'dotenv';
dotenv.config();

import mysql from 'mysql2/promise';
import { Sequelize } from 'sequelize';

import accountModel from '../accounts/account.model';
import refreshTokenModel from '../accounts/refresh-token.model';

const db: any = {};
export default db;

initialize();

async function initialize() {

    const host = process.env.DB_HOST!;
    const port = Number(process.env.DB_PORT);
    const user = process.env.DB_USER!;
    const password = process.env.DB_PASSWORD!;
    const database = process.env.DB_NAME!;

    try {

        const connection = await mysql.createConnection({
            host,
            port,
            user,
            password
        });

        await connection.query(
            `CREATE DATABASE IF NOT EXISTS \`${database}\`;`
        );

        const sequelize = new Sequelize(database, user, password, {
            host,
            port,
            dialect: 'mysql'
        });

        db.Account = accountModel(sequelize);
        db.RefreshToken = refreshTokenModel(sequelize);

        db.Account.hasMany(db.RefreshToken, { onDelete: 'CASCADE' });
        db.RefreshToken.belongsTo(db.Account);

        await sequelize.sync({ alter: true });

        console.log('Database synchronized and connected successfully.');

    } catch (error) {

        console.error('Failed to initialize database:', error);

    }
}