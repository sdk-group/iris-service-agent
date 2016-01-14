'use strict'

let emitter = require("global-queue");
let EmployeeApi = require("resource-managment-framework").EmployeeApi;

class Operator {
	constructor() {
		this.emitter = emitter;
	}

	init() {
		this.iris = new EmployeeApi();
		iris.initContent();
	}

	//API
	changeState() {}
	login() {}
	logout() {}
	pause() {}
	resume() {}

	actionInfo({
		user_id: emp_id
	}) {
		return this.iris.getEmployee({
				keys: [emp_id]
			})
			// .then((employee) => {
			//
			// });
	}

	getWorkPlace() {}
	defaultWorkPlace() {}
	getAvailableWorkPlaces() {}
}

module.exports = Operator;