import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pageRoutes = express.Router();

pageRoutes.get('/',(req,res)=>{
    res.render(path.join(__dirname,'../views/index.ejs'));
})

pageRoutes.get('/about',(req,res)=>{
    res.render(path.join(__dirname,'../views/about.ejs'));
});

pageRoutes.get('/contact',(req,res)=>{
    res.render(path.join(__dirname,'../views/contact.ejs'));
})
export default pageRoutes;