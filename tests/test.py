import msgpack
import msgpack_numpy as m
import numpy as np

arr = np.array([1, 2, 3], dtype="uint32")
with open("test.msgpack", "wb") as f:
    f.write(msgpack.packb(arr, default=m.encode))
    
with open("test.msgpack", "rb") as f:
    print(msgpack.unpackb(f.read(), object_hook=m.decode))
