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
		state: state
	}) {
		return this.iris.setEntryField(false, {
				keys: user_id
			}, {
				state: state
			})
			.then((res) => {
				return _.mapValues(res, val => !!(val.cas));
			})
			.catch((err) => {
				return false;
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
		user_type
	}) {
		let pre = user_type ? Promise.resolve(user_type) : this.iris.getEntryType(user_id);
		return pre.then((type) => {
			return Promise.props({
				entity: this.iris.getEntry(type, {
					keys: user_id
				}),
				ws: this.actionAvailableWorkstations({
					user_id, user_type: type
				})
			});
		});
	}

	actionWorkstation({
		user_id,
		user_type
	}) {
		let pre = user_type ? Promise.resolve(user_type) : this.iris.getEntryType(user_id);
		return pre.then((type) => {
			return this.emitter.addTask('workstation', {
				_action: 'by-agent',
				user_id
			});
		});
	}
	actionDefaultWorkstation({
		user_id,
		user_type
	}) {
		let pre = user_type ? Promise.resolve(user_type) : this.iris.getEntryType(user_id);
		return pre.then((type) => {
			return this.iris.getEntry(type, user_id)
				.then((entity) => {
					let default_ws = entity.default_workstation;
					if(!default_ws)
						return Promise.resolve(false);
					return this.emitter.addTask('workstation', {
						_action: 'by-id',
						workstation: default_ws
					});
				});
		});
	}
	actionAvailableWorkstations({
		user_id,
		user_type
	}) {
		let pre = user_type ? Promise.resolve(user_type) : this.iris.getEntryType(user_id);
		return pre.then((type) => {
			console.log("TYPE", type);
			return(type === 'Employee') ?
				this.iris.getEmployeeRoles(user_id)
				.then((roles) => {
					return this.emitter.addTask('workstation', {
						_action: 'workstation',
						query: {
							allows_role: _.map(roles, 'role')
						}
					});
				})
				.then((res) => {
					return res['Workstation'];
				}) :
				this.actionDefaultWorkstation({
					user_id, user_type: type
				});
		});

	}
}

module.exports = Agent;