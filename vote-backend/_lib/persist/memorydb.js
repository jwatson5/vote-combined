/**
 * @fileoverview Handles intiation of memory database connection
 * 
 * @version 1.0.0
 * @date 2025-02-13
 * @author Jason Watson
 */

// utility libraries and constants
import { fileURLToPath } from 'node:url';
import { basename } from 'node:path';
import logger from '../_helpers/logger.js';
const F = basename(fileURLToPath(import.meta.url));

import { createClient } from 'redis';

redisClient: createClient(),

await main.redisClient.connect();