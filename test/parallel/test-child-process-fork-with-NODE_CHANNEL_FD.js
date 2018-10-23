'use strict';

// Flags: --expose-internals

const common = require('../common');
const fixtures = require('../common/fixtures');
const assert = require('assert');
const fork = require('child_process').fork;
const tmpdir = require('../common/tmpdir');
const path = require('path');
const fs = require('fs');
const { COPYFILE_FICLONE } = fs.constants;
const { Worker, isMainThread } = require('worker_threads');
const fixture = fixtures.path('child-process-send-NODE_CHANNEL_FD.js');

const tests = new Map([
  // ['TEST1', test1],
  ['TEST2', test2],
  // ['TEST3', test3]
]);

function test1() {
  assert.strictEqual(process.env.NODE_CHANNEL_FD, undefined);
  const n = fork(fixtures.path('child-process-send-NODE_CHANNEL_FD.js'), []);

  n.on('message', common.mustCall((m) => {
    assert.strictEqual(m, true);
  }));

  n.on('exit', common.mustCall((c) => {
    assert.strictEqual(c, 0);
  }));
}

function forkAndGetFreeFD(execPath) {
  for (let i = 1; i < 65536; i += 1) {
    try {
      let proc = fork(fixture, [], {env: {NODE_CHANNEL_FD: i}, execPath});
      return {proc, fd: i};
    } catch (ex) {
      // process.stderr.write(ex.message);
      // if (!ex.message.includes('EBADF') && !ex.message.includes('ENOTTY')) {
      //   throw ex;
      // }
      // process.stdout.write(ex.message);
    }
  }
}

function test2() {
  assert.strictEqual(process.env.NODE_CHANNEL_FD, undefined);

  const nodePath = process.execPath;
  const execPath = path.join(tmpdir.path, 'node-copy.exe');

  tmpdir.refresh();
  fs.copyFileSync(nodePath, execPath, COPYFILE_FICLONE);
  fs.chmodSync(execPath, '0755');
  // const execPath = process.execPath;

  const {proc, fd} = forkAndGetFreeFD(execPath);
  console.log(fd);
  fs.createReadStream(null, {fd}).on('data', console.log);
  // proc
  //   .on('message', common.mustNotCall())
  //   .on('exit', common.mustCall((c) => {
  //     assert.strictEqual(c, 0);
  //   }));
}

function test3() {
  // console.error(process.env);
  if (isMainThread) {
    assert(process._channel);
    const worker = new Worker(__filename);
  } else {
    console.log('Channel is', process._channel);
    // console.log(process.env);
    // test1();
  }
}

const testKey = Object.keys(process.env).find(tests.has.bind(tests));
if (testKey) {
  return tests.get(testKey)();
}

for (const test of tests.keys()) {
  const env = { [test]: true };
  const cp = fork(__filename, [], { env, stdio: 'pipe' });
  cp.on('exit', common.mustCall((c) => {
    assert.strictEqual(c, 0);
  }));

  // if (test === 'TEST2') {
    cp.stdout.on('data', (data) => console.log(data.toString()));

    let data = '';
    cp.stderr.on('data', (chunk) => data += chunk);
    cp.stderr.on('end', common.mustCall(function() {
      console.log('SAKTHI' + data + 'PRIYAN');
      // assert.deepStrictEqual(data, `${true}\n`);
    }));
  // }
}
