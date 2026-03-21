importScripts('/vendor/rtcrtpscripttransform-shim.js');

self.onrtctransform = function(event) {
  self.KrakenE2EECore.startPipeline({
    readable: event.transformer.readable,
    writable: event.transformer.writable,
    options: event.transformer.options || {}
  });
};
