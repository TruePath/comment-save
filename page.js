/**
  TODO:
  -Use JQuery instead of onload
  -Read through all textareas, attach onchange listener to them
  -Post message consisting of:
        * Page Title
		* Date
		* URL
		* TextArea value
*/

/*chrome.extension.onConnect.addListener(function(port) {
  port.onMessage.addListener(function(msg) {
    port.postMessage({counter: msg.counter+1});
  });
});

// goes into background.html?
chrome.extension.onRequest.addListener(
  function(request, sender, sendResponse) {
    sendResponse({counter: request.counter+1});
  });*/
  
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
	return date + "," + time;
}
  
// id set or not?
var idSet = 0;
var idReset = false;
  
function sendMessage(event){
	alert('Event: ' + event);

	// which key was pressed?
	var characterCode = event.charCode;
	alert(event.charCode);
    if (characterCode == undefined) {
    	characterCode = event.keyCode;
    	}
    alert("The Unicode character code is: " + characterCode);

    // get the id - if it already exists good otherwise give it one 
	
	// TODO: Assign a new ID from local storage.
	
	// new ID: involves URL + 
	if (this.value == '') { // assign new id if textbox is empty 
		newId = "newID" + id++ + document.URL;
		idSet = 0;
	}
	//newId = "newID" + id++ + document.URL;
	if (idSet == 0) {
		this.id = newId;
		idSet = 1;		
	}
	
	// get the timestamp
	var timestamp = getTimestamp();
	//alert("Timestamp: " + timestamp + ", Title: " + document.title);
	
	// post the message
    //port.postMessage({id: newId}), {title: document.tile}, {url: document.URL}, {time: timestamp}, {text: this.value});
	
	var title1 = document.title;
	try {
		port.postMessage({id: this.id, text: this.value, title: title1, url: document.URL, time: timestamp});
	} catch(e) {
		alert("There was an error: " + e);
	}
	
}

// called when document is loaded - TODO: Should use JQuery instead
/*function begin()
{  
   var textareas = document.getElementsByTagName('textarea');  
   var len = textareas.length;
   //alert("Length is: " + len);
   var i;  
   for(i = 0; i < len; i++) {    
        textareas[i].onkeydown = sendMessage; 
   }
}*/

// id # in case one is not assigned to the textarea
var id = 1;
// Open the port to the extension
var port = chrome.extension.connect({name: "comment"});


// onload function
//window.onload = begin;

// Instead of using onload, use JQuery:
$(document).ready(function(){
   // attach function to all textareas
   $("textarea").live('keypress', function(event) {
  		//alert('Event: ' + event);

		// which key was pressed?
		var characterCode = event.charCode;
    	if (characterCode == undefined) {
    		characterCode = event.keyCode;
    	}
		var actualkey=String.fromCharCode(characterCode);
   		//alert("Key pressed is: " + actualkey);

    	// get the id - if it already exists good otherwise give it one 

		// GET ID from local storage
		var requestedID;
		
		// request new id if value was empty
		if (this.value == '') {
			idSet = 0;
		}
		
		// request id from background.html if not already set
		if (idSet == 0) {
			chrome.extension.sendRequest({idRequest: "id"}, function(response) {
  				requestedID = response.theId;
				alert("requestedID: " + requestedID);
				idSet = 1;
				this.id = requestedID;
				alert("This id: " + this.id);
			});
		}
		
		// new ID: involves URL  = "newID" + id++ + document.URL;
		/*if (this.value == '' || idSet == 0) { // assign new id if textbox is empty 
			this.id = "newID" + id++ + document.URL;
			idSet = 1;
		}*/
	
		//if (requestedID) {
			
		//}
	
		// actual value:
		var val = this.value + actualkey;
	
		// get the timestamp
		var timestamp = getTimestamp();
		//alert("Timestamp: " + timestamp + ", Title: " + document.title);
	
		// get the title
		var title1 = document.title;
		
		alert("Sending id: " + this.id);
		
		// send the message
		try {
			port.postMessage({id: this.id, text: val, title: title1, url: document.URL, time: timestamp});
		} catch(e) {
			alert("There was an error: " + e);
		}
	});
   
   
   //alert('Ran ready');
 });
