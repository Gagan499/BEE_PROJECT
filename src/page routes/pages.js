import express from 'express';

const pageRoutes = express.Router();

pageRoutes.get('/about',(req,res)=>{
    res.render('about.ejs');
});

pageRoutes.get('/contact',(req,res)=>{
    res.render('contact.ejs');
})
pageRoutes.get('/login',(req,res)=>{
    res.render('login.ejs');
});
export default pageRoutes;