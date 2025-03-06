/**
 * @fileoverview Voting web application built with express to record votes from clients
 * 
 * @version 1.0.0
 * @date 2025-02-13
 * @author Jason Watson
 */

// utility libraries and constants
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { basename } from 'node:path';
import logger from './_lib/_helpers/logger.js';
const F = basename(fileURLToPath(import.meta.url));

// global variables
global.__loglevel = 1; // 0 - no logs, 1 - to mod client, 2 - server console

// external libraries
import express from 'express';
import cors from 'cors';

import persist from './_lib/persist/persistdb.js';

// routes
import routerAuth from './_lib/middleware/jwt-auth.js';

// main object
const main = {
  app: express(),
  
  config: async () => {
    dotenv.config();
    persist.init();
    main.app.use(express.json());
    main.app.use(cors());
  },
  main: async () => {
    try {
      main.config();
      main.routes();
      main.app.listen(process.env.PORT, main.started);
    } catch(err) {
      logger.err(F, err);
    }
  },
  routes: () => {
    // jwt middleware check
    main.app.use(routerAuth);
  },
  started: () => {
    // register start/stop with pm2
    main.regstart();
    main.regstop();

    logger.startup.init();
    logger.info(F, `starting vote-backend on port ${process.env.PORT}`);
    logger.startup.finish();
    main.singleRun();
  },
  regstart: () => {
    // if pm2 is being used register with the manager
    if (process.send) {
      process.send('ready');
    }
  },
  regstop: () => {
    // shutdown cleanly on sigint for pm2
    process.on('SIGINT', async () => {
      logger.startup.stop();
      logger.info(F, `stopping vote-backend`);
      logger.info(F, `closing mongodb connection`);
      await persist.close();
      logger.startup.finish();
      process.exit(0);
    })
  },
  singleRun: async () => {
    // single run items here
  },
}

main.main();