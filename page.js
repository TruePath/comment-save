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
	return date + ", " + time;
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


// response function for getting an id

// Instead of using onload, use JQuery:
$(document).ready(function(){
   // attach function to all textareas
   $("textarea").live('keyup', function(event) {
  		//alert('Event: ' + event);
		
		// DON'T CHANGE THE NAME
		var idSet = 0;
		/*if (this.name != "idSet1")
			this.name = "idSet0";*/
		
		// try to parse the id into an int
		var intId = parseInt(this.id);
		//alert("Id is: " + intId);
		if (intId)
			idSet = 1;
		
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
				//alert("This + id: " + this.name + ", " + this.id);
			});
		}
		
		//alert("Requested ID2: " + requestedID);
		//alert("This + id: " + this.name + ", " + this.id);
		
		if (requestedID && idSet == 1) {
			this.id = requestedID;
		}
		else if (idSet == 0)
			return;
	
		// actual value:
		var val = this.value + actualkey;
	
		// get the timestamp
		var timestamp = getTimestamp();
		//alert("Timestamp: " + timestamp + ", Title: " + document.title);
	
		// get the title
		var title1 = document.title;
		
		//alert("Sending id: " + this.id);
		
		// send the message if there is something to send
		if (val == '')
			return;
			
		try {
			port.postMessage({id: this.id, text: val, title: title1, url: document.URL, time: timestamp});
		} catch(e) {
			alert("There was an error: " + e);
		}
	});
   
   
   //alert('Ran ready');
 });
