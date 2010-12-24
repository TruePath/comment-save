  
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


// response function for getting an id

// Instead of using onload, use JQuery:
$(document).ready(function(){
   // attach function to all textareas
   $("textarea").live('keyup', function(event) {
  		//alert('Event: ' + event);
		
		// DON'T CHANGE THE NAME
		var idSet = 0;
		
		// test
		//alert("ID: " + this.id);
		
		/*if (this.name != "idSet1")
			this.name = "idSet0";*/
		
		// GOOGLE TRANSLATOR CHECK!
		/*if (this.id) {
			alert("ID IS: " + this.id);
			//return;
		}*/
		
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
		//alert("Value: " + value + ", val: " + val);
	
		// get the timestamp
		var timestamp = getTimestamp();
	
		// get the title
		var title1 = document.title;
		
		// send the message if there is something to send
		if (val == '')
			return;
		try {
			port.postMessage({id: this.id, text: val, title: title1, url: document.URL, time: timestamp});
		} catch(e) {
			alert("There was an error: " + e);
		}
	});
   
 });
