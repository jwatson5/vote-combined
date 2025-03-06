/*
** loader.js
** intial loader
**  dynamically loads the logic components
**
*/

function init() {
  if(global.loglevel > 0) console.log(`loader.js: function init started`);
  const buttonLogin = document.getElementById("btn-login");
  buttonLogin.addEventListener("click", (e) => {
    if(global.loglevel > 0) console.log(`loader.js: login button clicked`);
    authTest.createUser(global.urlCU);
  });
}


init();
