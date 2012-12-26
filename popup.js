// Popup.js
// Javascript had to be moved to separate .js file due to chrome restrictions
// for manifest v2:
// http://developer.chrome.com/extensions/contentSecurityPolicy.html

// December 24th 2012
	

// is logging enabled?
var logging = true;

// log function
function log(txt) {
	if(logging) {
		console.log(txt);
	}
}

// For selecting text... [credit to http://4umi.com/web/javascript/select.php]
var Utils = {
NOT_SUPPORTED : {},
DOM : {
getElementWithId : function() {
  var func = function() { return Utils.NOT_SUPPORTED; }
  if(document.getElementById) {
	func = function(id) {
	  return document.getElementById(id);
	}
  } else if(document.all) {
	func = function(id) {
	  return document.all[id];
	}
  }
  return ( this.getElementWithId = func )();
}
},
Ranges : {
create : function() {
  var func = function() { return Utils.NOT_SUPPORTED };
  if(document.body && document.body.createTextRange) {
	func = function() { return document.body.createTextRange(); }
  } else if(document.createRange) {
	func = function() { return document.createRange(); }
  }
  return (this.create = func)();
},
selectNode : function(node, originalRng) {
  var func = function() { return Utils.NOT_SUPPORTED; };
  var rng = this.create(), method = '';
  if(rng.moveToElementText) { method = 'moveToElementText'; }
  else if(rng.selectNode) { method = 'selectNode'; }
  if(method)
	func = function(node, rng) {
	  rng = rng || Utils.Ranges.create();
	  //alert("Method: " + method);
	  node = document.getElementById("lastcomment2");
	  //alert("Node: " + node);
	  
	  rng[method](node);
	  return rng;
	}
  return rng = null, (this.selectNode = func)(node, originalRng);
}
},
Selection : {
clear:function() {
  var func = function() { return Utils.NOT_SUPPORTED };
  if( typeof document.selection !== 'undefined' ) {
	func = function() {
	  if(document.selection && document.selection.empty) {
		return (Utils.Selection.clear = function() {
		  if(document.selection) { document.selection.empty(); }
		})();
	  }
	}
  } else if(window.getSelection) {
	var sel = window.getSelection();
	if(sel.removeAllRanges) {
	  func = function() {
		window.getSelection().removeAllRanges();
	  }
	}
	sel = null;
  }
  return (this.clear = func)();
},
add : function(originalRng) {
  var func = function() { return Utils.NOT_SUPPORTED };
  var rng = Utils.Ranges.create();
  if(rng.select) {
	func = function(rng) { rng.select(); }
  } else if(window.getSelection) {
	var sel = window.getSelection();
	if(sel.addRange) {
	  func = function(rng) { window.getSelection().addRange(rng); }
	}
	sel = null;
  }
  return (this.add = func) ( originalRng );
}
}
};
// end of text selection code


// webdb stuff [credit to http://www.html5rocks.com/tutorials/webdatabase/todo/]
var database = {};
database.webdb = {};
database.webdb.db = null;

// open the db
database.webdb.open = function() {
	var dbSize = 5 * 1024 * 1024; // 5MB
	log("Size is " + dbSize);
	try {
		database.webdb.db = openDatabase('Comments', '1.0', 'saves comments', dbSize);
		log(database.webdb.db);
	} catch (e) {
		log(e);
	}
}	

// handling error
database.webdb.onError = function(tx, e) {
	log('Something unexpected happened: ' + e.message );
}

// on success
database.webdb.onSuccess = function(tx, r) {
	log('DB opened successfully');
}

// gets a comment
database.webdb.getComment = function(renderFunc, id) {
  //log('Id in getcomment = ' + id);
  database.webdb.db.transaction(function(tx) {
	log('Id passed in: ' + id);
	tx.executeSql('SELECT * FROM comment WHERE ID=?', [id.toString()], renderFunc, 
			database.webdb.onError);
  });
}

// stores the last comment
var lastComment;		
var lastURL;
var lastTitle;

// callback function for checking if a comment exists in the table
function getCommentCB(tx, rs) {
	log('\nRS Length = ' + rs.rows.length);
	
	for (var i=0; i < rs.rows.length; i++) {
		log('RS ' + i + ' = ' + rs.rows.item(i));
	}
	if (rs.rows.length == 0) {// none found
		lastComment = "No comments saved!";
		lastURL = "";
		lastTitle = "";
	}
	else {
		lastComment = rs.rows.item(rs.rows.length-1).comment;
		lastURL = rs.rows.item(rs.rows.length-1).url;
		lastTitle = rs.rows.item(rs.rows.length-1).title;
	}
		
	// hack:
	// if comment is only size 
	log('lastComment: ' + lastComment);
	log('lastTitle: ' + lastTitle);
	log('lastURL: ' + lastURL);
}

