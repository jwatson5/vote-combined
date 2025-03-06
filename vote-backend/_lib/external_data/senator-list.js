/**
 * @fileoverview Retrieves a list of senators from the UNA faculty senate web page.
 * 
 * @version 1.0.0
 * @date 2025-02-11
 * @author Jason Watson
 */

// utility libraries and constants
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { basename } from 'node:path';
import logger from '../_helpers/logger.js';
const F = basename(fileURLToPath(import.meta.url));

import { tabletojson } from 'tabletojson';
import persist from '../persist/persistdb.js'

const senators = {
  senateURL: 'https://www.una.edu/faculty-senate/senators.html',
  updateSenators: async () => {
    try {
      const senateList = await senators.getFacultySenate();
      const updateR = await persist.voters(senateList);
      logger.info(F, updateR);
    } catch(err) {
      logger.err(F, err);
    }
  },
  getFacultySenate: async () => {
    // retrieve the faculty senate list
    const webtable = await tabletojson.convertUrl(senators.senateURL);
    let fl = new Array();
    for(let i = 0; i < webtable[0].length; i++) {
      const f = {
        value: `${webtable[0][i]['First Name']} ${webtable[0][i]['Last Name']}`,
        data: webtable[0][i]['Email Address'].substring(0, webtable[0][i]['Email Address'].indexOf('@'))
      };
      fl.push(f);
    }
    logger.info(`${F}.docs.getFacultySenate`, "finished retrieve una faculty senators");
    return fl;
  },
  saveSenate: async (senateList, db) => {
    logger.info(`${F}.docs.saveSenate`, "started inserting faculty docs");
    const r = await db.collection('lookup').insertOne({name: 'senatorlist', data: data});
    logger.info(`${F}.docs.saveSenate`, "finished inserting faculty docs");
    return r;
}
};

export default senators;
