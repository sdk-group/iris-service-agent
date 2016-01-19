'use strict'

let Agent = require("./Agent/agent");
let config = require("./config/db_config.json");

describe("Agent service", () => {
	let service = null;
	let bucket = null;
	before(() => {
		service = new Agent();
		service.init({
			bucket: config.buckets.main
		});
	});

	describe("Agent service", () => {
		it("should login", (done) => {
			return service.actionLogin({
					user_id: "iris://data#human-1"
				})
				.then((res) => {
					done();
				})
				.catch((err) => {
					done(err);
				});
		})
		it("should pause", (done) => {
			return service.actionPause({
					user_id: "iris://data#human-1"
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
					user_id: "iris://data#human-1"
				})
				.then((res) => {
					console.log(res);
					done();
				})
				.catch((err) => {
					done(err);
				});
		})
		it("should get workplace", (done) => {
			return service.actionWorkplace()
				.then((res) => {
					done();
				})
				.catch((err) => {
					done(err);
				});
		})
		it("should get available workplaces", (done) => {
			return service.actionAvailableWorkplaces()
				.then((res) => {
					done();
				})
				.catch((err) => {
					done(err);
				});
		})
		it("should get default WorkPlace", (done) => {
			return service.actionDefaultWorkplace()
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