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
		user_id,
		user_type: type,
			state: state
	}) {
		return this.iris.setEntryField(false, {
			keys: user_id
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
		user_id,
		keys
	}) {
		let user_type;
		let id = keys || user_id;
		return this.iris.checkEntryType(id)
			.then((type) => {
				console.log("type", user_id, type);

				user_type = type;
				return Promise.props({
					roles: this.iris.getEmployeeRoles(id),
					entity: this.iris.getEntry(type, {
						keys: id
					})
				});
			})
			.then(({
				entity, roles
			}) => {
				console.log("ACHTUNG", entity, roles);
				let promises = {};
				promises.entity = Promise.resolve(entity);
				let query = {};
				if(user_type === 'Employee') {
					promises.roles = Promise.resolve(roles);
					query = {
						allows_role: _.map(roles, 'role')
					};
				} else {
					query = {
						keys: entity.default_workstation
					};
				}
				console.log("SENDING");
				return this.emitter.addTask('workstation', {
					_action: 'workstation',
					query
				});
				return Promise.props(promises);
			})
	}

	actionWorkstation({
		user_id: emp_id
	}) {
		return this.emitter.addTask('workstation', {
			_action: 'workstation',
			query: {
				occupied_by: emp_id
			}
		});
	}
	actionDefaultWorkstation({
		user_id: emp_id
	}) {
		return this.emitter.addTask('workstation', {
			_action: 'workstation',
			query: {
				default_agent: emp_id
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
					query: {
						allows_role: _.map(roles, 'role')
					}
				});
			});
	}
}

module.exports = Agent;