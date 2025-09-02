import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

async function generateToken(payload){
    return jwt.sign(payload, JWT_SECRET,{ expiresIn: '1day' });
}

async function verfyToken(token){
    return jwt.verify(token, JWT_SECRET);
}

export { generateToken, verfyToken };