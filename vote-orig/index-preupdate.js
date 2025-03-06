/**********************************************************************
** index.js                                                          **
**                                                                   **
**  Voting web application                                           **
**   built with express to record votes from clients                 **
**                                                                   **
**********************************************************************/

// global variables
global.__loglevel = 1; // 0 - no logs, 1 - to mod client, 2 - server console
global.__apphome = __dirname;
global.__webroot = __dirname + '/public_html';
global.__simulation = false; // set if in simulation mode
global.__mode = process.env.NODE_ENV;
global.__storage = {
  engine: 'mongodb',
  dblocation: '127.0.0.1:27017/?maxPoolSize=20&w=majority',
  dbname: 'unavote'
};

const PORT = 8001;

// external libraries
const express = require('express'),
      app = express(),
      path = require('path'),
      session = require('express-session'),
      redis = require('redis');
      redisStore = require("connect-redis")(session);

// local libraries
const logger = require(__apphome + '/lib/util/logger'),
      dbconn = require(__apphome + '/lib/util/db'),
      bank = require(__apphome + '/lib/session/bank'),
      voteServer = require(__apphome + '/lib/util/server'); 

// main function
async function main() {
  try {
    logger.startup.init();

    // initialize global connection tracking
    //global.__senators = [];
    global.__moderator = null;
    global.__senatorEvents = [];

    // initialize the main database connection
    await dbconn.init();
    logger.startup.info(`${__storage.engine} database initialized`);

    // initialize the session <persistent> store
    let redisClient = redis.createClient({ legacyMode: true });
    redisClient.connect();
    const store = new redisStore({ 
      client: redisClient 
    });

    // express session persistence handled with redis
    let sess = session({
      secret: 'unavote',
      resave: true,
      saveUninitialized: false,
      // cookie: { maxAge: 3600000 },
      store: store
    });

    app.use(sess);
    logger.startup.info("using redis for session store");

    global.__store = store;

    // initialize object used for session tracking
    await bank.init();
    logger.startup.info("voting app controller initialized");
    logger.startup.info(`application mode is ${__mode}`);
    logger.startup.info(`log level is set at ${__loglevel}`);
    
    if (__mode == 'development') {
      // add changes here if development on server
    }

    // initialize express routes
    const rteAuth = require(__apphome + '/lib/routes/route-auth');
    const rteVote = require(__apphome + '/lib/routes/route-vote');
    const rteMain = require(__apphome + '/lib/routes/route-main');

    app.use(express.json());
    app.use('/auth', rteAuth);
    app.use('/vote', rteVote);
    app.use('/main', rteMain);
    logger.startup.info("express routes added for auth, vote and main");

    // initialize express static route for standard path and moderator path
    app.use(express.static('public_html'));
    app.get('/mod', (req, res) => {
      res.sendFile(path.join(__apphome + '/public_html/moderator.html'));
    });
    logger.startup.info("express static route added for public_html");

    // all handlers established, startup server
    await voteServer.start(app, PORT);
    logger.startup.info(`voting app server started and listening on *:${PORT}`);
    // if pm2 is being used register with the manager
    if (process.send) {
      process.send('ready');
      logger.startup.info("registered process with pm2 manager");
    }
    logger.startup.finish();

    // shutdown cleanly on sigint for pm2
    process.on('SIGINT', async () => {
      logger.startup.stop();
      logger.startup.info("attempting to nicely shutdown express");
      await voteServer.stop();
      logger.startup.info("express server is shutdown");
      await bank.clearStore();
      logger.startup.info("redis session store cleared");
      await dbconn.close();
      logger.startup.info(`${__storage.engine} database connections closed`);
      logger.startup.info("voter completely stopped, exiting");
      logger.startup.finish();
      process.exit(0);
    });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
} // end main() function

main();