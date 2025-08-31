import mongoose from "mongoose";
import dotenv from "dotenv";
import chalk from "chalk";
dotenv.config();

async function connectDB(){
    try{
        const Mongodb_uri = process.env.mongo_uri;
        await mongoose.connect(Mongodb_uri);
        console.log(chalk.green("MongoDB connected"));
    }
    catch(err){
        console.error(chalk.red("Error while connection mongodb : "),err);
    }
}

export default connectDB;