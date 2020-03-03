
let theColor ='#FF0038'
let theBackgroundColor = "#008cff"
let strokeWidth = 4
let cv, buffer, backgroundBuffer

var w, h
var yDiff = 180
var xDiff = 240
var rSlider, colorPicker
let inp1, inp2
let data = []
let events = []

function initAPI(){
	//var params = getURLParams();
	//var id = params.id 
	//print(getURLParams())
    var url = window.location.origin + "/api?id="+ id
	var postData = {'id':Number(id)}

	print("Loading...", id)
	httpPost(url, 'json', postData, function(result) {
		console.log(result.status, result.name)
		data = result //Update the global...
		events = result.events


		var i = 0
		//print(events)
		for (var s in events){
			var event = events[s]
			
			if (event){
				//print(typeof event['value'],event)
				var value =  event['value']
				var type = event['type']

				if (type == 'stroke'){
					value = "'" + value + "'"
				}else if (type == 'strokeWeight'){
					value = str(value)
				}
				else if (type == 'line'){
					value = str(value) /// EXPANDING LIST ITEMS
				}
				com = "buffer." + event['type'] + "(" +   value   +")" 
				
				print(com)
				eval(  com   )
			}
		}
	  });
}



function apiPutData(){
	//var params = getURLParams();
	//var id = params.id ;//already added via template
	var url = window.location.origin + "/api_put?id=" + id	
	console.log(url)
	id = int(id)

	var canvas = $('canvas')[0];
	var img = canvas.toDataURL('image/png').replace(/data:image\/png;base64,/, '');
 
		// make names  eg "img_1.png", "img_2.png"......etc"
	var iname = 'img_' + id + '.png'; 


	var postData = {'id':id, "kind":"data",'events': data.events,img:img}
	httpPost(url, 'json', postData, function(result) {
		console.log(result)
		window.location.replace("/");
	  });
   
}

function changeColor(c){
    theColor = c
    buffer.stroke(c)
}

function setPaintColor(){//called from interface
    var c = this.value()
    changeColor(c)
    print("color", c)
    var event = {
		type:"stroke",
		value: c
	}
	data.events.push(event )
}
function setBgColor() {

	print("bg:"+ this.value() )
	theBackgroundColor = this.value()
	backgroundBuffer.background( theBackgroundColor )
	sendBG(theBackgroundColor)

}
function sendBG(c){
		
}


function mouseReleased(){
	
    strokeWidth = rSlider.value();
    var event = {
		type:"strokeWeight",
		value: strokeWidth
    }
    buffer.strokeWeight(strokeWidth)
    print("strokeWeight", strokeWidth)
    print("Released", data.events.length)
	data.events.push(event )
    
}
function mouseDragged() {

	buffer.line(mouseX- xDiff, mouseY, pmouseX-xDiff, pmouseY)

	// Send the mouse coordinates
	var event = {
		type:"line",
		value:[mouseX-xDiff, mouseY, pmouseX-xDiff, pmouseY]
	}
	data.events.push(event )

}







////////////////////////////////////// SET UP //////////////////////////////

function setup() {
    
	calculateCanvasSize()

	buffer = createGraphics(w,h)
	buffer.angleMode(DEGREES)
	backgroundBuffer = createGraphics(w,h)
	backgroundBuffer.background( theBackgroundColor )

	cv = createCanvas(w + xDiff, h )
	centerCanvas()
	cv.background('lightgray')
	cv.drop(gotFile);

	 inp1 = createColorPicker('#ff0082');
	 inp1.position(80, 80)
	 inp1.input(setPaintColor);

     inp2 = createColorPicker('#008cff');
	 inp2.position(80, 120)
	 inp2.input(setBgColor);


     //setMidShade();

	rSlider = createSlider(4, 80, 4);
    rSlider.position(80, yDiff);

    input = createFileInput(gotFile);
    input.position(80, yDiff + 60);


	button = createButton('Download Image');
	button.position(80, yDiff + 200);
	button.mousePressed(download);

	button2 = createButton('Save Image');
	button2.position(80, yDiff + 260);
	button2.mousePressed(saveThisImage);

	//apiPutCommand("stroke", "#FF0037")
	//apiPutCommand("strokeWeight", 20)
	initAPI();//gets the data

}

function draw(){
	background('lightgray')
    noStroke()

    // Slider tool representation
    fill(theColor)
    ellipse(xDiff, yDiff, strokeWidth, strokeWidth)

   image(backgroundBuffer, xDiff, 0)
   image(buffer, xDiff, 0)
}


function saveThisImage(){
	apiPutData()
   
}
function download(){
	var outputBuffer = createGraphics(buffer.width, buffer.height)
	//var img = createImage(buffer.width, buffer.height);
	var img = get(xDiff, 0, buffer.width, buffer.height)
	outputBuffer.image(img, 0, 0, buffer.width, buffer.height)

	saveCanvas(outputBuffer,  "redblue", "jpg" )
}


function windowResized() {
	centerCanvas()
//	cv.resizeCanvas(windowWidth / 2, windowHeight / 2)
}


function centerCanvas() {
	const x = (windowWidth - width) / 2
	const y = (windowHeight - height) / 2
	cv.position(x, y)
}








function gotFile(file) {
  print(file)
  raw = new Image();
  raw.src = file.data

  raw.onload = function() {

		var maxWidth = w
          var maxHeight = h
          var width = raw.width
          var height = raw.height

          if(width>height){
            if(width > maxWidth){
              ratio = maxWidth / width;   // get ratio for scaling image
              var newHeight = height * ratio;  // Scale height based on ratio
              var newWidth = width * ratio;    // Reset width to match scaled image
            }
          }else{
            // Check if current height is larger than max
            if(height > maxHeight){
              ratio = maxHeight / height; // get ratio for scaling image
                var newWidth =width * ratio;    // Reset width to match scaled image
              var newHeight =height * ratio;    // Reset height to match scaled image
            }
            //End Do Image
          }

    img = createImage(newWidth, newHeight);

    //blendMode(DARKEST)
	backgroundBuffer.imageMode(CENTER)
    var newY = (h-newHeight)/2
    backgroundBuffer.drawingContext.drawImage(raw, w/2 - newWidth/2, newY, newWidth, newHeight); //what does this do? If I don't do it, stuff doesn't work?
    backgroundBuffer.translate(0, 0)
    //NOTE! Without the following line img doesn't work? But does/can draw to screen...
    img = backgroundBuffer.get() //does this *force* it to be p5.Image... dunno?
    //does drawing to canvas somehow make the img kosher?

    

    print(img, img.width, img.height) //this seems to be a good measure of whether
    //or not the image has loaded...

    drawOnce = true

	  removeButton = createButton('Remove Image');
	  removeButton.position(80, yDiff + 100);
	  removeButton.mousePressed(removeBGImage);
  }


}

function removeBGImage(){
	backgroundBuffer.background(theBackgroundColor)
}

function calculateCanvasSize(){
	h = window.innerHeight * 0.95 //scale it down a bit
	w = h * 1.414
}

function setMidShade() {
	// Finding a shade between the two
  //  let commonShade = lerpColor(inp1.color(), inp2.color(), 0.5);
	//fill(commonShade);
  //  rect(20, 20, 60, 60);
  }
