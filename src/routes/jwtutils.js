import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

function generateToken(payload){
    return jwt.sign(payload, JWT_SECRET,{ expiresIn: '1d' });
}

function verfyToken(token){
    return jwt.verify(token, JWT_SECRET);
}

export { generateToken, verfyToken };