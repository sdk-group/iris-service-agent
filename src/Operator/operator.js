'use strict'

let emitter = require("global-queue");
let IrisWorkflow = require('resource-managment-framework').IrisWorkflow;

class Operator {
	constructor() {
		this.emitter = emitter;
	}

	init(config) {
		let bname = config.bucket;
		this.iris = new IrisWorkflow();
		this.iris.init(bname);
	}

	//API
	changeState() {}
	login() {}
	logout() {}
	pause() {}
	resume() {}
	getInfo() {}
	getWorkPlace() {}
	defaultWorkPlace() {}
	getAvailableWorkPlaces() {}
}

module.exports = Operator;