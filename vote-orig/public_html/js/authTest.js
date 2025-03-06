/*
** authTest.js
** object to handle calls to server
**  this file was setup to allow for
**  different server call methods (ie socket, ajax, etc)
**
*/

const authTest = {
  createUser: async (url) => {
    try {
      const newUserReq = new Request(url, {
        method: "POST",
        body: JSON.stringify({ username: "jswatson" }),
      });
      const res = await fetch(newUserReq);
      if (!res.ok) {
        throw new Error(`Response status: ${response.status}`);
      }
      if(global.loglevel > 0) console.log(`authTest.js: response.status - ${res.status}`);

      // get token from fetch request
      const token = await res.json();
      if(global.loglevel > 0) console.log(`authTest.js: token value is ${token}`);
      // set token in cookie
      //document.cookie = `token=${token}`;
      const docs = JSON.parse(document.cookie);
      if(global.loglevel > 0) {
        console.log(`authTest.js: doc cookie is below`);
        console.log(docs);
      }
    } catch (error) {
      if(global.loglevel > 0) console.error(`authTest.js: error ${error.message}`);
    }

  },
  checkAuth: async () => {
    const headers = { 'Authorization': `Bearer ${document.cookie}`};
  },
};