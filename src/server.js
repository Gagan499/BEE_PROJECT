import express from 'express';
import dotenv from 'dotenv';
import ejs from 'ejs';
import chalk from "chalk";
import path from 'path';

import { fileURLToPath } from 'url';

import connectDB from '../config/db.js';
import pageRoutes from './page routes/pages.js'; 
import globalMiddlewares from './Middlewares/golbalMiddlewares.js';
import authRouter from './routes/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Set EJS as the templating engine
app.set('views',path.join(__dirname,'./views'));
app.set('view engine','ejs');

// accessing static files in public folder
app.use(express.static('public'));

// Global Middlewares
globalMiddlewares(app);

// Connect to MongoDB
connectDB();

// Pages and auth routes middleware
app.use('/api', pageRoutes);
app.use('/auth',authRouter);

app.get('/',(req,res)=>{
    res.render('index.ejs');
});

app.listen(PORT,()=>{
    console.log(chalk.blue(`Server is running on port ${PORT}`));
})

