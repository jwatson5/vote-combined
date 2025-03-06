/**
 * @fileoverview Middleware to check for jwt token in the header of the request
 * 
 * @version 1.0.0
 * @date 2025-02-13
 * @author Jason Watson
 */

// utility libraries and constants
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { basename } from 'node:path';
import logger from '../_helpers/logger.js';
const F = basename(fileURLToPath(import.meta.url));

import { expressjwt } from 'express-jwt';
dotenv.config();

const routerAuth = expressjwt({
    secret: process.env.TOKEN_SECRET,
    algorithms: ["HS256"]
  }).unless({ path: ['/login',] });

export default routerAuth;