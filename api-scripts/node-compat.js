'use strict';

const buffer = require('buffer');

// Next 12's bundled jsonwebtoken reads SlowBuffer.prototype at startup.
// Node 25 removed SlowBuffer, so provide its modern equivalent until Next is upgraded.
if (!buffer.SlowBuffer) {
    function SlowBuffer(size) {
        return buffer.Buffer.allocUnsafeSlow(size);
    }

    SlowBuffer.prototype = buffer.Buffer.prototype;
    buffer.SlowBuffer = SlowBuffer;
}
