/**
 * Devices manager, manage all the configurated devices in project
 */

'use strict';
var Device = require('./device');

var activeDevices = {};             // Actives Devices list
var runtime;                        // Access to application resource like logger/settings
var wokingStatus;                   // Current status (start/stop) to know if is working

/**
 * Init by set the access to application resource
 * @param {*} _runtime 
 */
function init(_runtime) {
    runtime = _runtime;
}

/**
 * Load and start all Devices actives
 */
function start() {
    wokingStatus = 'starting';
    devices.load();
    return new Promise(function (resolve, reject) {
        // runtime.logger.info('devices.start-all (' + Object.keys(activeDevices).length + ')', true);
        for (var id in activeDevices) {
            activeDevices[id].start();
        }
        resolve();
        wokingStatus = null;
    });
}

/**
 * Stop all Devices
 */
function stop() {
    wokingStatus = 'stopping';
    return new Promise(function (resolve, reject) {
        // runtime.logger.info('devices.stop-all (' + Object.keys(activeDevices).length + ')');
        var deviceStopfnc = [];
        for (var id in activeDevices) {
            deviceStopfnc.push(activeDevices[id].stop());
        }
        return Promise.all(deviceStopfnc).then(values => {
            resolve(true);
            wokingStatus = null;
        }, reason => {
            runtime.logger.error('devices.stop-all: ' + reason);
            resolve(reason);
            wokingStatus = null;
        });
    });
}

/**
 * Update all by restart all devices
 */
function update() {
    devices.stop().then(function () {
        devices.start().then(function () {

        }).catch(function (err) {
            runtime.logger.error('devices.update-start: ' + err);
        });
    }).catch(function (err) {
        runtime.logger.error('devices.ipdate-stop: ' + err);
    });
}

/**
 * Update the device, load and restart it
 * @param {*} device 
 */
function updateDevice(device) {
    if (!activeDevices[device.id]) {
        if (devices.loadDevice(device) && device.enabled) {
            activeDevices[device.id].start();
        }
    } else {
        activeDevices[device.id].stop().then(function () {
            devices.loadDevice(device);
            if (device.enabled) {
                activeDevices[device.id].start();
            } else {
                delete activeDevices[device.id];
            }
        }).catch(function (err) {
            runtime.logger.error('devices.update-device ' + device.name + ': ' + err);
        });
    }
}

/**
 * Remove the device, stop it if active and remove from actieDevices list
 * @param {*} device 
 */
function removeDevice(device) {
    if (!activeDevices[device.id]) {
        delete activeDevices[device.id];
    } else {
        activeDevices[device.id].stop().then(function () {
            delete activeDevices[device.id];
        }).catch(function (err) {
            delete activeDevices[device.id];
            runtime.logger.error('devices.remove-device by stop ' + device.name + ': ' + err);
        });
    }
}

/**
 * Load the device from project and add or remove of active device for the management 
 */
function load() {
    var tempdevices = runtime.project.getDevices();
    activeDevices = {};
    runtime.daqStorage.reset();
    // check existing or to add new 
    for (var id in tempdevices) {
        if (tempdevices[id].enabled) {
            devices.loadDevice(tempdevices[id]);
        }
    }
    // log remove device not used
    for (var id in activeDevices) {
        if (Object.keys(tempdevices).indexOf(id) < 0) {
            runtime.logger.info(`devices.load-removed: '${activeDevices[id].name}'`, true);
        }
    }
}

/**
 * Load the device to manage and set on depending of settings 
 * @param {*} device 
 */
function loadDevice(device) {
    if (activeDevices[device.id]) {
        // device exist
        runtime.logger.info(`'${device.name}' exist`, true);
        activeDevices[device.id].load(device);
    } else {
        // device create
        let tdev = Device.create(device, runtime);
        if (tdev && tdev.start) {
            runtime.logger.info(`'${device.name}' created`);
            activeDevices[device.id] = tdev;
            activeDevices[device.id].bindGetProperty(runtime.project.getDeviceProperty);
        } else {
            if (!Device.isInternal(device)) {
                runtime.logger.warn('try to create ' + device.name + ' but plugin is missing!');
            }
            return false;
        }
    }
    if (runtime.settings.daqEnabled) {
        var fncToSaveDaqValue = runtime.daqStorage.addDaqNode(device.id, activeDevices[device.id].getTagProperty);
        activeDevices[device.id].bindSaveDaqValue(fncToSaveDaqValue);
    }
    return true;
}

/**
 * Return all devices status 
 */
