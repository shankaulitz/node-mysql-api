import { DataTypes, Model } from 'sequelize';

interface AccountAttributes {
    email: string;
    passwordHash: string;
    title: string;
    firstName: string;
    lastName: string;
    acceptTerms?: boolean;
    role: string;
    verificationToken?: string;
    verified?: Date;
    resetToken?: string;
    resetTokenExpires?: Date;
    passwordReset?: Date;
    created: Date;
    updated?: Date;
    isVerified?: boolean;
}

export default function model(sequelize: any) {
    const attributes = {
        email: { type: DataTypes.STRING, allowNull: false },
        passwordHash: { type: DataTypes.STRING, allowNull: false },
        title: { type: DataTypes.STRING, allowNull: false },
        firstName: { type: DataTypes.STRING, allowNull: false },
        lastName: { type: DataTypes.STRING, allowNull: false },
        acceptTerms: { type: DataTypes.BOOLEAN },
        role: { type: DataTypes.STRING, allowNull: false },
        verificationToken: { type: DataTypes.STRING },
        verified: { type: DataTypes.DATE },
        resetToken: { type: DataTypes.STRING },
        resetTokenExpires: { type: DataTypes.DATE },
        passwordReset: { type: DataTypes.DATE },
        created: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updated: { type: DataTypes.DATE },
        isVerified: {
            type: DataTypes.VIRTUAL,
            get(this: AccountAttributes): boolean {
                return !!(this.verified || this.passwordReset);
            }
        }
    };

    const options = {
        timestamps: false,
        defaultScope: { attributes: { exclude: ['passwordHash'] } },
        scopes: { withHash: { attributes: {} } }
    };

    return sequelize.define('account', attributes, options);
}