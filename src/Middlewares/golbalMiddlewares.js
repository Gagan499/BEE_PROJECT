import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import bodyParser from "body-parser";
import cookieParser  from "cookie-parser"
import express from "express";

const globalMiddlewares = (app) => {
  app.use(morgan("dev"));
  app.use(cors());
  app.use(
    helmet({
      contentSecurityPolicy: false,
      xDownloadOptions: false,
    })
  );
  app.use(bodyParser.json());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
};

export default globalMiddlewares;
