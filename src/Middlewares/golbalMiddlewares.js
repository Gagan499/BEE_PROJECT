import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import bodyParser from "body-parser";
import express from "express";

const globalMiddlewares = (app) => {
    app.use(morgan('dev'));
    app.use(cors());
    app.use(helmet());
    app.use(bodyParser.json());
    app.use(express.json()); 
    app.use(express.urlencoded({ extended: true }));
}

export default globalMiddlewares;
