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
    /*if (minutes < 10){
      minutes = "0" + minutes
    }*/
    var time = hours + ":" + minutes;
	
	// return timestamp
	return date + "," + time;
}
  
  
function sendMessage(){
    // get the id - if it already exists good otherwise give it one 
    if (!this.id) {
	    newId = "newID" + id++;
		this.id = newId;
		//alert("New ID: " + this.id);
	}
	else {
	    newId = this.id;
		//alert("New ID " + newId);
	}
	
	// get the timestamp
	var timestamp = getTimestamp();
	//alert("Timestamp: " + timestamp + ", Title: " + document.title);
	
	// post the message
    //port.postMessage({id: newId}), {title: document.tile}, {url: document.URL}, {time: timestamp}, {text: this.value});
	
	var title1 = document.title;
	try {
		port.postMessage({id: newId, text: this.value, title: title1, url: document.URL, time: timestamp});
	} catch(e) {
		alert("There was an error: " + e);
	}
	
}

// called when document is loaded - TODO: Should use JQuery instead
function begin()
{  
   var textareas = document.getElementsByTagName('textarea');  
   var len = textareas.length;
   //alert("Length is: " + len);
   var i;  
   for(i = 0; i < len; i++) {    
        textareas[i].onkeydown = sendMessage; 
   }
}

// id # in case one is not assigned to the textarea
var id = 1;
// Open the port to the extension
var port = chrome.extension.connect({name: "comment"});
// onload function
window.onload = begin;
