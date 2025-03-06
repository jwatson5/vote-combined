/**
 * @fileoverview Handles mongo database connections and CRUD operations
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

import { MongoClient } from 'mongodb';

const urlconn = 'mongodb://localhost:27017';

const mongodb = {
  mongoClient: new MongoClient(urlconn),
  database: null,
  init: () => {
    mongodb.database = mongodb.mongoClient.db(process.env.DBNAME);
  },
  close: async () => {
    await mongodb.mongoClient.close();
  },
  create: async (location, data) => {
    const result = await mongodb.database.collection(location).insertOne(data);
    return result;
  },
  createMany: async (location, data) => {
    const result = await mongodb.database.collection(location).insertMany(data);
    return result;
  },
  readObj: async (location, query) => {
    const doc = await mongodb.database.collection(location).findOne(query);
    return doc;
  },
  readCursor: async (location, query) => {
    const c = await mongodb.database.collection(location).findOne(query);
    return c;
  },
  updateOne: async (location, filter, data) => {
    const result = await mongodb.database.collection(location).updateOne(filter, data);
    return result;
  },
  updateMany: async (location, filter, data) => {
    const result = await mongodb.database.collection(location).updateMany(filter, data);
    return result;
  },
  deleteOne: async (location, query) => {
    const result = await mongodb.database.collection(location).deleteOne(query);
    return result;
  },
  deleteMany: async (location, query) => {
    const result = await mongodb.database.collection(location).deleteMany(query);
    return result;
  },
  test: async () => {
    const info = await mongodb.readObj('lookup', {name: 'serverconfig'});
    logger.info(F, info);    
  },
};

export default mongodb;