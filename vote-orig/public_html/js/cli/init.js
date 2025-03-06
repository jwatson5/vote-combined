/*
** cli/init.js
** intial senator voting loader
**  dynamically loads the logic components
**
*/

$(function() {
  // console.log('init.js: jquery ready state');
  libraries();
}); // end jquery ready

function init() {
  global.onPageLoad();
}

function libraries() {
  $.when(
    $.getScript('js/cli/view/centerPanel.js'),
    $.getScript('js/cli/view/statusBar.js'),
    $.getScript('js/cli/view/forms/vote.js'),
    $.getScript('js/cli/view/forms/ident.js'),
    $.getScript('js/cli/controller/message.js'),
    $.getScript('js/cli/controller/vote.js'),
    $.getScript('js/cli/controller/ident.js'),
    $.getScript('js/cli/controller/calls.js'),
    $.getScript('js/cli/controller/global.js'),
    $.Deferred(function(deferred) {
      $(deferred.resolve);
    })
  ).done(function() {
    if(global.loglevel > 0) console.log('init.js: libraries loaded');
    init();
  });
}