import chalk from "chalk";
import client from "../redis_server.js";

let MAX_LIMIT = 5;
let LOCK_TIME = 15 * 60; //15 ,mins

export async function LoginPerDay(username){
  let key = `success:${username}`;
  let blockkey = `block:${username}`;

  const blocked = await client.exists(`block:${username}`);
  if(blocked){
    console.log(chalk.red(`${username} is currently blocked`));
    return;
  }

  let attempts = await client.get(key);
  attempts = attempts ? parseInt(attempts):0;
  attempts+=1
  if(attempts>=MAX_LIMIT){
    await client.set(blockkey,"1",{EX:LOCK_TIME});
    await client.del(key);
    console.log(chalk.red.bgRed(`User ${username} is blocked for ${LOCK_TIME / 60} minutes.`));
  }
  else{
    await client.set(key, attempts.toString(), { EX: LOCK_TIME });
    console.log(chalk.blue(`User ${username} login count: ${attempts}`));
  }
}

export async function isblocked(username){
  const blocked = await client.exists(`block:${username}`);
  return Boolean(blocked);
}
