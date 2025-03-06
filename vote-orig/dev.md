# Session Vote Development

Overview of code to help developers troubleshoot/extend the capabilities.

## Logic

* Authenticates each user
  - Moderator is authenticated to a single id/password
  - Senators/Voters are authenticated against a predefined list of people in the db.voters collection with a session password that the moderator creates and has on a slide
  - The session states are:
    - no session, no vote
    - session, no vote
    - session, voting
* Tracks http sessions from two primary user types: a single moderator that defines and controls slides for voting, many senators (or other types of voters) that attach to vote.

### TODO: update code descriptions

<!-- client structure
init.js - initialize reveal, check for previous session
controller.js - handle app states (authenticated, session, nosession) and slide states (new, view, edit, voting, elect, confirm)
slide.js - slide states
auth.js - authentication status
session.js - changes to session -->


## Server Code

Server-side tasks:

1. authenticate (moderator w/username-passwd, voters with id/sesscode)
2. CRUD persistence for voting sessions
3. Slide states
  * moderator (noactive, active(novote, vote))
  * voter/senator (noactive, active(novote, vote))
4. Updates to faculty and senators db
5. Voting simulation

### TODO: update code descriptions

<!-- ### index.js - start file for server app

* pub async main() - inits db, controller, listens on port 8001

### lib/db.js - database manager (mongodb support only)

* pub db() - returns native db connection
* pub init() - initializes connection to db "unavote"

### lib/fp.js - updating information about factulty profiles (una only)

* pub updateInfo() - makes a POST call to https://www.una.edu/directory/api/api.php, parses and stores faculty information in db. Also makes individual requests for faculty images from UNA img directory

### lib/mg-session.js - handle session changes and updates moderator and senator sessions

* not sure about this yet

### lib/sck-client.js - handles senator/voter socket events

* () - handles socket events for "vote"

### lib/sck-control.js - handles voting state changes initiated by moderator

* () - handles socket events for "startVote", "stopVote"

### lib/sck-faculty.js - handles client requests for faculty information and photos

* () - handles socket events for "faculty-data", "update-faculty"

### lib/sck-moderator-user.js - handles moderator authentication

* (socket, app) - handles socket events for "checklogin", "login", "logout"

### lib/sck-persist.js - handles management of moderator voting session and persistence of the voting sessions

* (socket, app) - handles socket events for "clearSession", "getSession", "createSession", "loadSession", "updateSession", "removeSession"

### lib/sck-share.js - shared socket events common to both moderators and senators/voters

* (socket, app) - handles socket events for "faculty-list"

### lib/sck-user.js - handles senator/voter authentication

* (socket, app) - handles socket events for "checklogin", "ident", "key", "logout"

### lib/sim.js - handles voting simulation for testing

* pub vote(app) - simulates a voting session by randomly submiting votes to the session
* pub stopSession(app) - simulates reset of attached 'voters'
* pub startSession(app) - simulates attaching of 'voters' (randomly)

## Client Code

### index.html - main page for senator/voter

* imports (css) - reveal, jquery-modal, jquery-autocomplete, white (reveal theme)
* imports (js) - jquery, jquery-autocomplete, jquery-animate-colors, jquery-modal, reveal, socket.io, cli-css, cli-html, vote

### moderator.html - main page for moderator

* imports (css) - reveal, jquery-modal, jquery-autocomplete, white (reveal theme)
* imports (js) - jquery, jquery-autocomplete, jquery-animate-colors, jquery-modal, Chart, reveal, socket.io, cli-css, cli-html, mod-html, mod-session, mod-slides, moderator

### js/cli-css.js - senator/voter css object

* pub css - display,overflow,resize,flex,dim(size,position),color,cursor,background,font,padding,margin,border,table
* pub pageCSS - voter page style (reveal overrides,checkbox)

### js/cli-html.js - manages HTML DOM changes for the senator/voter UI components

* pub clientHTML - button events,user information,session status,modal states,updates to slides

### js/moderator.js - initial code for moderator

* jquery ready - sets state object to init
* pub state - handles moderator states init,update,auth,login,logout
* pub ui - manages changes in modals (login and logout)

### js/mod-html.js - manages HTML DOM changes for the moderator UI components

* pub html - topPanel,voteInfo,manageSession,clearSession,modal(login,session),slide states

### js/mod-session.js - manages moderator vote session states

* pub admin - constructor object for the moderator voter session (init,restrictReveal,allowReveal,globalListeners)
* pub adminSession - manages moderator vote sessions (current,load,save,update,etc.)
* pub adminSessionUI - manages moderator UI components and states for different states

### js/mod-slides.js - manages the slide and slide states

* adminSlides - main slide controller; update states for moderator CRUD ops on slides
* adminSlidesUI - updates/changes slide UI components

### js/vote.js - initial code for senator/voter

* jquery ready - sets state object to init
* pub state - manages senator/voter states init,update,auth
* pub ui - manages senator/voter UI components -->
