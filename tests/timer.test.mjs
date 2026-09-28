import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import test from 'node:test';

const sourcePath = fileURLToPath(new URL('../entry/src/main/js/MainAbility/pages/timer/timer.js', import.meta.url));
const source = readFileSync(sourcePath, 'utf8')
    .replace("import Vibrator from '@system.vibrator';", '')
    .replace('export default {', 'module.exports = {');

function createTimer() {
    const callbacks = new Map();
    const vibrations = [];
    let nextId = 1;
    const module = { exports: {} };
    runInNewContext(source, {
        module,
        Vibrator: { vibrate: ({ mode }) => vibrations.push(mode) },
        setInterval: (callback, milliseconds) => {
            assert.equal(milliseconds, 1000);
            const id = nextId++;
            callbacks.set(id, callback);
            return id;
        },
        clearInterval: (id) => callbacks.delete(id)
    });

    const timer = Object.assign(Object.create(module.exports), module.exports.data);
    const advance = (seconds) => {
        for (let i = 0; i < seconds; i += 1) {
            for (const callback of [...callbacks.values()]) callback();
        }
    };
    return { timer, advance, callbacks, vibrations };
}

test('one-minute countdown reaches zero with both alerts', () => {
    const { timer, advance, callbacks, vibrations } = createTimer();
    assert.equal(timer.timeText, '01:00');
    timer.start();
    advance(1);
    assert.equal(timer.timeText, '00:59');
    advance(29);
    assert.equal(timer.timeText, '00:30');
    assert.deepEqual(vibrations, ['short']);
    advance(30);
    assert.equal(timer.timeText, '00:00');
    assert.equal(timer.percent, 100);
    assert.equal(timer.running, false);
    assert.equal(callbacks.size, 0);
    assert.deepEqual(vibrations, ['short', 'long']);
});

test('pause, resume, and reset do not duplicate or leak intervals', () => {
    const { timer, advance, callbacks } = createTimer();
    timer.start();
    timer.start();
    assert.equal(callbacks.size, 1);
    advance(5);
    timer.pause();
    assert.equal(callbacks.size, 0);
    advance(5);
    assert.equal(timer.remaining, 55);
    timer.start();
    advance(5);
    assert.equal(timer.remaining, 50);
    timer.reset();
    assert.equal(timer.timeText, '01:00');
    assert.equal(timer.percent, 0);
    assert.equal(callbacks.size, 0);
});
