/*
** controller/message.js
**  controller message object
**  manages senator center messages
**
*/

const message = {
  text: null,
  state: {
    change: (state) => {
      // states: notCompat, waiting, other
      if(global.loglevel > 0) console.log('controller/message.js: state change: ' + state);
      message.state[state]();
    },
    notCompat: () => {
      if(global.loglevel > 0) console.log("No Server-sent events support!");
      message.text = 'Your browser is not compatible with this app<br>' +
                     'Please update to a newer/better browser';
    },
    waiting: () => {
      message.text = 'waiting on session to start ...';
      calls.pollforStart.start();
    },
  },
  update: () => {
    if(global.loglevel > 0) console.log('controller/message.js: update');
    if(global.loglevel > 1) console.log(global.compatiblity);
    if(global.loglevel > 1) console.log(global.serverSession);
    if(!global.compatiblity) {
      message.state.change('notCompat');
    } else if(!global.serverSession) {
      message.state.change('waiting');
    }

    if(message.text) {
      $('#new-pane-message').html(message.text);
    } else {
      $('#new-pane-message').html("");
    }
  },
};
