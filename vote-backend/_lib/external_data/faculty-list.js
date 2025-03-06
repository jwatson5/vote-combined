/**
 * @fileoverview Retrieves the faculty list from a POST call to send faculty data from UNA.
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

import { mkdir, rm, writeFile, readFile } from 'node:fs/promises';
import sharp from 'sharp';
import persist from '../persist/persistdb.js';

// progress indicator
const progress = {
  inProgress: false,
  total: 0,
  finished: 0,
  start: (t) => {
    progress.inProgress = true;
    progress.total = t;
    progress.finished = 0;
  },
  update: (i) => {
    progress.finished += i;
  },
  setComplete: () => {
    progress.finished = progress.total;
  },
  reset: () => {
    progress.inProgress = false;
    progress.total = 0;
    progress.finished = 0;
  },
};

const faculty = {
  updateFaculty: async () => {
    try {
      const facultyL = await getFacultyListFile();
      await storeFacultyList(facultyL);
      // use if debugging to keep from hitting the UNA site
      //const facultyL = await readFacultyListFile();

      logger.info(F, {info: "example item 96", data: facultyL[96]});

      /* comment out the following block to keep from hitting the UNA site */
      /* */ 
      progress.start(facultyL.length + 10);
      logger.info(F, `faculty list read successfully with ${facultyL.length} items`);
      await getFacultyImages(facultyL.employees);
      progress.setComplete();
      
      const result = await persistFacultyList(facultyL);
      logger.info(F, 'faculty list persisted successfully');
      logger.info(F, result);
    } catch(err) {
      logger.err(F, err);
    }
  },
  getProgress: () => {
    let status = 0; // not started
    if(progress.total > 0) {
      if(progress.finished === progress.total) {
        status = 100; // finished
        progress.reset();
      } else {
        status = (progress.finished * 100) / progress.total;
      }
    }
    return status;
  },
};

async function getFacultyList() {
  const saveData = [];
  const url = 'https://www.una.edu/directory/api/api.php';
  logger.info(F, 'start retrieve una faculty web directory');
  const res = await fetch(url, {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: "method=retrieveFaculty",
  });
  const data = await res.json();
  
  for(const fac of data.employees) {
    const faculty = {
      id: fac.id,
      first_name: fac.first_name,
      last_name: fac.last_name,
      pre: fac.pre,
      middle_name: fac.middle_name,
      department_1: fac.department_1,
      department_2: fac.department_2,
      department_3: fac.department_3,
      email: fac.email.substring(0, fac.email.indexOf('@')),
    };
    if(fac.photo != '/images/na.png') {
      faculty.photo = `tmp/images/${fac.id}.jpg`;
    }
    saveData.push(faculty);

  };
  logger.info(F, 'finished retrieve una faculty web directory');
  return saveData;
}

async function persistFacultyList(faculty) {
  return await persist.faculty(faculty);
}

async function getFacultyImages(faculty) {
  // clear out the images directory
  await rm('tmp/images', { recursive: true });
  const dirC = await mkdir('tmp/images', { recursive: true });

  // get the na.png image
  const naBuf = await getImageBuffer({ id: 'na', photo: '/images/na.png' });
  await processImage(naBuf.photo, 'tmp/images/na.png');

  // get the faculty images
  for (let i = 0; i < faculty.length; i += 10) {
    const chunk = faculty.slice(i, i + 10);
    const buffers = [];
    for (const fa of chunk) {
      if(fa.photo === '/images/na.png') {
        logger.info(F, `skipping ${fa.id} image`);
      } else {
        logger.info(F, `adding promise for ${fa.id}`);
        buffers.push(getImageBuffer(fa));
      }
    }
    await Promise.all(buffers).then((values) => {
      values.forEach(async (value) => {
        await processImage(value.photo, `tmp/images/${value.id}.jpg`);
        logger.info(F, `${value.id} promise resolved`);
      });
    });
    progress.update(chunk.length);
  }
}

async function getImageBuffer(faculty) {
  return new Promise(async (resolve, reject) => {
    try {
      const url = `https://www.una.edu${faculty.photo}`;
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      logger.info(`${F}.getImageBuffer`, `${faculty.photo} image processed inside promise`);
      resolve({ id: faculty.id, photo: buffer });
    } catch (error) {
      reject(error);
    }
  });
}

async function processImage(imageBuffer, file) {
  const buf = Buffer.from(imageBuffer, 'binary');
  const md = await sharp(buf).metadata();
  const dims = (md.height < md.width) ? 
      { w: md.height, h: md.height } : { w: md.width, h: md.width };
  await sharp(buf).extract({ left: 0, top: 0, width: dims.w, height: dims.h })
    .resize(100, 100)
    .toFile(file);
}

async function storeFacultyListFile(facultyList) {
  await writeFile('facultylist.json', JSON.stringify(facultyList, null, 2));
  logger.info(F, 'faculty list stored successfully');
}

async function readFacultyListFile() {
  const data = await readFile('facultylist.json', 'utf8');
  return JSON.parse(data);
}

export default faculty;