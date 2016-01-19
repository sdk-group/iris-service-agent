'use strict'

let emitter = require("global-queue");
let AgentApi = require("resource-management-framework").AgentApi;

class Operator {
	constructor() {
		this.emitter = emitter;
	}

	init() {
		this.iris = new AgentApi();
		this.iris.initContent();
	}

	//API
	actionChangeState({
		user_id: emp_id,
		state: state
	}) {
		return this.iris.setEmployeeField({
			keys: [emp_id]
		}, {
			state: state
		});
	}

	actionLogin({
		user_id
	}) {
		return this.actionChangeState({
			user_id, state: 'active'
		});
	}

	actionLogout({
		user_id
	}) {
		return this.actionChangeState({
			user_id, state: 'inactive'
		});
	}

	actionPause({
		user_id
	}) {
		return this.actionChangeState({
			user_id, state: 'paused'
		});
	}

	actionResume({
		user_id
	}) {
		return this.actionChangeState({
			user_id, state: 'active'
		});
	}

	actionInfo({
		user_id: emp_id
	}) {
		return Promise.props({
				employee: this.iris.getEmployee({
					keys: [emp_id]
				}),
				roles: this.iris.getEmployeeRoles(emp_id)
			})
			.then(({
				employee, roles
			}) => {
				// console.log("EMPLOYEE", require('util').inspect(employee, {
				// 	depth: null
				// }));
				return this.emitter.addTask('workplace', {
						_action: 'workplace',
						data: {
							query: {
								allows_role: _.map(roles, 'role')
							}
						}
					})
					.then((wp) => {
						return {
							employee, roles, wp
						};
					});
			});
	}

	actionWorkplace({
		user_id: emp_id
	}) {
		return this.emitter.addTask('workplace', {
			_action: 'workplace',
			data: {
				query: {
					occupied_by: emp_id
				}
			}
		});
	}
	actionDefaultWorkplace({
		user_id: emp_id
	}) {
		return this.emitter.addTask('workplace', {
			_action: 'workplace',
			data: {
				query: {
					device_of: emp_id
				}
			}
		});
	}
	actionAvailableWorkplaces({
		user_id: emp_id
	}) {
		return this.iris.getEmployeeRoles(emp_id)
			.then((roles) => {
				// console.log("EMPLOYEE", require('util').inspect(employee, {
				// 	depth: null
				// }));
				return this.emitter.addTask('workplace', {
					_action: 'workplace',
					data: {
						query: {
							allows_role: _.map(roles, 'role')
						}
					}
				});
			});
	}
}

module.exports = Operator;