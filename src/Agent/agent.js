'use strict'

let AgentApi = require("resource-management-framework")
	.AgentApi;

class Agent {
	constructor() {
		this.emitter = message_bus;
	}
	init(config) {
		this.iris = new AgentApi();
		this.iris.initContent();
	}
	launch() {
		return this.actionCacheActiveAgents()
			.then(res => true);
	}

	//API
	actionCacheActiveAgents() {
		return this.iris.cacheActiveAgents();
	}

	actionChangeState({
		user_id,
		workstation = [],
		state
	}) {
		return this.iris.getEntryTypeless(user_id)
			.then((res) => {
				let agents = _(res)
					.values()
					.compact()
					.map(a => {
						a.state = state;
						return a;
					})
					.value();
				return this.iris.setEntryTypeless(agents);
			})
			.then((res) => {
				return this.actionCacheActiveAgents();
			})
			.then((res) => {
				// console.log("USER CHSTATE", user_id, res);
				global.logger && logger.info("Agent %s changes state to %s", user_id, state);
				return {
					success: true
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
					this.emitter.command('digital-display.emit.command', {
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
			});

	}

	actionLogout({
		user_id,
		workstation
	}) {
		return this.actionChangeState({
			user_id,
			state: 'inactive'
		});
	}

	actionLogoutAll({
		organization,
		agent_type = 'Employee'
	}) {
		return this.actionActiveAgents({
				organization,
				agent_type,
				state: ['active', 'paused']
			})
			.then((user_id) => {
				return this.actionLogout({
					user_id
				});
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
				return Promise.map(_.values(workstations), (ws) => {
					if (user_type !== "SystemEntity") {
						this.emitter.command('digital-display.emit.command', {
							org_addr: ws.org_addr,
							org_merged: ws.org_merged,
							workstation,
							command: 'refresh'
						});
					}

					return this.actionCheckAssigned({
						state: ['called', 'postponed'],
						destination: workstation,
						operator: user_id,
						org_destination: ws.org_merged.id,
						dedicated_date: moment.tz(ws.org_merged.org_timezone)
					});
				});
			})
			.then((res) => {
				if (!_.every(res, t => _.get(t, 'called.count', 0) == 0))
					return Promise.reject(new Error(`User cannot pause or logout with called tickets.`));
				return this.actionChangeState({
					user_id,
					workstation,
					state: 'paused'
				});
			})
			.then((res) => {
				response = res;
				return Promise.map(_.castArray(workstation), (ws) => {
					return this.emitter.addTask('workstation', {
						_action: 'change-state',
						workstation: workstation,
						state: 'paused'
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
					this.emitter.command('queue.emit.head', {
						user_id,
						org_addr,
						org_merged
					});
				});
				return response;
			})
			.catch(err => {
				console.log("PAUSE ERR", err.stack);
				global.logger && logger.info(
					err, {
						module: 'agent',
						method: 'pause'
					});
				return {
					success: false,
					reason: err.message
				};
			});
	}

	actionResume({
		user_id,
		user_type,
		workstation
	}) {
		return Promise.map(_.castArray(workstation), ws => {
				this.emitter.addTask('workstation', {
					_action: 'occupy',
					workstation: ws,
					user_type,
					user_id
				});
			})
			.then(res => {
				return {
					success: true
				}
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

	actionResourceKeys({
		role,
		organization
	}) {
		return this.iris.getAgentKeys(organization, role)
			.then(keys => {
				return Promise.props({
					all: keys,
					active: this.emitter.addTask('agent', {
							_action: 'active-agents',
							agent_type: 'Employee',
							state: 'active'
						})
						.then(active_keys => _.intersection(keys, active_keys))
				});
			});
	}

	actionCheckAssigned({
		operator,
		destination,
		org_destination,
		dedicated_date,
		state = ['called', 'postponed']
	}) {
		return this.emitter.addTask('ticket', {
				_action: 'ticket',
				query: {
					state: state,
					destination: destination,
					operator: operator,
					org_destination: org_destination,
					dedicated_date: dedicated_date
				}
			})
			.then((res) => {
				let data = _(res)
					.groupBy('state')
					.mapValues(ticks => {
						return {
							tickets: ticks,
							count: _.size(ticks)
						};
					})
					.value();
				console.log("PASSED", data);
				return data;
			});
	}

	actionLeave({
		user_id,
		user_type,
		workstation = []
	}) {
		console.log("LEAVE", user_id, workstation);
		let response;
		return this.emitter.addTask('workstation', {
				_action: 'workstation-organization-data',
				workstation
			})
			.then((workstations) => {
				return Promise.map(_.values(workstations), (ws) => {
					if (user_type !== "SystemEntity") {
						this.emitter.command('digital-display.emit.command', {
							org_addr: ws.org_addr,
							org_merged: ws.org_merged,
							workstation,
							command: 'clear'
						});
					}
					return this.actionCheckAssigned({
						state: ['called', 'postponed'],
						destination: workstation,
						operator: user_id,
						org_destination: ws.org_merged.id,
						dedicated_date: moment.tz(ws.org_merged.org_timezone)
					});
				});
			})
			.then((res) => {
				if (!_.every(res, t => _.get(t, 'called.count', 0) == 0))
					return Promise.reject(new Error(`User cannot pause or logout with called tickets.`));
				return this.emitter.addTask('workstation', {
					_action: 'leave',
					user_id,
					workstation
				});
			})
			.catch(err => {
				console.log("LEAVE ERR", err.message);
				global.logger && logger.info(
					err, {
						module: 'agent',
						method: 'leave'
					});
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