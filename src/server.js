import express from 'express';
import dotenv from 'dotenv';
import ejs from 'ejs';
import pageRoutes from './page routes/pages.js'; 
import globalMiddlewares from './Middlewares/golbalMiddlewares.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT;

// Set EJS as the templating engine
app.set('view engine','ejs');

// accessing static files in public folder
app.use(express.static('public'));

// Global Middlewares
globalMiddlewares(app);

// Pages routes middleware
app.use('/api', pageRoutes);

app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
})

