/**
 * @fileoverview Handles intiation of database connections for multiple db types
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

import mongodb from '../_helpers/mongo.js';

const persist = {
  init: () => {
    mongodb.init();
  },
  voters: async (voterList) => {
    const d = await mongodb.deleteMany('senate', {});
    const r = await mongodb.createMany('senate', voterList);
    return { delete: d, create: r };
  },
  faculty: async (facultyList) => {
    const d = await mongodb.deleteMany('faculty', {});
    const r = await mongodb.createMany('faculty', facultyList);
    return { delete: d, create: r };
  },
  testQ: () => {
    mongodb.test();
  },
  close: async () => {
    await mongodb.close();
  },
};

export default persist;