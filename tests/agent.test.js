'use strict'

let Agent = require("./Agent/agent");
let config = require("./config/db_config.json");

describe("Agent service", () => {
	let service = null;
	let bucket = null;
	before(() => {
		service = new Agent();
		service.init();
	});

	describe("Agent service", () => {
		it("should login", (done) => {
			return service.actionLogin({
					user_id: "iris://data#megatron-1"
				})
				.then((res) => {
					console.log("LOGIN", res);
					done();
				})
				.catch((err) => {
					done(err);
				});
		})
		it("should pause", (done) => {
			return service.actionPause({
					user_id: "iris://data#megatron-1"
				})
				.then((res) => {
					done();
				})
				.catch((err) => {
					done(err);
				});
		})
		it("should resume", (done) => {
			return service.actionResume({
					user_id: "iris://data#human-1"
				})
				.then((res) => {
					done();
				})
				.catch((err) => {
					done(err);
				});
		})
		it("should get info", (done) => {
			return service.actionInfo({
					user_id: "iris://data#megatron-1"
				})
				.then((res) => {
					console.log(res);
					done();
				})
				.catch((err) => {
					done(err);
				});
		})
		it("should get workstation", (done) => {
			return service.actionWorkstation()
				.then((res) => {
					done();
				})
				.catch((err) => {
					done(err);
				});
		})
		it("should get available workstations", (done) => {
			return service.actionAvailableWorkstations()
				.then((res) => {
					done();
				})
				.catch((err) => {
					done(err);
				});
		})
		it("should get default WorkPlace", (done) => {
			return service.actionDefaultWorkstations()
				.then((res) => {
					console.log(res);
					done();
				})
				.catch((err) => {
					done(err);
				});
		})
		it("should logout", (done) => {
			return service.actionLogout({
					user_id: "iris://data#human-1"
				})
				.then((res) => {
					done();
				})
				.catch((err) => {
					done(err);
				});
		})
	})

});