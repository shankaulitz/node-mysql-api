import { DataTypes } from 'sequelize';

interface RefreshTokenAttributes {
    token?: string;
    expires?: Date;
    created: Date;
    createdByIp?: string;
    revoked?: Date;
    revokedByIp?: string;
    replacedByToken?: string;
    isExpired?: boolean;
    isActive?: boolean;
}

export default function model(sequelize: any) {
    const attributes = {
        token: { type: DataTypes.STRING },
        expires: { type: DataTypes.DATE },
        created: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        createdByIp: { type: DataTypes.STRING },
        revoked: { type: DataTypes.DATE },
        revokedByIp: { type: DataTypes.STRING },
        replacedByToken: { type: DataTypes.STRING },
        isExpired: {
            type: DataTypes.VIRTUAL,
            get(this: RefreshTokenAttributes): boolean {
                return Date.now() >= (this.expires?.getTime() ?? 0);
            }
        },
        isActive: {
            type: DataTypes.VIRTUAL,
            get(this: RefreshTokenAttributes): boolean {
                return !this.revoked && !this.isExpired;
            }
        }
    };

    const options = { timestamps: false };

    return sequelize.define('refreshToken', attributes, options);
}