#!/usr/bin/env node
var path = require("path");
var fs = require('fs');
var { exec } = require('child_process');
var FormData = require('form-data');
var http = require('http');

// Put your API keys, endpoints, and shortnames here.
// DON'T COMMIT THESE CREDENTIALS!
var apiKeys = ["API_KEY_1_HERE", "API_KEY_2_HERE"];
var apiEndpoints = ["API_ENDPOINT_1_HERE", "API_ENDPOINT_2_HERE"];
var shortNames = ["SHORTNAME1", "SHORTNAME2"];

// We use the number of API keys in this counter variable to detect when all of the endpoints have been fed
var waitForUploadCompleteCounter = apiKeys.length;

// Parse out the file name so we can get our JSON metadata to read, and so we can create/delete the compressed file
var inputFile = process.argv[2];
var baseName = path.parse(inputFile).dir + "/" + path.parse(inputFile).name;
var outputFile = baseName + ".m4a";

console.log("Encoding:", inputFile);
// Encode the audio file the lazy way, by running exec
var encodeProcess = exec("sox " + inputFile + " -t wav - --norm=-3 | fdkaac --silent --ignorelength -b 8000 -o " + outputFile + " -", function(e,out,stderr) {
  // we have the encoded file now, I should probably check for an error, but i'm not bothering at the moment because i'm lazy
  // upload the file and metadata to each of the endpoints listed above
  for (var i = 0; i < apiKeys.length; i++) {
    uploadToServer(baseName, apiEndpoints[i], apiKeys[i], shortNames[i]);
  }

  // now we wait for the uploads to finish, then delete the new compressed file.
  waitForUploadFinishThenDelete();  
})

// This function creates a multipart-form and POSTs it to the trunk-server instance
function uploadToServer(inBaseName, endpoint, key, name) {
  var jsonData = JSON.parse(fs.readFileSync(inBaseName + '.json'));
  var form = new FormData();
  form.append('call', fs.createReadStream(inBaseName+".m4a"), {contentType:'application/octet-stream'});
  form.append('freq', jsonData.freq);
  form.append('start_time', jsonData.start_time);
  form.append('stop_time', jsonData.stop_time);
  form.append('call_length', jsonData.stop_time - jsonData.start_time);
  form.append('talkgroup_num', jsonData.talkgroup);
  form.append('emergency', jsonData.emergency);
  form.append('api_key', key);
  form.append('source_list', JSON.stringify(jsonData.srcList));
  form.append('freq_list', JSON.stringify(jsonData.freqList));
  form.submit(endpoint + "/" + name + "/upload", function(err, res) {
    console.log(res.statusCode, err);
    // with each completed upload, we decrement this counter to detect when everything has finished uploading
    // I know it's the lazy way, but I'm feeling pretty lazy right now
    // Be glad you're even getting comments...
    waitForUploadCompleteCounter--;
  });
}

// Who needs all those fancy Promise things when you've got stupid stuff like this...
function waitForUploadFinishThenDelete() {
  if (waitForUploadCompleteCounter > 0) {
    // if we are still waiting on one or more uploads to finish, wait 100ms and try again
    setTimeout(waitForUploadFinishThenDelete, 100);
    return;
  }
  // delete the compressed file
  // if you want to keep all the files, comment this out
  fs.unlinkSync(outputFile);

  // if you want to delete the original, uncompressed file, uncomment this
  // fs.unlinkSync(inputFile);

  // if you also want to delete the json metadata file, uncomment this
  // fs.unlinkSync(baseName + ".json");
}