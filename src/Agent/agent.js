'use strict'

let emitter = require("global-queue");
let AgentApi = require("resource-management-framework")
	.AgentApi;

class Agent {
	constructor() {
		this.emitter = emitter;
	}

	init(config) {
		this.iris = new AgentApi();
		this.iris.initContent();
		this.agents_update_interval = config.agents_update_interval || 60;
	}

	// launch() {
	// 	this.emitter.emit('taskrunner.add.task', {
	// 		now: 0,
	// 		time: 0,
	// 		task_name: "",
	// 		module_name: "agent",
	// 		task_id: "employee-cache-update",
	// 		regular: true,
	// 		task_type: "add-task",
	// 		params: {
	// 			_action: "employee-cache-update"
	// 		}
	// 	});
	// 	return Promise.resolve(true);
	// }

	//API
	// actionEmployeeCacheUpdate() {
	// 	return this.iris.updateAgentsCache()
	// 		.then((res) => {
	// 			this.emitter.emit('taskrunner.add.task', {
	// 				now,
	// 				time: this.agents_update_interval,
	// 				task_name: "",
	// 				module_name: "agent",
	// 				task_id: "employee-cache-update",
	// 				regular: true,
	// 				task_type: "add-task",
	// 				params: {
	// 					_action: "employee-cache-update"
	// 				}
	// 			});
	// 		});
	// }

	actionChangeState({
		user_id,
		state
	}) {
		return this.iris.setEntryField(false, {
				keys: user_id
			}, {
				state
			}, false)
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
			user_id,
			state: 'active'
		});
	}

	actionLogout({
		user_id
	}) {
		return this.actionChangeState({
			user_id,
			state: 'inactive'
		});
	}

	actionPause({
		user_id,
		workstation = []
	}) {
		return this.emitter.addTask('ticket', {
				_action: 'ticket',
				query: {
					state: ['called'],
					operator: user_id
				}
			})
			.then((res) => {
				if (!_.isEmpty(_.values(res)))
					return Promise.reject(new Error(`User cannot pause or logout with called tickets.`));

				return this.actionChangeState({
					user_id,
					state: 'paused'
				});
			})
			.then((res) => {
				response = {
					success: res
				};
				return Promise.map(_.castArray(workstation), (ws) => {
					return this.emitter.addTask('queue', {
						_action: "ticket-close-current",
						user_id,
						workstation: ws
					});
				});
			})
			.then((res) => {
				return response;
			})
			.catch(err => {
				console.log("PAUSE ERR", err.stack);
				return {
					success: false,
					reason: err.message
				};
			});
	}

	actionResume({
		user_id
	}) {
		return this.actionChangeState({
			user_id,
			state: 'active'
		});
	}

	actionInfo({
		user_id,
		user_type
	}) {
		return Promise.resolve(true)
			.then(() => {
				return user_type ? this.iris.getEntry(user_type, {
					keys: user_id
				}) : this.iris.getEntryTypeless(user_id);
			})
			.then((res) => {
				// console.log("ENTITY", res, user_id);
				let entity = res[user_id];
				return Promise.props({
					entity: entity,
					ws_available: this.emitter.addTask('workstation', {
						_action: 'by-id',
						workstation: entity.available_workstation
					})
				});
			})
			.catch((err) => {
				console.log("AGENT INFO ERR", err.stack);
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
		user_id
	}) {
		return pre.then((type) => {
			return this.emitter.addTask('workstation', {
				_action: 'by-agent',
				user_id
			});
		});
	}

	actionLeave({
		user_id,
		workstation
	}) {
		let response;
		return this.emitter.addTask('ticket', {
				_action: 'ticket',
				query: {
					state: ['called'],
					operator: user_id
				}
			})
			.then((res) => {
				console.log("TICKS", res);
				if (!_.isEmpty(_.values(res)))
					return Promise.reject(new Error(`User cannot pause or logout with called tickets.`));

				return this.emitter.addTask('workstation', {
					_action: 'leave',
					user_id,
					workstation
				});
			})
			.then((res) => {
				response = res;
				if (!res.success)
					return Promise.reject(new Error(`User ${user_id} failed to leave workstations ${workstation}`));
				return Promise.map(_.castArray(workstation), (ws) => {
					return this.emitter.addTask('queue', {
						_action: "ticket-close-current",
						user_id,
						workstation: ws
					});
				});
			})
			.then((res) => {
				return response;
			})
			.catch(err => {
				console.log("LEAVE ERR", err.stack);
				return {
					success: false,
					reason: err.message
				};
			});
	}

	actionDefaultWorkstations({
		user_id,
		user_type
	}) {
		return Promise.resolve(true)
			.then(() => {
				return user_type ? this.iris.getEntry(user_type, {
					keys: user_id
				}) : this.iris.getEntryTypeless(user_id);
			})
			.then((entity) => {
				let default_ws = entity[user_id].default_workstation;
				if (!default_ws)
					return Promise.reject(new Error("No default workstation for this entity."));
				return this.emitter.addTask('workstation', {
					_action: 'by-id',
					workstation: default_ws
				});
			})
			.catch((err) => {
				console.log("AV WS ERR", err.stack);
			});
	}

	actionAvailableWorkstations({
		user_id,
		user_type
	}) {
		return Promise.resolve(true)
			.then(() => {
				return user_type ? this.iris.getEntry(user_type, {
					keys: user_id
				}) : this.iris.getEntryTypeless(user_id);
			})
			.then((entity) => {
				let default_ws = entity[user_id].available_workstation;
				if (!default_ws)
					return Promise.reject(new Error("No available workstation for this entity."));
				return this.emitter.addTask('workstation', {
					_action: 'by-id',
					workstation: default_ws
				});
			})
			.catch((err) => {
				console.log("AV WS ERR", err.stack);
			});
	}
}

module.exports = Agent;
