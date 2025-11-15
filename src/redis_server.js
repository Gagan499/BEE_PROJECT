import chalk from "chalk";
import { createClient } from "redis";
import "dotenv/config";

const REDIS_URL = process.env.REDIS_URL;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
const REDIS_PORT = process.env.REDIS_PORT;
const REDIS_USERNAME = process.env.REDIS_USERNAME;

const client = createClient({
  username: REDIS_USERNAME,
  password: REDIS_PASSWORD,
  socket: {
    host: REDIS_URL,
    port: Number(REDIS_PORT),
  },
  database: 0,
});

client.on("error", (err) => console.log("Redis Client Error", err));

await client.connect();
console.log(chalk.greenBright(" connected to redis ... "));

export default client;
