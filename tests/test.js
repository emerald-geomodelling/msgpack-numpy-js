import { unpackBinary } from "../src/index.js";
import { readFileSync } from 'fs';
import msgpack from "msgpack-lite";

var binary = readFileSync('./test.msgpack');

console.log(binary);
console.log(msgpack.decode(binary));
console.log(unpackBinary(binary));

