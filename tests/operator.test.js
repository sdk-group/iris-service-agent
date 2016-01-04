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
			return service.login()
				.then((res) => {
					done();
				})
				.catch((err) => {
					done(err);
				});
		})
		it("should pause", (done) => {
			return service.pause()
				.then((res) => {
					done();
				})
				.catch((err) => {
					done(err);
				});
		})
		it("should resume", (done) => {
			return service.resume()
				.then((res) => {
					done();
				})
				.catch((err) => {
					done(err);
				});
		})
		it("should get info", (done) => {
			return service.getInfo()
				.then((res) => {
					console.log(res);
					done();
				})
				.catch((err) => {
					done(err);
				});
		})
		it("should get workplace", (done) => {
			return service.getWorkPlace()
				.then((res) => {
					done();
				})
				.catch((err) => {
					done(err);
				});
		})
		it("should get available workplaces", (done) => {
			return service.getAvailableWorkPlaces()
				.then((res) => {
					done();
				})
				.catch((err) => {
					done(err);
				});
		})
		it("should get default WorkPlace", (done) => {
			return service.defaultWorkPlace()
				.then((res) => {
					console.log(res);
					done();
				})
				.catch((err) => {
					done(err);
				});
		})
		it("should logout", (done) => {
			return service.logout()
				.then((res) => {
					done();
				})
				.catch((err) => {
					done(err);
				});
		})
	})

});