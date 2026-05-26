import express from 'express';
const router = express.Router();

import Joi from 'joi';

import validateRequest from '../_middleware/validate-request';
import authorize from '../_middleware/authorize';
import Role from '../_helpers/role';
import accountService from './account.service';

// routes
router.post('/authenticate', authenticateSchema, authenticate);
router.post('/refresh-token', refreshToken);
router.post('/revoke-token', authorize(), revokeTokenSchema, revokeToken);
router.post('/register', registerSchema, register);
router.post('/verify-email', verifyEmailSchema, verifyEmail);
router.post('/forgot-password', forgotPasswordSchema, forgotPassword);
router.post('/validate-reset-token', validateResetTokenSchema, validateResetToken);
router.post('/reset-password', resetPasswordSchema, resetPassword);

router.get('/', getAll);
router.get('/:id', authorize(), getById);
router.post('/', authorize(Role.Admin), createSchema, create);
router.put('/:id', authorize(), updateSchema, update);
router.delete('/:id', authorize(), _delete);

export default router;

// 🔐 AUTHENTICATE
function authenticateSchema(req: any, res: any, next: any) {
    const schema = Joi.object({
        email: Joi.string().required(),
        password: Joi.string().required()
    });
    validateRequest(req, next, schema);
}

function authenticate(req: any, res: any, next: any) {
    const { email, password } = req.body;
    const ipAddress = req.ip;

    accountService.authenticate({ email, password, ipAddress })
        .then(({ refreshToken, ...account }: any) => {
            setTokenCookie(res, refreshToken);
            res.json(account);
        })
        .catch(next);
}

// 🔄 REFRESH TOKEN
function refreshToken(req: any, res: any, next: any) {
    const token = req.cookies.refreshToken;
    const ipAddress = req.ip;

    accountService.refreshToken({ token, ipAddress })
        .then(({ refreshToken, ...account }: any) => {
            setTokenCookie(res, refreshToken);
            res.json(account);
        })
        .catch(next);
}

// 🚫 REVOKE TOKEN
function revokeTokenSchema(req: any, res: any, next: any) {
    const schema = Joi.object({
        token: Joi.string().empty('')
    });
    validateRequest(req, next, schema);
}

function revokeToken(req: any, res: any, next: any) {
    const token = req.body.token || req.cookies.refreshToken;
    const ipAddress = req.ip;

    if (!token) return res.status(400).json({ message: 'Token is required' });

if (!req.body.token && req.auth.role !== Role.Admin) {
    return res.status(401).json({ message: 'Unauthorized' });
}

    accountService.revokeToken({ token, ipAddress })
        .then(() => res.json({ message: 'Token revoked' }))
        .catch(next);
}

// 📝 REGISTER
function registerSchema(req: any, res: any, next: any) {
    const schema = Joi.object({
        title: Joi.string().required(),
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
        acceptTerms: Joi.boolean().valid(true).required()
    });
    validateRequest(req, next, schema);
}

function register(req: any, res: any, next: any) {
    accountService.register(req.body, req.get('origin'))
        .then(() => res.json({ message: 'Registration successful, check your email' }))
        .catch(next);
}

// ✅ VERIFY EMAIL
function verifyEmailSchema(req: any, res: any, next: any) {
    const schema = Joi.object({
        token: Joi.string().required()
    });
    validateRequest(req, next, schema);
}

function verifyEmail(req: any, res: any, next: any) {
    accountService.verifyEmail(req.body)
        .then(() => res.json({ message: 'Verification successful, you can now login' }))
        .catch(next);
}

// 🔑 FORGOT PASSWORD
function forgotPasswordSchema(req: any, res: any, next: any) {
    const schema = Joi.object({
        email: Joi.string().email().required()
    });
    validateRequest(req, next, schema);
}

function forgotPassword(req: any, res: any, next: any) {
    accountService.forgotPassword(req.body, req.get('origin'))
        .then(() => res.json({ message: 'Check email for reset instructions' }))
        .catch(next);
}

// 🔍 VALIDATE RESET TOKEN
function validateResetTokenSchema(req: any, res: any, next: any) {
    const schema = Joi.object({
        token: Joi.string().required()
    });
    validateRequest(req, next, schema);
}

function validateResetToken(req: any, res: any, next: any) {
    accountService.validateResetToken(req.body)
        .then(() => res.json({ message: 'Token is valid' }))
        .catch(next);
}

// 🔁 RESET PASSWORD
function resetPasswordSchema(req: any, res: any, next: any) {
    const schema = Joi.object({
        token: Joi.string().required(),
        password: Joi.string().min(6).required(),
        confirmPassword: Joi.string().valid(Joi.ref('password')).required()
    });
    validateRequest(req, next, schema);
}

function resetPassword(req: any, res: any, next: any) {
    accountService.resetPassword(req.body)
        .then(() => res.json({ message: 'Password reset successful' }))
        .catch(next);
}

// 📋 GET ALL
function getAll(req: any, res: any, next: any) {
    accountService.getAll()
        .then(accounts => res.json(accounts))
        .catch(next);
}

// 🔍 GET BY ID
function getById(req: any, res: any, next: any) {
    accountService.getById(req.params.id)
        .then(account => account ? res.json(account) : res.sendStatus(404))
        .catch(next);
}

// ➕ CREATE
function createSchema(req: any, res: any, next: any) {
    const schema = Joi.object({
        title: Joi.string().required(),
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
        role: Joi.string().valid(Role.Admin, Role.User).required()
    });
    validateRequest(req, next, schema);
}

function create(req: any, res: any, next: any) {
    accountService.create(req.body)
        .then(account => res.json(account))
        .catch(next);
}

// ✏️ UPDATE
function updateSchema(req: any, res: any, next: any) {
    const schemaRules: any = {
        title: Joi.string().empty(''),
        firstName: Joi.string().empty(''),
        lastName: Joi.string().empty(''),
        email: Joi.string().email().empty(''),
        password: Joi.string().min(6).empty(''),
        confirmPassword: Joi.string().valid(Joi.ref('password')).empty('')
    };

   if (req.auth.role === Role.Admin) {
    schemaRules.role = Joi.string().valid(Role.Admin, Role.User).empty('');
}

    const schema = Joi.object(schemaRules).with('password', 'confirmPassword');
    validateRequest(req, next, schema);
}

function update(req: any, res: any, next: any) {
    accountService.update(req.params.id, req.body)
        .then(account => res.json(account))
        .catch(next);
}

// ❌ DELETE
function _delete(req: any, res: any, next: any) {
    accountService.delete(req.params.id)
        .then(() => res.json({ message: 'Deleted successfully' }))
        .catch(next);
}

// 🍪 COOKIE
function setTokenCookie(res: any, token: any) {
    const cookieOptions = {
        httpOnly: true,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    };
    res.cookie('refreshToken', token, cookieOptions);
}