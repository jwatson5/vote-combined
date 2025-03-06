/*****************************************************************************
**                                                                          **
** faculty-profiles.js                                                      **
**  long running process to update the database with current facutly info   **
**  and download/store photos in the images/facprofile directory            **
**                                                                          **
*****************************************************************************/
// load dependencies
const qs = require('qs'),
      axios = require("axios"),
      sharp = require('sharp'),
      fsp = require('fs').promises,
      tbljson = require('tabletojson').Tabletojson;

// local variables
const logger = require(__apphome + '/lib/util/logger'),
      dbconn = require(__apphome + '/lib/util/db');

const f = "faculty-profiles";

// progress indicator - updated by images.imgPromise function
let progress = {
  inProgress: false,
  total: 0,
  finished: 0
};

// private functions and objects
const images = {
  init: async (dir) => {
    try {
      // we really just want to see if the location directory is there
      //   if not, we'll just create it before moving on
      return await fsp.stat(dir);
    } catch (err) {
      if (err.code === 'ENOENT') {
        logger.info(`${f}.images.init`, `creating ${dir}`);
        return await fsp.mkdir(dir, {recursive: true});
      }
    }
  },  
  clearOld: async (dir) => {
    try {
      const imgFiles = await fsp.readdir(dir);
      let imgPromises = [];
      for(let i = 0; i < imgFiles.length; i++) {
        const p = fsp.unlink(dir + '/' + imgFiles[i]);
        imgPromises.push(p);
      }
      // this is too short of time.... < 5 ms on the laptop
      logger.info(`${f}.images.clearOld`, "started removing images");
      await Promise.all(imgPromises);
      logger.info(`${f}.images.clearOld`, "finished removing images");
      return true;
    } catch(err) {
      logger.err(`${f}.images.clearOld`, err);
    }
  },
  webGet: async (urlroot, data) => {
    try {
      logger.info(`${f}.images.webGet`, "started downloading images");
      await images.getModifyImage(urlroot + '/images/na.png', 'public_html/images/facprofile/na.png');
      //for(let i = 0; i < 5; i++) {
      for(let i = 0; i < data.length; i++) {
        const e = data[i].email.substring(0, data[i].email.indexOf('@'));
        if(data[i].photo == urlroot + '/images/na.png') {
          delete data[i].photo
        } else {
          const f = 'public_html/images/facprofile/' + e + '.jpg';
          await images.getModifyImage(data[i].photo, f);
          data[i].photo = 'images/facprofile/' + e + '.jpg';
        }
        data[i].email = e;
      }
      logger.info(`${f}.images.webGet`, "finished downloading images");
      return data;
    } catch(err) {
      logger.err(`${f}.images.webGet`, err);
    }
  },
  getModifyImage: async (url, file) => {
    try {
      const im = await axios.get(url, {responseType: 'arraybuffer'});
      // Using fetch instead of axios
      // const response = await fetch(url);
      // const im = { data: await response.arrayBuffer() };
      const buf = Buffer.from(im.data, 'binary');
      const md = await sharp(buf).metadata();
      // trying to crop to a square
      let w = md.width;
      let h = md.width;
      if(md.height < md.width) {
        h = md.height;
        w = md.height;
      }
      await sharp(buf).extract({ left: 0, 
        top: 0, 
        width: w,
        height: h })
                      .resize(100, 100)
                      .toFile(file);
      progress.finished++;
    } catch(err) {
      logger.err(`${f}.images.getModifyImage`, err);
    }
  }
};

