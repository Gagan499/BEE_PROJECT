import chalk from 'chalk';
import { createClient } from 'redis';

const client = createClient({
    username: 'default',
    password: 'ajJN0pRbs5cOZQiRSm0LnCmpEKqRjhGv',
    socket: {
        host: 'redis-13753.c10.us-east-1-2.ec2.redns.redis-cloud.com',
        port: 13753
    },
    database:0
});

client.on('error', err => console.log('Redis Client Error', err));

await client.connect();
console.log(chalk.greenBright(" connected to redis ... "));


export default client;

