'use strict'

let emitter = require("global-queue");
let EmployeeApi = require("resource-managment-framework").EmployeeApi;

class Operator {
	constructor() {
		this.emitter = emitter;
	}

	init() {
		this.iris = new EmployeeApi();
		this.iris.initContent();
	}

	//API
	actionChangeState() {}
	actionLogin() {}
	actionLogout() {}
	actionPause() {}
	actionResume() {}

	actionInfo({
		user_id: emp_id
	}) {
		return this.iris.getEmployee({
				keys: [emp_id]
			})
			.then((employee) => {
				console.log("EMPLOYEE", require('util').inspect(employee, {
					depth: null
				}));
			});
	}

	actionGetWorkPlace() {}
	actionDefaultWorkPlace() {}
	actionGetAvailableWorkPlaces() {}
}

module.exports = Operator;