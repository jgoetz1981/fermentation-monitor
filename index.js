var Bleacon = require('bleacon');
var mongoose = require('mongoose');

const Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

const TiltReadingSchema = new Schema({
 device: String,
 temperature: String,
 gravity: String,
 timestamp: Date
});

const SensorSettingsSchema = new Schema({
    device: String,
    enabled: Boolean
});

sensorSettingObj = {};

// Identifies the TILT Hydrometer available
tilt = {
    "a495bb10c5b14b44b5121370f02d74de": "Red",
    "a495bb20c5b14b44b5121370f02d74de": "Green",
    "a495bb30c5b14b44b5121370f02d74de": "Black",
    "a495bb40c5b14b44b5121370f02d74de": "Purple",
    "a495bb50c5b14b44b5121370f02d74de": "Orange",
    "a495bb60c5b14b44b5121370f02d74de": "Blue",
    "a495bb70c5b14b44b5121370f02d74de": "Pink"
};

mongoose.connect('mongodb://localhost/brewtracker2');
const TiltReading = mongoose.model('TiltReading', TiltReadingSchema);
const SensorSetting = mongoose.model('SensorSetting', SensorSettingsSchema);

buildPayload = (bleacon) => {
    let tiltName = tilt[bleacon.uuid];
    if(sensorSettingObj[tiltName].enabled) {
        var deviceLabel = tiltName + '-' + bleacon.uuid; // Assigns the device label based on the TILT identified
        bleacon.timeStamp = Date.now(); // Set the actual timestamp

        // Build the payload by default
        var payload = {
            "uuid": deviceLabel,
            "temperature":{ "value": bleacon.major, "timestamp": bleacon.timeStamp },
            "gravity": { "value": bleacon.minor/1000, "timestamp": bleacon.timeStamp },
            "rssi": { "value": bleacon.rssi, "timestamp": bleacon.timeStamp }
        };
        var toWrite = new TiltReading();
        toWrite.device = tiltName;
        toWrite.temperature = bleacon.major;
        toWrite.gravity = bleacon.minor/1000;
        toWrite.timestamp = new Date();
        toWrite.save();
        console.log('saving data');
    } else {
        console.log('device: ' + tiltName + ' is not enabled in mongo');
    }
    return payload;
}


function init() {
    SensorSetting.find({}).then((results) => {
        results.forEach((obj) => {
            let toAdd = {};
            toAdd.enabled = obj.enabled;
            sensorSettingObj[obj.device] = toAdd;
        });
    });
    Bleacon.on('discover', function (bleacon) {
        if (tilt[bleacon.uuid] != null) {
            console.log(buildPayload(bleacon));

        }
    });

    Bleacon.startScanning();
}

init();