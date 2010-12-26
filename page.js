  
/* Returns the current time */
function getTimestamp() {
	// date
	var currentTime = new Date();
    var month = currentTime.getMonth() + 1;
    var day = currentTime.getDate();
    var year = currentTime.getFullYear();
    var date = month + "/" + day + "/" + year;

	// time
	var hours = currentTime.getHours()
    var minutes = currentTime.getMinutes()
    if (minutes < 10){
      minutes = "0" + minutes
    }
    var time = hours + ":" + minutes;
	
	// return timestamp
	return date + ", " + time;
}
  
// id set or not?
var idSet = 0;
var idReset = false;

// id # in case one is not assigned to the textarea
var id = 1;
// Open the port to the extension
var port = chrome.extension.connect({name: "comment"});

// function tries to extract a reasonable title from the Disqus URL
function getDisqusTitle(url) {
	// first split it based on slashes
	try {
		var splits = url.split('/');
		// before disqus.com
		var website = splits[2].split('.')[0];
		//alert("Splits[1] : " + splits[2]);
		// the page thread
		var thread = splits[4];
		// replace all '_' with spaces
		var t2 = thread.replace("_", " ");
		//alert("First: " + splits[0] + "\n" + splits[1] + "\n" + splits[2] + "\n" + splits[3]);
		
		var title = website + " - " + t2;
		return title;
		
	} catch (e) {
		// do nothing for now
		return "Disqus comment";
	}

}


// response function for getting an id

// Instead of using onload, use JQuery:
$(document).ready(function(){
	

	// attach function to all textareas
	$("textarea").live('keyup', function(event) {
	    //alert("TABINDEX: " + this.tabIndex);
		// iframe test - FOR DISQUS
		var iTitle = document.title;
		var theURL = document.URL; 
	
		try {
			if (window != window.top) {
				if (location.hostname.indexOf('.disqus.com') != -1) { // disqus comment check
					iTitle = getDisqusTitle(theURL);//"Disqus Comment";
				
					//alert("theURL: " + theURL + "\nParent: " + parent );
				}
				else {
					iTitle = "Other Comment";
				}
			}
		}
		catch (e) {
			alert("ERROR: " + e);
		}
	
		// DON'T CHANGE THE NAME
		var idSet = 0;
		
		// try to parse the id into an int
		var intId = parseInt(this.tabIndex);
		if (intId != 0) { // 0 is the default value for tab index on most sites
			idSet = 1;
		}
		
		// which key was pressed?
		var characterCode = event.charCode;
    	if (characterCode == undefined) {
    		characterCode = event.keyCode;
    	}
		
		var actualkey=String.fromCharCode(characterCode);

    	// get the id - if it already exists good otherwise give it one 

		// GET ID from local storage
		var requestedID;
		
		// request new id if value was empty [and didnt use backspace or delete]
		//alert("Length: " + this.value.length);
		if (this.value.length == 1 && (event.keyCode != 8) && (event.keyCode != 46)) {
			//alert("Getting new id");
			idSet = 0;
		}
		
		var theTextbox = this;
		
		// request id from background.html if not already set
		if (idSet == 0) {
			chrome.extension.sendRequest({idRequest: "id"}, function(response) {
  				requestedID = response.theId;
				//alert("requestedID: " + requestedID);
				idSet = 1;
				//theTextbox.name = "idSet1";
				theTextbox.tabIndex = requestedID;
			});
		}
		
		if (requestedID && idSet == 1) {
			this.tabIndex = requestedID;
		}
		else if (idSet == 0)
			return;
	
		// actual value:
		var val = this.value + actualkey;
		//alert("Value: " + value + ", val: " + val);
	
		// get the timestamp
		var timestamp = getTimestamp();
		
		// get the title
		/*var title1 = document.title;
		if (title1 == "") {
			alert("ALERT!! Parent: " + parent);
			title1 = parent.document.title;
		}
		// if title does not exist, try getting hte parent's title
		//if (!title1)
		//	title1 = parent.document.title;
		
		alert("Title: " + title1);*/
		
		// send the message if there is something to send
		if (val == '')
			return;
		try {
			port.postMessage({id: this.tabIndex, text: val, title: iTitle, url: theURL, time: timestamp});
		} catch(e) {
			alert("There was an error: " + e);
		}
	});
   
   
	// attach function to all iframes
	/*$("iframe").("textarea").live('keyup', function(event) {
		alert("In the second one!!");
	
		// DON'T CHANGE THE NAME
		var idSet = 0;
		
		// try to parse the id into an int
		var intId = parseInt(this.id);
		if (isNaN(intId) && this.id) { // FOR SITES LIKE GOOGLE TRANSLATE 
			return;
		}
		else {
			//alert("IntID is: " + intId);
			idSet = 1;
		}
		
		// which key was pressed?
		var characterCode = event.charCode;
    	if (characterCode == undefined) {
    		characterCode = event.keyCode;
    	}
		
		//alert('Value on ' + event.type + ': ' + ' KeyCode: ' + event.keyCode);
		
		var actualkey=String.fromCharCode(characterCode);
   		//alert("Key pressed is: " + actualkey);

    	// get the id - if it already exists good otherwise give it one 

		// GET ID from local storage
		var requestedID;
		
		// request new id if value was empty [and didnt use backspace or delete]
		//alert("Length: " + this.value.length);
		if (this.value.length == 1 && (event.keyCode != 8) && (event.keyCode != 46)) {
			//alert("Getting new id");
			idSet = 0;
		}
		
		var theTextbox = this;
		
		// request id from background.html if not already set
		if (idSet == 0) {
			chrome.extension.sendRequest({idRequest: "id"}, function(response) {
  				requestedID = response.theId;
				//alert("requestedID: " + requestedID);
				idSet = 1;
				//theTextbox.name = "idSet1";
				theTextbox.id = requestedID;
			});
		}
		
		if (requestedID && idSet == 1) {
			this.id = requestedID;
		}
		else if (idSet == 0)
			return;
	
		// actual value:
		var val = this.value + actualkey;
		//alert("Value: " + value + ", val: " + val);
	
		// get the timestamp
		var timestamp = getTimestamp();
		
		// get the title
		/*var title1 = document.title;
		if (title1 == "") {
			alert("ALERT!! Parent: " + parent);
			title1 = parent.document.title;
		}
		// if title does not exist, try getting hte parent's title
		//if (!title1)
		//	title1 = parent.document.title;
		
		alert("Title: " + title1);
		
		// send the message if there is something to send
		if (val == '')
			return;
		try {
			port.postMessage({id: this.id, text: val, title: iTitle, url: document.URL, time: timestamp});
		} catch(e) {
			alert("There was an error: " + e);
		}
	});*/
 });
