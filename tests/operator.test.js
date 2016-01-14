'use strict'

let Operator = require("./Operator/operator");
let config = require("./config/db_config.json");

describe("Operator service", () => {
	let service = null;
	let bucket = null;
	before(() => {
		service = new Operator();
		service.init({
			bucket: config.buckets.main
		});
	});

	describe("Operator service", () => {
		it("should login", (done) => {
			return service.actionLogin()
				.then((res) => {
					done();
				})
				.catch((err) => {
					done(err);
				});
		})
		it("should pause", (done) => {
			return service.actionPause()
				.then((res) => {
					done();
				})
				.catch((err) => {
					done(err);
				});
		})
		it("should resume", (done) => {
			return service.actionResume()
				.then((res) => {
					done();
				})
				.catch((err) => {
					done(err);
				});
		})
		it("should get info", (done) => {
			return service.actionInfo()
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
			return service.actionLogout()
				.then((res) => {
					done();
				})
				.catch((err) => {
					done(err);
				});
		})
	})

});