const docs =  {
  clearOld: async (db) => {
    try {
      // clean out old db entries
      logger.info(`${f}.docs.clearOld`, "started removing existing docs");
      await db.collection('faculty').deleteMany({});
      await db.collection('lookup').deleteMany({name: 'senatorlist'});
      logger.info(`${f}.docs.clearOld`, "finished removing existing docs");
      return true;
    } catch(err) {
      logger.err(`${f}.docs.clearOld`, err);
    }
  },
  getWebFacultyDir: async (url) => {
    try {
      logger.info(`${f}.docs.getWebFacultyDir`, "started retrieve una faculty web directory");

      const res = await axios({
          url: url,
          method: 'POST',
          headers: {'Content-Type': 'application/x-www-form-urlencoded'},
          data: qs.stringify({method: 'retrieveFaculty'})
        });
      logger.info(`${f}.docs.getWebFacultyDir`, "finished retrieve una faculty web directory");
      logger.info(
        `${f}.docs.getWebFacultyDir`, 
        {info: "example item 7", data: res.data.employees[7]}
      );
      return res.data.employees;
    } catch(err) {
      logger.err(`${f}.docs.getWebFacultyDir`, err);
    }
  },
  getFacultySenate: async (url) => {
    try {
      logger.info(`${f}.docs.getFacultySenate`, "started retrieve una faculty senators");
      const webtable = await tbljson.convertUrl(url);
      let fl = new Array();
      for(let i = 0; i < webtable[0].length; i++) {
        const f = {
          value: webtable[0][i]['First Name'] + ' ' + webtable[0][i]['Last Name'],
          data: webtable[0][i]['Email Address'].substring(0, webtable[0][i]['Email Address'].indexOf('@'))
        };
        fl.push(f);
      }
      logger.info(`${f}.docs.getFacultySenate`, "finished retrieve una faculty senators");
      logger.info(
        `${f}.docs.getFacultySenate`, 
        {info: "example item 7", data: fl[7]}
      );
      return fl;
    } catch(err) {
      logger.err(`${f}.docs.getFacultySenate`, err);
    }
  },
  saveFaculty: async (data, db) => {
    try {
      logger.info(`${f}.docs.saveFaculty`, "started inserting faculty docs");
      const r = await db.collection('faculty').insertMany(data);
      logger.info(`${f}.docs.saveFaculty`, "finished inserting faculty docs");
      return r;
    } catch(err) {
      logger.err(`${f}.docs.saveFaculty`, err);
    }
  },
  saveSenate: async (data, db) => {
    try {
      logger.info(`${f}.docs.saveSenate`, "started inserting faculty docs");
      const r = await db.collection('lookup').insertOne({name: 'senatorlist', data: data});
      logger.info(`${f}.docs.saveSenate`, "finished inserting faculty docs");
      return r;
    } catch(err) {
      logger.err(`${f}.docs.saveSenate`, err);
    }
  }
};

// public functions
module.exports = {
  updateFaculty: async () => {
    try {
      const db = dbconn.db();
      const remoteWeb = 'https://www.una.edu';
      const imgLoc = __webroot + '/images/facprofile';
      progress.inProgress = true;

      // clear and reset db and file storage
      await images.init(imgLoc);
      await images.clearOld(imgLoc);
      await docs.clearOld(db);

      // make a call to custom UNA web directory
      const facultyInit = await docs.getWebFacultyDir(remoteWeb + '/directory/api/api.php');
      progress.total = facultyInit.length + 10; // just add a little extra for additional time
      progress.finished += 5;

      // download and process faculty profile images
      const updatedFacultyList = await images.webGet(remoteWeb, facultyInit);
      await docs.saveFaculty(updatedFacultyList, db);

      // download the faculty senate list used for voting
      const senateList = await docs.getFacultySenate(remoteWeb + '/faculty-senate/senators.html');
      await docs.saveSenate(senateList, db);

      // finished with everything, so complete counter
      progress.finished = progress.total;
      progress.inProgress = false;
      return true;
    } catch (err) {
      logger.err(`${f}.updateFaculty`, err);
    }
  },
  reset: () => {
    progress = {
      inProgress: false,
      total: 0,
      finished: 0
    };
  },
  inProgress: () => {
    return progress.inProgress;
  },
  getProgress: () => {
    if(progress.total > 0) {
      return (progress.finished * 100) / progress.total;
    } else {
      return 0;
    }
  }
};
