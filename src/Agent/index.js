let events = {
	operator: {
		// change_state: "operator.change_state",
		// login: "operator.login",
		// logout: "operator.logout",
		// pause: "operator.pause",
		// resume: "operator.resume",
		// get_info: "operator.get_info",
		// get_work_place: "operator.get_work_place",
		// get_available_work_places: "operator.get_available_workplaces",
		// default_work_place: "operator.default_workplace"
	}
}

let tasks = [
	// {
	// 	name: events.operator.change_state,
	// 	handler: 'changeState'
	// }, {
	// 	name: events.operator.login,
	// 	handler: 'login'
	// }, {
	// 	name: events.operator.logout,
	// 	handler: 'logout'
	// }, {
	// 	name: events.operator.pause,
	// 	handler: 'pause'
	// }, {
	// 	name: events.operator.resume,
	// 	handler: 'resume'
	// }, {
	// 	name: events.operator.get_info,
	// 	handler: 'getInfo'
	// }, {
	// 	name: events.operator.get_work_place,
	// 	handler: 'getWorkPlace'
	// }, {
	// 	name: events.operator.get_available_work_places,
	// 	handler: 'getAvailableWorkPlaces'
	// }, {
	// 	name: events.operator.default_work_place,
	// 	handler: 'defaultWorkPlace'
	// }
]

let manifest = {
	module: require('./operator.js'),
	permissions: [],
	exposed: true,
	tasks: tasks,
	events: {
		group: 'operator',
		shorthands: events.operator
	}
};

module.exports = manifest;