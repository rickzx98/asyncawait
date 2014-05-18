﻿import references = require('references');
import chai = require('chai');
import Promise = require('bluebird');
import _ = require('lodash');
import async = require('asyncawait/async');
import await = require('asyncawait/await');
var expect = chai.expect;


var origConcurrency;
beforeEach(() => origConcurrency = async.config().maxConcurrency);
afterEach(() => async.config({ maxConcurrency: origConcurrency }));


describe('Getting a config object from async.config()', () => {

    it('returns a different object on each call', () => {
        var cfgs = [async.config(), async.config(), async.config(), async.config()];
        expect(_.unique(cfgs).length).to.equal(cfgs.length);
    });

    it('returns an object that is a detached copy of config', () => {
        var cfg = async.config();
        cfg.maxConcurrency += 6;
        expect(async.config().maxConcurrency).to.equal(cfg.maxConcurrency - 6);
    });

    it('returns the maxConcurrency value most recently set', () => {
        async.config({ maxConcurrency: 17 });
        expect(async.config().maxConcurrency).to.equal(17);
        async.config({ maxConcurrency: 1000000 });
        expect(async.config().maxConcurrency).to.equal(1000000);
    });
});


describe('Setting config via async.config(...)', () => {

    var started = 0, finished = 0;
    var opA = async (() => { ++started; await (Promise.delay(20)); ++finished; });
    var opB = async (() => { return { started: started, finished: finished }; });

    it('updates maxConcurency to the specified value', () => {
        async.config({ maxConcurrency: 17 });
        expect(async.config().maxConcurrency).to.equal(17);
        async.config({ maxConcurrency: 1000000 });
        expect(async.config().maxConcurrency).to.equal(1000000);
    });

    it('leaves omitted config values unchanged', () => {
        async.config({ maxConcurrency: 17 });
        expect(async.config().maxConcurrency).to.equal(17);
        async.config({ });
        async.config({ maxConcurrency: undefined });
        async.config({ maxConcurrency: null });
        expect(async.config().maxConcurrency).to.equal(17);
    });

    it('applies the specified maxConcurrency setting to subsequent operations', done => {

        function doTasks(maxConcurrency: number) {
            started = finished = 0;
            async.config({ maxConcurrency: maxConcurrency });
            return Promise
                .all([opA(), opA(), opA(), opA(), opA(), opB()])
                .then(r => <any> r[5]);
        }

        doTasks(10)
        .then(r => expect(r.finished).to.equal(0))
        .then(() => doTasks(1))
        .then(r => expect(r.finished).to.equal(5))
        .then(() => doTasks(5))
        .then(r => expect(r.finished).to.be.greaterThan(0))
        .then(() => done())
        .catch(done);
    });
});
