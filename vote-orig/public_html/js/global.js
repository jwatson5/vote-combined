/*
** global.js
** global variables used in whole app
**
*/


const global = {
  loglevel: 3, // 0-3 increasing in verbosity
  urlCU: `http://localhost:8001/api/createNewUser`,
};


const inputUser = document.getElementById('user-name');
const inputKey = document.getElementById('user-key');
const buttonLogin = document.getElementById('btn-login');

function loginValidateHandler(evt) {
  if(global.loglevel > 0) console.log(`global.js: userNameValidateHandler ${evt.type} event`);
  const selected = document.querySelector(`#senators > option[value="${inputUser.value}"]`);
  const notValid = inputUser.classList.contains("is-warning");

  // Checks for option with value attribute identical the same as user input
  if (selected && selected.value.length > 0) {
    // Runs if check for option does not return null and input > 0
    if(global.loglevel > 0) console.log(`global.js: ${inputUser.value} is valid`);
    if(notValid) { // make it valid
      inputUser.classList.remove("is-warning");
      inputUser.classList.add("is-success");
    }
  } else {
    // Runs if option is null (user entered a non-suggested value
    if(global.loglevel > 0) console.log(`global.js: ${inputUser.value} not valid`);
    if(!notValid) { // had valid input previously, invalidate
      inputUser.classList.remove("is-success");
      inputUser.classList.add("is-warning");
    }
  }
}

fetch('https://raw.githubusercontent.com/mledoze/countries/master/countries.json')
  .then(res => res.json())
  .then(data => {
    const datalist = document.getElementById('senators');

    data.forEach(item => {
        const newopt = document.createElement('option');
        newopt.value = item.name.common;
        datalist.appendChild(newopt);
    });
    if(global.loglevel > 0) console.log(`global.js: autocomplete list`);

    // from awesomplete library https://projects.verou.me/awesomplete/
    new Awesomplete(inputUser, {list: "#countries", maxItems: 6});

    ['input','keydown', 'blur', 'focus', 'awesomplete-selectcomplete'].forEach( evt => {
        inputUser.addEventListener(evt, loginValidateHandler, false);
        inputKey.addEventListener(evt, loginValidateHandler, false);
      }
    );


    
    inputUser.addEventListener('awesomplete-open', (evt) => {
      const elCont = document.getElementById('sectionLogin');
      elCont.style.paddingBottom = "14em";
    }, false);

    inputUser.addEventListener('awesomplete-close', (evt) => {
      const elCont = document.getElementById('sectionLogin');
      elCont.style.paddingBottom = null;
    }, false);
    

    //inputUser.addEventListener('input', () => {
    //  if(global.loglevel > 0) console.log(`global.js: input event on user-name`);
    //  validate();
    //});
});





