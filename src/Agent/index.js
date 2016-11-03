'use strict'

let events = {
	agent: {}
}

let tasks = [];

let manifest = {
	module: require('./agent.js'),
	name: 'agent',
	permissions: [],
	exposed: true,
	tasks: tasks,
	events: {
		group: 'agent',
		shorthands: events.agent
	}
};

module.exports = manifest;