// allcomments.js
// Javascript had to be moved to separate .js file due to chrome restrictions
// for manifest v2:
// http://developer.chrome.com/extensions/contentSecurityPolicy.html

// December 25th 2012

// debugging
var logging = true;

/**************************************************
	DATABASE FUNCTIONS
**************************************************/

// webdb stuff
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

// adds all the comments on the display page
function addAllComments() {
	try {
		// open up the database
		database.webdb.open();
	
		// load all the items
		database.webdb.getAllComments(loadComments);
		
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

// Loads all the comments
function loadComments(tx, rs) {
	var rowOutput = "";
	
	// for avoiding duplicates
	var idAdded = [];
	// last one at the top
	for (var i=rs.rows.length - 1; i >= 0; i--) {
		// render only if comment's length is greater than 1 [TODO] and not duplicate
		var row = rs.rows.item(i);
		if (row.comment.length > 1 && idAdded.indexOf(row.ID) == -1) {
			rowOutput += renderTodoTable(row);
			// add to array
			idAdded.push(row.ID);
		}
	}
}

// for the context menu checkbox
function loadContextMenuSettings() {
	// check if it's enabled
	var check = chrome.extension.getBackgroundPage().getItem("contextMenu");
	
	if (check != null) {
		if (check == "0")
			document.getElementById("contextMenuCheck").checked = false;
		else
			document.getElementById("contextMenuCheck").checked = true;
	}
	
}


// Enables/disables context menus
function toggleContextMenus() {
	// is it checked?
	var check = document.getElementById("contextMenuCheck").checked;
	
	// enable/disable context menus
	chrome.extension.getBackgroundPage().toggleContextMenus(check);
}

/**************************************************
	MAIN INIT function
**************************************************/
function start() {
	// all the comments
	addAllComments();
	
	// all the filters
	redrawFilters();
	
	// context menu settings
	loadContextMenuSettings();
	
	// timed deletion settings
	loadTimedDeletionSettings();
	
	// load positive filters settings
	loadPositiveFilterSettings();
}

// renders to the table	
function renderTodoTable(row) {
	var table = document.getElementById('tablebody');
	
	// the row
	var tr = document.createElement("tr");
	
	// the elements
	var td1 = document.createElement("td");
	var td2 = document.createElement("td");
	var td3 = document.createElement("td");
	var td4 = document.createElement("td");
	
	// delete checkbox
	td1.innerHTML = '<input type = "checkbox" name = "'+ row.ID + '"/>';
	td1.width="10";
	// page
	td2.innerHTML = '<span style="word-break:break-all;"><a href=' + row.url+ '>' + row.title + '</a></span>';
	td1.width="100";
	// comment
	td3.innerText= row.comment;
	td1.width="400";
	// date/time
	td4.innerText = row.timestamp;
	td1.width="10";
	
	// append to the row
	tr.appendChild(td1);
	tr.appendChild(td2);
	tr.appendChild(td3);
	tr.appendChild(td4);
	//log(tr);
	
	table.appendChild(tr);		
}

// Redraws the list
function redraw() {
	$("#tablebody tr").remove();
	
	// load all the items
	database.webdb.getAllComments(loadComments);
}

// selects/unselects all checkboxes [for deletion]
function selectAll() {
	// is it checked or not?
	var isChecked = document.getElementById('selectAllCheckbox').checked;
	
	// get all checkboxes
	// get all the checked items first
	var inputs = document.getElementsByTagName('input');  
	var len = inputs.length;
	log('Checkboxes: ' + len);
	var i;  
	for(i = 0; i < len; i++) {
		if (inputs[i].type == 'checkbox')
			inputs[i].checked = isChecked;
	}
}

// deletes the checked comments
function deleteChecked() {
	// get all the checked items first
	var inputs = document.getElementsByTagName('input');  
	var len = inputs.length;
	log('Checkboxes: ' + len);
	var i;  
	for(i = 0; i < len; i++) {
		if (inputs[i].type == 'checkbox')
			if (inputs[i].checked)			
				database.webdb.deleteComment(inputs[i].name);
	}
	
	// re-draw the whole list...
	redraw();
}

// deletes one row from the table given the id
database.webdb.deleteComment = function(id) {
	database.webdb.db.transaction(function(tx) {
		tx.executeSql('DELETE FROM comment WHERE ID=?', [id],
			database.webdb.onSuccess, database.webdb.onError);
	});
}

// deletes all the comments 
function deleteAll() {
	// ask for confirmation
	var answer = confirm ("Are you sure? Click OK to confirm or CANCEL")
	if (answer){
	}
	else
		return;

	// reset id in local storage
	chrome.extension.getBackgroundPage().deleteAllComments();//clearStrg();

	// delete all the comments
	//database.webdb.db.transaction(function(tx) {
		//tx.executeSql('DELETE FROM comment');
	//});
	
	// redraw
	redraw();
}

// log function
function log(txt) {
	if(logging) {
		console.log(txt);
	}
}

/****************************************************

		FOR FILTERS

****************************************************/

// toggles the filters div
function toggleFilters() {
	// get the button
	var button = document.getElementById("filterToggleButton");
	var div = document.getElementById("Filters");
	
	// filters not visible, now make them visible
	if (button.value == '+') {
		button.value = '-';
		// display the filters
		div.style.display = 'block';
	}
	else {
		button.value = '+';
		// hide the filters
		div.style.display = 'none';
	}
}

// for the positive filters checkbox
function loadPositiveFilterSettings() {
	// check if it's enabled
	var check = chrome.extension.getBackgroundPage().getItem("positiveFilter");
	
	if (check != null) {
		if (check == "0")
			document.getElementById("positiveFilterCheck").checked = false;
		else
			document.getElementById("positiveFilterCheck").checked = true;
	}
	
}

// Enables/disables positive filters
function togglePositiveFilter() {
	// is it checked?
	var check = document.getElementById("positiveFilterCheck").checked;
	
	// enable/disable positive filters
	chrome.extension.getBackgroundPage().togglePositiveFilter(check);
}

// adds filters provided by the user
function addFilters() {
	var textbox = document.getElementById("newFilters");//.value;
	
	// split it up
	var text = textbox.value;
	var lines = text.split("\n");
	var length = lines.length;
	
	// add each filter individually
	for (var i = 0; i < length; i++) {
		if (lines[i] != "") {
			log("Adding: " + lines[i]);
			database.webdb.addFilter(lines[i]);
		}
	}

	// reset the textarea
	textbox.value = "";
	// redraw all the filters
	redrawFilters();
}

// adds a filter to the table - gets a url from the textarea
database.webdb.addFilter = function(filter) {
	// SQL transaction
	database.webdb.db.transaction(function(tx){
		tx.executeSql('INSERT INTO filters(website) VALUES (?)', 
		[filter],
		database.webdb.onSuccess,
		database.webdb.onError);
	});
}	

// SQL query to get all the filters
database.webdb.getAllFilters = function(renderFunc) {
	database.webdb.db.transaction(function(tx) {
		tx.executeSql('SELECT * FROM filters', [], renderFunc, 
					database.webdb.onError);
	});
}

// Loads all the filters
function loadFilters(tx, rs) {
	var rowOutput = "";
	for (var i=0; i < rs.rows.length; i++) {
		rowOutput += renderFilterTable(rs.rows.item(i));
	}
}

// renders each filter to the selection box
function renderFilterTable(row) {
	var select = document.getElementById('viewFilters');
	
	// the elements
	var op = document.createElement("option");
	op.id = row.ID;
	
	// Filter - website
	op.innerText= row.website;

	// append to the selection box
	select.appendChild(op);
	//log(tr);		
}

// Redraws the list
function redrawFilters() {
	$("#viewFilters option").remove();
	
	// load all the items
	database.webdb.getAllFilters(loadFilters);
	
	// add the extra one
	//addExtra();
}

function addExtra() {
	var select = document.getElementById('viewFilters');
	var op = document.createElement("option");
	op.innerHTML= '<option disabled="true">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</option>';
	select.appendChild(op);
}

// delete selected filters
function deleteSelectedFilters() {
	var myselect=document.getElementById("viewFilters");
	var l = myselect.options.length;
	for (var i=0; i<l; i++){
		if (myselect.options[i].selected){
			// delete the filter
			database.webdb.deleteFilter(myselect.options[i].id);
		
			// delete this one
			myselect.options[i] = null;
		}	
	}
}

// deletes one row from the table given the id
database.webdb.deleteFilter = function(id) {
	database.webdb.db.transaction(function(tx) {
		tx.executeSql('DELETE FROM filters WHERE ID=?', [id],
			database.webdb.onSuccess, database.webdb.onError);
	});
}

// deletes all the filters 
function deleteAllFilters() {
	// ask for confirmation
	var answer = confirm ("Are you sure? Click OK to confirm or CANCEL")
	if (answer){
	}
	else
		return;
	
	// delete everything from the filters table
	database.webdb.db.transaction(function(tx) {
		tx.executeSql('DELETE FROM filters');
	});
	
	// redraw filters
	redrawFilters();
}

/**************************************************

	   FOR TIMED DELETION
	   
***************************************************/
function loadTimedDeletionSettings() {
	// check if it's enabled
	var check = chrome.extension.getBackgroundPage().getItem("deleteCheck");
	
	if (check != null) {
		if (check == "0") {
			document.getElementById("timedDeletionCheck").checked = false;
			
			// disable the timed options
			disableTimingSettings(true);
		}
		else {
			document.getElementById("timedDeletionCheck").checked = true;
			
			// enable the timed options
			disableTimingSettings(false);
		}
		
		// now load the saved time
		var time = parseInt(chrome.extension.getBackgroundPage().getItem("deletionTime"));
		if (time == null || time == 0 || isNaN(time))
			updateTimedValues(0, 0, 0, 0);
		else {
			// get number of months first
			var months = Math.floor(time / 2628000000);
			
			// number of days
			time = time - (months * 2628000000);
			var days = Math.floor(time / 86400000);
			
			// number of hours
			time = time - (days * 86400000);
			var hours = Math.floor(time / 3600000);
			
			// number of minutes
			time = time - (hours * 3600000);
			var minutes = Math.floor(time / 60000);
			
			// update the values
			updateTimedValues(minutes, hours, days, months);	
		}
	}
	
}

// Updates the time settings values
function updateTimedValues(minutes, hours, days, months) {
	document.getElementById("minutes").value = minutes;
	document.getElementById("hours").value = hours;
	document.getElementById("days").value = days;
	document.getElementById("months").value = months;
}

// Disable timing settings
function disableTimingSettings(disable) {
	var children = document.getElementById("timedOptions").childNodes;
	var l = children.length;
	for(i = 0; i < l; i++) {
		var child = children[i];
		child.disabled = disable;
	}
}

// Enables/disables timed deletion
function toggleTimedDeletion() {
	// is it checked?
	var check = document.getElementById("timedDeletionCheck").checked;
	
	// enable/disable all the timed options
	disableTimingSettings(!check);
	
	// enable the local storage id in the background
	var val;
	if (check == true)
		val = 1;
	else 
		val = 0;
		
	chrome.extension.getBackgroundPage().setItem("deleteCheck", val);
}

// Only allows numbers in input fields
// Taken from: http://snippets.dzone.com/posts/show/5223
function numbersonly(e, decimal) {
	var key;
	var keychar;

	if (window.event) {
		key = window.event.keyCode;
	}
	else if (e) {
		key = e.which;
	}
	else {
		return true;
	}
	keychar = String.fromCharCode(key);

	if ((key==null) || (key==0) || (key==8) ||  (key==9) || (key==13) || (key==27) ) {
		return true;
	}
	else if ((("0123456789").indexOf(keychar) > -1)) {
		return true;
	}
	else if (decimal && (keychar == ".")) { 
		return true;
	}
	else
		return false;
}


// Sets the time for the deletion. Checks for errors first
function setTimedDeletion() {
	// get all the values (minutes, days, hours, months)
	var minutes = parseInt(document.getElementById("minutes").value);
	var hours = parseInt(document.getElementById("hours").value);
	var days = parseInt(document.getElementById("days").value);
	var months = parseInt(document.getElementById("months").value);
	
	// null check
	if (isNaN(minutes))
		minutes = 0;
	if (isNaN(hours))
		hours = 0;
	if (isNaN(days))
		days = 0;
	if (isNaN(months))
		months = 0;
	
	// calculate total time (ms). 1000 ms = 1 second
	var totalTime = (( ( months * 30 + days) * 24 + hours) * 60 + minutes) * 60 * 1000;
	
	// Make sure it's not zero
	if (totalTime == 0)
		alert("Please set timed deletion to at least 1 minute");
	else {
		alert("All comments will be deleted in: \n" +
			   minutes + " minute(s), " + hours + " hour(s), " + days + " day(s) and " + months + " month(s).");
		
		// Now set the variables at the backend
		// get the currentTime
		var recordedTime = (new Date()).getTime();
		chrome.extension.getBackgroundPage().setItem("time", recordedTime);
		
		// deletionTime
		chrome.extension.getBackgroundPage().setItem("deletionTime", totalTime);
	}
}

// For manifest v2:
// DOM events should be linked through event handlers - rather annoying.
// December 25th 2012

// on load page
document.addEventListener('DOMContentLoaded', function () {
	// contextMenuCheck
	document.getElementById('contextMenuCheck').addEventListener('click', toggleContextMenus);
	
	// timed deletion check
	document.getElementById('timedDeletionCheck').addEventListener('click', toggleTimedDeletion);
	
	// timed deletion button
	document.getElementById('timeButton').addEventListener('click', setTimedDeletion);
	
	// key press for minutes/hours/etc
	document.getElementById('minutes').addEventListener('keypress', numbersonly);
	document.getElementById('hours').addEventListener('keypress', numbersonly);
	document.getElementById('days').addEventListener('keypress', numbersonly);
	document.getElementById('months').addEventListener('keypress', numbersonly);
	
	// toggle filters
	document.getElementById('filterToggleButton').addEventListener('click', toggleFilters);
	// positive filters
	document.getElementById('positiveFilterCheck').addEventListener('click', togglePositiveFilter);
	// add filters
	document.getElementById('addFiltersButton').addEventListener('click', addFilters);
	// delete filters
	document.getElementById('deleteFiltersButton').addEventListener('click', deleteSelectedFilters);
	document.getElementById('deleteAllFiltersButton').addEventListener('click', deleteAllFilters);
  
	// delete comments
	document.getElementById('deleteCheckedCommentsButton').addEventListener('click', deleteChecked);
	document.getElementById('deleteAllCommentsButton').addEventListener('click', deleteAll);
	
	// select all checkbox
	document.getElementById('selectAllCheckbox').addEventListener('click', selectAll);
  
	// initialize
	start();
});