function getDevicesStatus() {
    var adev = {};
    for (var id in activeDevices) {
        adev[id] = activeDevices[id].getStatus();
    }
    return adev;
}

/**
 * Return all devices values
 */
function getDevicesValues() {
    var adev = {};
    for (var id in activeDevices) {
        adev[id] = activeDevices[id].getValues();
    }
    return adev;
}


/**
 * Get the Device Tag value
 * used from Alarms
 * @param {*} deviceid 
 * @param {*} sigid 
 * @param {*} value 
 */
function getDeviceValue(deviceid, sigid) {
    if (activeDevices[deviceid]) {
        return activeDevices[deviceid].getValue(sigid);
    }
    return null;
}

/**
 * Get the Device Tag value
 * used from Alarms
 * @param {*} sigid 
 * @param {*} fully, struct with timestamp
 */
 function getTagValue(sigid, fully) {
     try {
        let deviceid = getDeviceIdFromTag(sigid)
        if (activeDevices[deviceid]) {
            let result = activeDevices[deviceid].getValue(sigid);
            if (fully) {
                return result;
            } else {
                return result.value;
            }
        }
    } catch (err) {
        console.error(err);
    }
    return null;
}

/**
 * Set the Device Tag value
 * used from Scripts
 * @param {*} tagid 
 * @param {*} value 
 */
 function setTagValue(tagid, value) {
    try {
        let deviceid = getDeviceIdFromTag(tagid)
        if (activeDevices[deviceid]) {
            return activeDevices[deviceid].setValue(tagid, value);
        }
    } catch (err) {
        console.error(err);
    }
    return null;
}

/**
 * Get the Device from the tag id
 * used from Alarms
 * @param {*} sigid 
 */
 function getDeviceIdFromTag(sigid) {
    for (var id in activeDevices) {
        var tag = activeDevices[id].getTagProperty(sigid);
        if (tag) {
            return id;
        }
    }
    return null;
}

/**
 * Return if manager is working (started or stopped)
 */
function isWoking() {
    return (wokingStatus) ? true : false;
}

/**
 * Set the Device Tag value
 * @param {*} deviceid 
 * @param {*} sigid 
 * @param {*} value 
 */
function setDeviceValue(deviceid, sigid, value, fnc) {
    if (activeDevices[deviceid]) {
        activeDevices[deviceid].setValue(sigid, value, fnc);
    }
}

/**
 * Return the Device browser result Tags/Nodes
 * @param {*} deviceid 
 * @param {*} node 
 */
function browseDevice(deviceid, node, callback) {
    return new Promise(function (resolve, reject) {
        if (activeDevices[deviceid] && activeDevices[deviceid].browse) {
            activeDevices[deviceid].browse(node, callback).then(function (result) {
                resolve(result);
            }).catch(function (err) {
                reject(err);
            });
        } else {
            reject('Device not found!');
        }
    });
}

/**
 * Return Device Tag/Node attribute
 * @param {*} deviceid 
 * @param {*} node 
 */
function readNodeAttribute(deviceid, node) {
    return new Promise(function (resolve, reject) {
        if (activeDevices[deviceid] && activeDevices[deviceid].readNodeAttribute) {
            activeDevices[deviceid].readNodeAttribute(node).then(function (result) {
                resolve(result);
            }).catch(function (err) {
                reject(err);
            });
        } else {
            reject('Device not found!');
        }
    });
}

/**
 * Return the property (security mode) supported from device
 * @param {*} endpoint 
 * @param {*} type 
 */
function getSupportedProperty(endpoint, type) {
    return Device.getSupportedProperty(endpoint, type);
}

/**
 * Return result of request
 * @param {*} property 
 */
function getRequestResult(property) {
    return Device.getRequestResult(property);
}

var devices = module.exports = {
    init: init,
    start: start,
    stop: stop,
    load: load,
    loadDevice: loadDevice,
    update: update,
    updateDevice: updateDevice,
    removeDevice: removeDevice,
    getDevicesStatus: getDevicesStatus,
    getDevicesValues: getDevicesValues,
    getDeviceValue: getDeviceValue,
    getTagValue: getTagValue,
    setTagValue: setTagValue,
    setDeviceValue: setDeviceValue,
    getDeviceIdFromTag: getDeviceIdFromTag,
    browseDevice: browseDevice,
    readNodeAttribute: readNodeAttribute,
    isWoking: isWoking,
    getSupportedProperty: getSupportedProperty,
    getRequestResult: getRequestResult
}
