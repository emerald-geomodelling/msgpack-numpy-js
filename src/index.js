import msgpack from "msgpack-lite";
import _ from "underscore";

if (typeof BigInt64Array === 'undefined') {
  const BigInt64Array = window.BigInt64Array;
}
if (typeof BigUint64Array === 'undefined') {
  const BigUint64Array = window.BigUint64Array;
}

const isLittleEndian =
  new Uint8Array(new Uint32Array([0x11223344]).buffer)[0] === 0x44;

function byteswap(typecode, data) {
  if (typecode === "=") return data; // Not much we can do here :P
  if (typecode === "<" && isLittleEndian) return data;
  if (typecode === ">" && !isLittleEndian) return data;

  throw new Error("Endianness swapping not implemented");
}

const npsplitfirstdim = (data, dim) => {
  const restdim = data.length / dim;
  const res = [];
  for (var i = 0; i < restdim; i++) {
    (function (currentI) {
      res.push(data.filter((d, di) => (di - currentI) % restdim === 0));
    })(i);
  }

  return res;
};
const npsplitdims = (data, dims) => {
  for (var i = 0; i < dims.length - 1; i++) {
    data = npsplitfirstdim(data, dims[i]);
  }
  return data;
};

const npmergefirstdim = (data) => {
  return _.zip
    .apply(
      [],
      data.map((a) => Array.from(a))
    )
    .flat();
};

const npmergedims = (data) => {
  if (data.buffer !== undefined) {
    return Array.from(data);
  } else {
    return npmergefirstdim(data.map(npmergedims));
  }
};

export function unpackNumpy(v) {
  if (v === null) {
    return v;
  } else if (Array.isArray(v)) {
    var res = [];
    for (var i in v) {
      res.push(unpackNumpy(v[i]));
    }
    return res;
  } else if (typeof v === "object") {
    var constr;
    var isnd = v["nd"] || v["110,100"];
    var t = v["type"] || v["116,121,112,101"];
    var d = v["data"] || v["100,97,116,97"];
    var s = v["shape"] || v["115,104,97,112,101"];

    if (isnd !== undefined && typeof t === "string") {
      d = byteswap(t[0], d);
      t = t.slice(1);
      constr = {
        U8: Uint8Array,

        b: Int8Array,
        B: Int8Array,

        i2: Int16Array,
        i4: Int32Array,
        i8: BigInt64Array,

        I2: Uint16Array,
        I4: Uint32Array,
        I8: BigUint64Array,

        u2: Uint16Array,
        u4: Uint32Array,
        u8: BigUint64Array,

        f4: Float32Array,
        f8: Float64Array,
      }[t];

      if (constr !== undefined) {
        if (d.byteOffset !== undefined) {
          // NodeJS
          v = new constr(d.buffer, d.byteOffset, d.length / constr.BYTES_PER_ELEMENT);
        } else {
          v = new constr(d.buffer);
        }
        v = npsplitdims(v, s);
        return v;
      } else {
        console.warn("Unknown datatype in msgpack binary", t);
      }
    }

    res = {};
    for (i in v) {
      res[i] = unpackNumpy(v[i]);
    }
    return res;
  } else {
    return v;
  }
}

const multidimTypedArrayType = function (v) {
  while (v && v.length !== undefined && v.buffer === undefined) {
    v = v[0];
  }
  if (v && v.buffer !== undefined && v.length !== undefined)
    return v.constructor;
  return null;
};

const multidimTypedArrayShape = function (v) {
  if (!v) return false;
  if (v.buffer !== undefined && v.length !== undefined) return [v.length];
  if (!Array.isArray(v)) return false;
  if (v.length === 0) return false;
  const dims = v.map(multidimTypedArrayShape).reduce((a, b) => {
    if (a === false || b === false) return false;
    if (JSON.stringify(a) !== JSON.stringify(b)) return false;
    return b;
  });
  if (dims === false) return false;
  return dims.concat([v.length]);
};

const enc = new TextEncoder();

export function packNumpy(v) {
  if (v === null) {
    return v;
  } else if (Array.isArray(v)) {
    const dims = multidimTypedArrayShape(v);
    if (dims !== false) {
      const data = npmergedims(v, dims);
      const constr = multidimTypedArrayType(v);
      const packed = packNumpy(new constr(data));
      packed.set(enc.encode("shape"), dims);
      return packed;
    } else {
      var res = [];
      for (var i in v) {
        res.push(packNumpy(v[i]));
      }
      return res;
    }
  } else if (typeof v === "object") {
    if (v.buffer !== undefined) {
      const type = {
        Uint8Array: "U8",

        Int8Array: "b",

        Int16Array: "i2",
        Int32Array: "i4",
        BigInt64Array: "i8",

        Uint16Array: "I2",
        Uint32Array: "I4",
        BigUint64Array: "I8",

        Float32Array: "f4",
        Float64Array: "f8",
      }[v.constructor.name];

      const res = new Map();
      res.set(enc.encode("nd").buffer, true);
      res.set(enc.encode("type").buffer, (isLittleEndian ? "<" : ">") + type);
      res.set(enc.encode("shape").buffer, [v.length]);
      res.set(enc.encode("data").buffer, v.buffer);
      return res;
    } else if (v.constructor === ArrayBuffer) {
      return v;
    } else if (v.constructor === Map) {
      return new Map(
        Array.from(v.entries()).map(([vk, vv]) => [
          packNumpy(vk),
          packNumpy(vv),
        ])
      );
    } else {
      res = {};
      for (i in v) {
        res[i] = packNumpy(v[i]);
      }
      return res;
    }
  } else {
    return v;
  }
}

export const packBinary = (data) => {
  return msgpack.encode(packNumpy(data), {
    codec: msgpack.createCodec({ usemap: true, binarraybuffer: true }),
  });
};

export const unpackBinary = (data) => {
  return unpackNumpy(msgpack.decode(data));
};
