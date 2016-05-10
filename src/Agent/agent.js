'use strict'

let AgentApi = require("resource-management-framework")
	.AgentApi;
let moment = require('moment-timezone');

class Agent {
	constructor() {
		this.emitter = message_bus;
	}
	init(config) {
		this.iris = new AgentApi();
		this.iris.initContent();
	}
	launch() {
		this.emitter.emit('taskrunner.add.task', {
			time: 0,
			task_name: "",
			module_name: "agent",
			task_id: "cache-active-agents",
			task_type: "add-task",
			params: {
				_action: "cache-active-agents"
			}
		});
		return Promise.resolve(true);
	}

	//API
	actionCacheActiveAgents() {
		return this.iris.cacheActiveAgents();
	}

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
				this.emitter.emit('taskrunner.add.task', {
					time: 0,
					task_name: "",
					module_name: "agent",
					task_id: "cache-active-agents",
					task_type: "add-task",
					params: {
						_action: "cache-active-agents"
					}
				});
				// console.log("USER", user_id, res);
				return {
					success: !!res[user_id].cas
				};
			})
			.catch((err) => {
				console.log("ER AGR", err.stack);
				return {
					success: false
				};
			});
	}

	actionLogin({
		user_id,
		user_type,
		workstation
	}) {
		return this.emitter.addTask('workstation', {
				_action: 'workstation-organization-data',
				workstation
			})
			.then((workstations) => {
				if (user_type !== "SystemEntity") {
					let ws = workstations[workstation];
					this.emitter.emit('digital-display.emit.command', {
						org_addr: ws.org_addr,
						org_merged: ws.org_merged,
						workstation,
						command: 'refresh'
					});
				}
				return this.actionChangeState({
					user_id,
					state: 'active'
				});
			})

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
		user_type,
		workstation = []
	}) {
		let response;
		let curr_ws;
		if (user_type != "Employee")
			return {
				success: false,
				reason: "Cannot pause a System Entity."
			}

		return this.emitter.addTask('workstation', {
				_action: 'workstation-organization-data',
				workstation
			})
			.then((workstations) => {
				curr_ws = workstations;
				return Promise.all(_.map(workstations, (ws) => {
					if (user_type !== "SystemEntity") {

						this.emitter.emit('digital-display.emit.command', {
							org_addr: ws.org_addr,
							org_merged: ws.org_merged,
							workstation,
							command: 'refresh'
						});
					}
					return this.emitter.addTask('ticket', {
						_action: 'ticket',
						query: {
							state: ['called'],
							operator: user_id,
							org_destination: ws.org_merged.id,
							dedicated_date: moment.tz(ws.org_merged.org_timezone)
						}
					});
				}));
			})
			.then((res) => {
				if (!_.isEmpty(_.flatMap(res, _.values)))
					return Promise.reject(new Error(`User cannot pause or logout with called tickets.`));
				return this.actionChangeState({
					user_id,
					state: 'paused'
				});
			})
			.then((res) => {
				response = res;
				return Promise.map(_.castArray(workstation), (ws) => {
					return this.emitter.addTask('queue', {
						_action: "ticket-close-current",
						user_id,
						workstation: ws
					});
				});
			})
			.then((res) => {
				// console.log("PAUSE RESPONSE", response);
				_.map(curr_ws, ({
					ws,
					org_addr,
					org_chain,
					org_merged
				}) => {
					this.emitter.emit('queue.emit.head', {
						user_id,
						org_addr,
						org_merged
					});
				});
				return response;
			})
			.catch(err => {
				console.log("PAUSE ERR", err.message);
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
		user_type,
		parent,
		satellite_type
	}) {
		return Promise.props({
				permissions: this.iris.getAgentPermissions(),
				agent: user_type ? this.iris.getEntry(user_type, {
					keys: user_id
				}) : this.iris.getEntryTypeless(user_id)
			})
			.then(({
				agent,
				permissions
			}) => {
				// console.log("ENTITY", agent, permissions, user_id);
				let entity = agent[user_id];
				entity.permissions = _.mapValues(permissions, (perm, key) => {
					return _.merge(perm.params, _.get(entity, `permissions.${key}`, {}));
				});
				return Promise.props({
					entity,
					ws_available: this.emitter.addTask('workstation', {
						_action: 'workstation',
						workstation: entity.available_workstation,
						parent,
						satellite_type
					})
				});
			});
	}

	actionActiveAgents({
		agent_type,
		state = 'active'
	}) {
		return this.iris.getActiveAgents()
			.then((res) => {
				// console.log("AGENTS", _.flattenDeep(_.values(_.pick(res[agent_type], _.castArray(state)))));
				return _(res[agent_type])
					.pick(state)
					.values()
					.flattenDeep()
					.value();
			});
	}

	actionLeave({
		user_id,
		user_type,
		workstation = []
	}) {
		let response;
		return this.emitter.addTask('workstation', {
				_action: 'workstation-organization-data',
				workstation
			})
			.then((workstations) => {
				return Promise.all(_.map(workstations, (ws) => {
					if (user_type !== "SystemEntity") {
						this.emitter.emit('digital-display.emit.command', {
							org_addr: ws.org_addr,
							org_merged: ws.org_merged,
							workstation,
							command: 'clear'
						});
					}
					return this.emitter.addTask('ticket', {
						_action: 'ticket',
						query: {
							state: ['called'],
							operator: user_id,
							org_destination: ws.org_merged.id,
							dedicated_date: moment.tz(ws.org_merged.org_timezone)
						}
					});
				}));
			})
			.then((res) => {
				if (!_.isEmpty(_.flatMap(res, _.values)))
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
				console.log("LEAVE ERR", err.message);
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
			});
	}

	actionById({
		agent_id
	}) {
		return this.iris.getEntryTypeless(agent_id)
			.then((res) => _.isArray(agent_id) ? res : res[agent_id]);
	}
}
module.exports = Agent;