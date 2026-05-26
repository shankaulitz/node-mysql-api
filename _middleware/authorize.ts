import dotenv from 'dotenv';
dotenv.config();

import { expressjwt as jwt } from 'express-jwt';
import db from '../_helpers/db';

const secret = process.env.APP_SECRET as string;

export default authorize;

function authorize(roles: any = []) {

    if (typeof roles === 'string') {
        roles = [roles];
    }

    return [

        jwt({
            secret,
            algorithms: ['HS256']
        }),

        async (req: any, res: any, next: any) => {

            const account = await db.Account.findByPk(req.auth.id);

            if (!account || (roles.length && !roles.includes(account.role))) {
                return res.status(401).json({
                    message: 'Unauthorized'
                });
            }

            // attach role + helper methods to req.auth
            req.auth.role = account.role;

            const refreshTokens = await account.getRefreshTokens();

            req.auth.ownsToken = (token: any) =>
                !!refreshTokens.find((x: any) => x.token === token);

            next();

        }
    ];
}