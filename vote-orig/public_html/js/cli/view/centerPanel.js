/*
** centerPanel.js
**  centerPanel object
**  manages center panel states and changes
**
*/

const centerPanel = {
  onPageLoad: function() {
    if(global.loglevel > 0) console.info('centerPanel.js: onPageLoad');
  },
  state: {
    change: function(state) {
      if(global.loglevel > 0) console.info('centerPanel.js: state change: ' + state);
      this[state]();
    },
    singleMessage: function() {
      $('#center').removeClass('bg-alert');
      $('#ident-form').hide();
      $('#vote-pane').hide();
      $('#new-pane').show();
      message.update();
    },
    needIdent: function() {
      $('#center').addClass('bg-alert');
      $('#new-pane').hide();
      $('#vote-pane').hide();
      $('#ident-form').show();
      ident.init();
    },
    vote: function() {
      $('#center').removeClass('bg-alert');
      $('#ident-form').hide();
      $('#new-pane').hide();
      $('#vote-pane').show();
      vote.update();
    }
  }
};
