import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const input = process.argv[2];
if (!input) {
    console.error('Usage: node scripts/check-gadgetbridge-package.mjs <lite-wearable.hap|app.bin>');
    process.exit(2);
}

let data;
let packageName = path.basename(input);
if (input.toLowerCase().endsWith('.hap')) {
    const entries = execFileSync('unzip', ['-Z1', input], { encoding: 'utf8' })
        .trim().split('\n').filter((entry) => entry.endsWith('.bin'));
    if (entries.length !== 1) {
        throw new Error(`Expected exactly one .bin payload inside HAP; found ${entries.length}`);
    }
    packageName = entries[0];
    data = execFileSync('unzip', ['-p', input, packageName], { maxBuffer: 20 * 1024 * 1024 });
} else {
    data = readFileSync(input);
}

let offset = 0;
function requireBytes(count) {
    if (count < 0 || offset + count > data.length) {
        throw new Error(`Invalid package length at offset ${offset}`);
    }
}
function readString(allowEmpty = false) {
    requireBytes(4);
    const length = data.readInt32BE(offset);
    offset += 4;
    if (length < (allowEmpty ? 0 : 1)) throw new Error(`Invalid string length ${length}`);
    requireBytes(length);
    const value = data.toString('utf8', offset, offset + length);
    offset += length;
    return value;
}

requireBytes(1);
if (data[offset++] !== 0xbe) {
    throw new Error('Not a Huawei Lite Wearable binary app (expected 0xBE header)');
}
const bundleName = readString();
const files = [];
let config;
while (offset < data.length) {
    // Gadgetbridge's parser can also read signed .bin files. The trailing
    // signature is not another file entry, so stop at Huawei's footer.
    if (data.length - offset >= 32 && data.toString('ascii', data.length - 32, data.length - 16) === 'hw signed app   ') {
        const signatureLength = data.readInt32BE(data.length - 12);
        if (signatureLength > 0 && data.length - offset <= signatureLength) break;
    }
    const name = readString();
    readString(true); // internal path
    requireBytes(8);
    const length = Number(data.readBigInt64BE(offset));
    offset += 8;
    requireBytes(length);
    if (name === 'config.json') config = JSON.parse(data.toString('utf8', offset, offset + length));
    files.push(name);
    offset += length;
}
if (!config?.app?.bundleName) throw new Error('Missing config.json app.bundleName');
if (config.app.bundleName !== bundleName) {
    throw new Error(`Bundle mismatch: header=${bundleName}, config=${config.app.bundleName}`);
}
console.log(`Gadgetbridge-compatible binary structure: ${packageName}`);
console.log(`Bundle: ${bundleName}`);
console.log(`Files: ${files.length}`);
console.log('This checks file structure only; it does not prove signing or watch installation.');