// Variables for getting the key from localstorage	
var key = "id";
var val1;	

// toggles tracking variable based on checkbox
function toggleTracking() {
	// checkbox
	var checkb = document.getElementById('trackingCheckbox');
	if (checkb.checked) {			// enable tracking
		setItem("tracking", "1");
		// update the context menu in background.html
		chrome.extension.getBackgroundPage().updateTrackingMenu(true);
	}
	else {
		setItem("tracking", "0");
		// update the context menu in background.html
		chrome.extension.getBackgroundPage().updateTrackingMenu(false);
	}
}

// start
function start() {
	// tracking checkbox
	var trackingCheck = getValue("tracking");
	
	// make sure it's not null
	if (trackingCheck == null) {
		setItem("tracking", "1");
		trackingCheck = "1";
	}
	
	// checkbox
	var checkb = document.getElementById('trackingCheckbox');
	if (trackingCheck == "1") { // tracking enabled
		checkb.checked = true;
	}
	else {
		checkb.checked = false;
	}

	// the comment
	populate(1);
}

// populates the popup
function populate(diff) {
	// open database
	try {
		database.webdb.open();
		//log('database open');
		
		// update the comment in the popup
		updateValues();
		//log('leaving populate()');
	} catch (e) {
		log("error while doing something");
		log(e);
	  }
  }

// SQL query to get all the comments
database.webdb.getAllComments = function(renderFunc) {
	database.webdb.db.transaction(function(tx) {
		tx.executeSql('SELECT * FROM comment', [], renderFunc, 
					database.webdb.onError);
	});
}

// the current id
var currentId;

// SQL query to get the current comment
database.webdb.getComment = function(renderFunc, id) {
	//log('Id in getcomment = ' + id);
	database.webdb.db.transaction(function(tx) {
		tx.executeSql('SELECT * FROM comment WHERE ID=?', [id], renderFunc, 
																database.webdb.onError);
	});
}

// returns the item from local storage given the key	  
function getValue(key) {
	return chrome.extension.getBackgroundPage().getItem(key);
}

// sets the item
function setItem(key, value) {
	return chrome.extension.getBackgroundPage().setItem(key, value);
}

// Shows the comment
function updateValues() {
	//log('Inside update values');
	
	// look up the database, get all the comments and choose the last one
	//database.webdb.getAllComments(getCommentCB);
	var id2 = getValue("currentID");
	//id2 += ".0";
	log("CURRENT ID IN POPUP: " + id2);
	database.webdb.getComment(getCommentCB, id2);
	
	//setTimeout("log('After get comment')", 000);
  
	// set a little delay to ensure that the comment shows up
	setTimeout(updateComment, 200);
	//setTimeout("document.getElementById('link').href = \"javascript:window.open(lastURL)\"", 200);
	//setTimeout("document.getElementById('Title2').innerText = lastTitle", 200);
	//setTimeout("document.getElementById('lastcomment2').innerText = lastComment", 200);
}

// selects the comment text
function selectText() {
	Utils.Selection.clear();
	Utils.Selection.add( Utils.Ranges.selectNode(Utils.DOM.getElementWithId("lastcomment2") ) );
}

// opens the comments window
function openAllComments() {
	window.open("allcomments.html");
}

// For manifest v2:
// DOM events should be linked through event handlers - rather annoying.
// December 24th 2012

// on load page
document.addEventListener('DOMContentLoaded', function () {

	// viewing all comments
	document.getElementById('allcomments').addEventListener('click', openAllComments);
	
	// toggle tracking
	document.getElementById('trackingCheckbox').addEventListener('click', toggleTracking);
  
	// initialize
	start();
});

// callback function to update the comment info
function updateComment() {
	// url
	document.getElementById('link').addEventListener('click', openLastURL);
	// Changing href not working anymore for some reason - auto opens page whenever popup page clicked
	//document.getElementById('link').href = openLastURL;//"javascript:window.open(\"" + lastURL + "\");";
	// title
	document.getElementById('Title2').innerText = lastTitle;
	// comment
	document.getElementById('lastcomment2').innerText = lastComment;
}

// callback function to open url for the comment
function openLastURL() {
	//chrome.tabs.create({url: lastURL});
	window.open(lastURL);
}
	