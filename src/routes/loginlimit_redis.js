import chalk from "chalk";
import client from "../redis_server.js";

// Configuration
const MAX_FAILED_ATTEMPTS = 5;     
const BLOCK_DURATION = 15 * 60;    
const DAILY_RESET = 24 * 60 * 60;  

export async function FailedLoginPerDay(username) {
  const failKey = `fail:${username}`;
  const blockKey = `block:${username}`;

  const blocked = await client.exists(blockKey);
  if (blocked) {
    console.log(chalk.red(`${username} is currently blocked.`));
    return;
  }

  let attempts = await client.get(failKey);
  attempts = attempts ? parseInt(attempts) : 0;
  attempts += 1;

  if (attempts >= MAX_FAILED_ATTEMPTS) {
    await client.set(blockKey, "1", { EX: BLOCK_DURATION });
    await client.del(failKey);
    console.log(
      chalk.red.bgRed(
        `User ${username} is blocked for ${BLOCK_DURATION / 60} minutes due to too many failed attempts.`
      )
    );
  } else {
    await client.set(failKey, attempts.toString(), { EX: DAILY_RESET });
    console.log(
      chalk.yellow(
        `Failed login attempt ${attempts}/${MAX_FAILED_ATTEMPTS} for user ${username}.`
      )
    );
  }
}

export async function isBlocked(username) {
  const blockKey = `block:${username}`;
  const blocked = await client.exists(blockKey);
  if (blocked) {
    // Get remaining time for the block
    const ttl = await client.ttl(blockKey);
    return { blocked: true, remainingSeconds: ttl };
  }
  return { blocked: false, remainingSeconds: 0 };
}

// Clear failed attempts on successful login
export async function clearFailedAttempts(username) {
  const failKey = `fail:${username}`;
  await client.del(failKey);
  console.log(chalk.green(`Cleared failed login attempts for ${username}.`));
}


