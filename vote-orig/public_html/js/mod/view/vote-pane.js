/*
** view/vote-pane.js
**  manages main vote ui - initiates from controller state [vote]
**
*/

const votePane = {
  onPageLoad: function () {
    if(global.loglevel > 0) console.log('view/vote-pane.js: onPageLoad');
  },
  init: function () {
    if(global.loglevel > 0) console.log('view/vote-pane.js: init');
  },
  state: {
    change: function (state) {
      if(global.loglevel > 0) console.log('view/vote-pane.js: state change: ' + state);
      this[state]();
    },
    needIdent: function () {
      $('#vote-pane').hide();
    },
    vote: function () {
      $('#vote-pane').show();
    }
  },
  panelPos: function (location) {
    if (location == "top") {
      $('#vote-pane').removeClass('flex-hcenter full-height');
      $('#vote-pane').addClass('flex flex-column margin-top-xxlg');
    } else {
      $('#vote-pane').removeClass('flex-column margin-top-xxlg');
      $('#vote-pane').addClass('flex-hcenter full-height');
    }
  }
}