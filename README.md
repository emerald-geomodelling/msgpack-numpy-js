# msgpack-numpy-js

This is a javascript companion library to [msgpack-numpy](https://github.com/lebedov/msgpack-numpy). It allows serialization and deserialization of the same msgpack extension type and format to/from javascript typed arrays.

## APIs

```
import { packBinary, unpackBinary } from "../src/index.js";

var data = unpackBinary(binary);
var newBinary = packBinary(data);
```

alternatively a lower level API can be used:

```
import { packNumpy, unpackNumpy } from "../src/index.js";

var data = unpackNumpy(msgpack.decode(binary));
var newBinary = msgpack.encode(packNumpy(data), {
    codec: msgpack.createCodec({ usemap: true, binarraybuffer: true }),
  });
```
