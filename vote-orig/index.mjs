/**********************************************************************
** index.js                                                          **
**                                                                   **
**  Voting web application                                           **
**   built with express to record votes from clients                 **
**                                                                   **
**********************************************************************/

// global variables
global.__loglevel = 1; // 0 - no logs, 1 - to mod client, 2 - server console

// external libraries
import express from 'express';
import session from 'express-session';
import {createClient} from 'redis';
import {RedisStore} from 'connect-redis';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

const app = express();
dotenv.config();

// local libraries
import voteServer from './lib/util/server.mjs';
import logger from './lib/util/logger.mjs';
//const logger = require(__dirname + '/lib/util/logger'),
//      voteServer = require(__dirname + '/lib/util/server'); 

// main function
async function main() {
  try {
    logger.startup.init();
    // initialize global connection tracking
    //global.__senators = [];
    global.__moderator = null;
    global.__senatorEvents = [];

    let redisClient = createClient();
    redisClient.connect().catch(console.error);

    // Initialize store.
    let redisStore = new RedisStore({
      client: redisClient,
      prefix: "vote:",
    });

    // express session persistence handled with redis
    let sess = session({
      secret: 'unavote',
      resave: true,
      saveUninitialized: false,
      // cookie: { maxAge: 3600000 },
      store: redisStore,
    });

    logger.startup.info(`session store initialized`);

    app.use(sess);
    app.use(express.json());
    app.use(cors());

    app.post('/api/createNewUser', (req, res) => {
      // ...
    
      const token = generateAccessToken({ username: req.body.username });
      res.json(token);
    
      // ...
    });

    app.get('/api/checkAuth', (req, res) => {

    });



    // all handlers established, startup server
    await voteServer.start(app);
    //console.info(`voting app server started and listening on *:${process.env.PORT}`);
    logger.startup.info(`voting app server started and listening on *:${process.env.PORT}`);
    // if pm2 is being used register with the manager
    if (process.send) {
      process.send('ready');
      logger.startup.info("registered process with pm2 manager");
    }
    logger.startup.finish();


    // shutdown cleanly on sigint for pm2
    process.on('SIGINT', async () => {
      logger.startup.stop();
      logger.startup.info(`attempting to nicely shutdown express`);
      await voteServer.stop();
      //console.info(`\nexpress server is shutdown`);
      logger.startup.info(`express server is shutdown`);
      await redisStore.clear();
      logger.startup.info(`sessions are cleared from store`);
      logger.startup.info(`voter completely stopped, exiting`);
      logger.startup.finish();
      process.exit(0);

      /*
      await bank.clearStore();
      logger.startup.info("redis session store cleared");
      await dbconn.close();
      logger.startup.info(`${__storage.engine} database connections closed`);
*/

    });

  } catch (err) {
    console.error(err);
    //console.log(err);
    process.exit(1);
  }
}

function generateAccessToken(username) {
  return jwt.sign(username, process.env.TOKEN_SECRET, { expiresIn: '14400s' });
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (token == null) return res.sendStatus(401)

  jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
    console.log(err)

    if (err) return res.sendStatus(403)

    req.user = user

    next()
  })
}

main();

/*

const client = require("redis").createClient(),
	lock = require("redis-lock")(client);

await client.connect();

console.log("Asking for lock");
const done = await lock("myLock")
console.log("Lock acquired");
await someTask() // Some async task
console.log("Releasing lock now");
await done()
console.log("Lock has been released, and is available for others to use");


*/