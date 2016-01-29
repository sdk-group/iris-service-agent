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
				state
			})
			.then((res) => {
				return _.mapValues(res, val => !!(val.cas));
			})
			.catch((err) => {
				console.log("ER AGR", err.stack);
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
				return this.iris.getEntry(type, {
					keys: user_id
				});
			})
			.then((res) => {
				// console.log("ENTITY", res);
				let entity = res[user_id];
				let def_ws = _.isArray(entity.default_workstation) ? entity.default_workstation : [entity.default_workstation];
				return Promise.props({
					entity: entity,
					ws_available: this.emitter.addTask('workstation', {
						_action: 'by-id',
						workstation: entity.available_workstation
					}),
					ws_default: def_ws
				});
			});
	}

	actionActiveAgents({
		agent_type
	}) {
		return this.iris.getEntry(agent_type, {
			query: {
				state: 'active'
			}
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

	actionLeave({
		user_id, user_type, workstation
	}) {
		console.log("LOGOUT AG", user_id, user_type, workstation);
		return this.emitter.addTask('workstation', {
			_action: 'leave',
			user_id,
			user_type,
			workstation
		});
	}

	actionDefaultWorkstations({
		user_id,
		user_type
	}) {
		let pre = user_type ? Promise.resolve(user_type) : this.iris.getEntryType(user_id);
		return pre.then((type) => {
				return this.iris.getEntry(type, user_id)
					.then((entity) => {
						let default_ws = entity[user_id].default_workstation;
						if(!default_ws)
							return Promise.reject(new Error("No default workstation for this entity."));
						return this.emitter.addTask('workstation', {
							_action: 'by-id',
							workstation: default_ws
						});
					});
			})
			.catch((err) => []);
	}
	actionAvailableWorkstations({
		user_id,
		user_type
	}) {
		let pre = user_type ? Promise.resolve(user_type) : this.iris.getEntryType(user_id);
		return pre.then((type) => {
				return this.iris.getEntry(type, user_id)
					.then((entity) => {
						let default_ws = entity[user_id].available_workstation;
						if(!default_ws)
							return Promise.reject(new Error("No available workstation for this entity."));
						return this.emitter.addTask('workstation', {
							_action: 'by-id',
							workstation: default_ws
						});
					});
			})
			.catch((err) => []);
	}
}

module.exports = Agent;