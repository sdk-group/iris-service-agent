'use strict'

let emitter = require("global-queue");
let AgentApi = require("resource-management-framework").AgentApi;

class Agent {
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
		user_type: type,
		state: state
	}) {
		return this.iris.setEntryField(false, {
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
		user_id
	}) {
		let user_type;
		return this.iris.checkEntryType(user_id)
			.then((type) => {
				user_type = type;
				return this.iris.getEntry(type, {
					keys: user_id
				});
			})
			.then((entity) => {
				let promises = {
					entity: Promise.resolve(entity)
				};
				let query = {};
				if(user_type === 'Employee') {
					promises.roles = this.iris.getEmployeeRoles(user_id);
					query = {
						allows_role: _.map(roles, 'role')
					};
				} else {
					query = {
						keys: entity.default_workstation
					};
				}
				promises.ws = this.emitter.addTask('workstation', {
					_action: 'workstation',
					data: {
						query
					}
				});
				return Promise.props(promises);
			})
	}

	actionWorkstation({
		user_id: emp_id
	}) {
		return this.emitter.addTask('workstation', {
			_action: 'workstation',
			data: {
				query: {
					occupied_by: emp_id
				}
			}
		});
	}
	actionDefaultWorkstation({
		user_id: emp_id
	}) {
		return this.emitter.addTask('workstation', {
			_action: 'workstation',
			data: {
				query: {
					default_agent: emp_id
				}
			}
		});
	}
	actionAvailableWorkstations({
		user_id: emp_id
	}) {
		return this.iris.getEmployeeRoles(emp_id)
			.then((roles) => {
				// console.log("EMPLOYEE", require('util').inspect(employee, {
				// 	depth: null
				// }));
				return this.emitter.addTask('workstation', {
					_action: 'workstation',
					data: {
						query: {
							allows_role: _.map(roles, 'role')
						}
					}
				});
			});
	}
}

module.exports = Agent;