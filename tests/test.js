import { unpackBinary, packBinary, packNumpy, unpackNumpy } from "../src/index.js";
import { readFileSync } from 'fs';
import msgpack from "msgpack-lite";

var binary = readFileSync('./test.msgpack');

console.log(unpackBinary(binary));
