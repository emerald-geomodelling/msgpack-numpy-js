# msgpack-numpy-js

This is a javascript companion library to [msgpack-numpy](https://github.com/lebedov/msgpack-numpy). It allows serialization and deserialization of the same msgpack extension type and format to/from javascript typed arrays.

This library works in nodejs and in the browser.

## APIs

```
import { packBinary, unpackBinary } from "msgpack-numpy-js";
import msgpack from "msgpack-lite";

var data = new Uint32Array([1, 2, 3]);

var binary = packBinary(data);
var data2 = unpackBinary(binary);
```

alternatively a lower level API can be used:

```
import { packNumpy, unpackNumpy } from "msgpack-numpy-js";
import msgpack from "msgpack-lite";

var data = new Uint32Array([1, 2, 3]);

var binary = msgpack.encode(packNumpy(data), {
    codec: msgpack.createCodec({ usemap: true, binarraybuffer: true }),
  });
var data2 = unpackNumpy(msgpack.decode(binary));
```
