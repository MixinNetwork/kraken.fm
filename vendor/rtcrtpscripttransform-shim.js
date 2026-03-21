(function(root) {
  const MAGIC = new Uint8Array([75, 70, 77, 49]);
  const IV_LENGTH = 12;
  const TAG_LENGTH = 16;
  const textEncoder = new TextEncoder();
  const keyCache = new Map();
  const warningCache = new Set();

  function logWarningOnce(key, error) {
    if (warningCache.has(key)) {
      return;
    }
    warningCache.add(key);
    console.warn(key, error);
  }

  function hasMagicHeader(bytes) {
    if (bytes.byteLength < MAGIC.byteLength) {
      return false;
    }
    for (var i = 0; i < MAGIC.byteLength; i++) {
      if (bytes[i] !== MAGIC[i]) {
        return false;
      }
    }
    return true;
  }

  async function deriveAesKey(keyMaterial) {
    var cacheKey = typeof keyMaterial === 'string' ? keyMaterial : '';
    if (keyCache.has(cacheKey)) {
      return keyCache.get(cacheKey);
    }
    var digest = await root.crypto.subtle.digest('SHA-256', textEncoder.encode(cacheKey));
    var cryptoKey = await root.crypto.subtle.importKey(
      'raw',
      digest,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );
    keyCache.set(cacheKey, cryptoKey);
    return cryptoKey;
  }

  async function encryptFrame(frame, options) {
    var key = await deriveAesKey(options.key);
    var iv = root.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    var ciphertext = await root.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv, tagLength: 128 },
      key,
      frame.data
    );
    var payload = new Uint8Array(MAGIC.byteLength + IV_LENGTH + ciphertext.byteLength);
    payload.set(MAGIC, 0);
    payload.set(iv, MAGIC.byteLength);
    payload.set(new Uint8Array(ciphertext), MAGIC.byteLength + IV_LENGTH);
    frame.data = payload.buffer;
    return frame;
  }

  async function decryptFrame(frame, options) {
    var data = new Uint8Array(frame.data);
    if (data.byteLength < MAGIC.byteLength + IV_LENGTH + TAG_LENGTH || !hasMagicHeader(data)) {
      if (options && options.allowUnencrypted === false) {
        return null;
      }
      return frame;
    }
    var key = await deriveAesKey(options.key);
    var iv = data.slice(MAGIC.byteLength, MAGIC.byteLength + IV_LENGTH);
    var ciphertext = data.slice(MAGIC.byteLength + IV_LENGTH);
    var plaintext = await root.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv, tagLength: 128 },
      key,
      ciphertext
    );
    frame.data = plaintext;
    return frame;
  }

  function buildTransform(options) {
    var normalized = options || {};
    return new TransformStream({
      async transform(frame, controller) {
        try {
          var nextFrame = normalized.operation === 'encrypt'
            ? await encryptFrame(frame, normalized)
            : await decryptFrame(frame, normalized);
          if (nextFrame) {
            controller.enqueue(nextFrame);
          }
        } catch (error) {
          logWarningOnce('kraken-e2ee-transform-failed:' + normalized.operation, error);
        }
      }
    });
  }

  function startPipeline(context) {
    return context.readable
      .pipeThrough(buildTransform(context.options))
      .pipeTo(context.writable)
      .catch((error) => {
        logWarningOnce('kraken-e2ee-pipeline-failed:' + context.options.operation, error);
      });
  }

  function supportsNativeScriptTransform() {
    return typeof root.RTCRtpScriptTransform === 'function';
  }

  function supportsEncodedStreams() {
    return typeof root.RTCRtpSender !== 'undefined' &&
      typeof root.RTCRtpReceiver !== 'undefined';
  }

  function getSupportDetails() {
    var senderProto = typeof root.RTCRtpSender !== 'undefined' ? root.RTCRtpSender.prototype : null;
    var receiverProto = typeof root.RTCRtpReceiver !== 'undefined' ? root.RTCRtpReceiver.prototype : null;
    return {
      hasCrypto: typeof root.crypto !== 'undefined',
      hasSubtleCrypto: !!(root.crypto && root.crypto.subtle),
      isSecureContext: typeof root.isSecureContext === 'boolean' ? root.isSecureContext : null,
      hasWorker: typeof root.Worker === 'function',
      hasRTCRtpScriptTransform: typeof root.RTCRtpScriptTransform === 'function',
      hasRTCRtpSender: typeof root.RTCRtpSender !== 'undefined',
      hasRTCRtpReceiver: typeof root.RTCRtpReceiver !== 'undefined',
      hasSenderTransformProperty: !!(senderProto && 'transform' in senderProto),
      hasReceiverTransformProperty: !!(receiverProto && 'transform' in receiverProto),
      hasSenderCreateEncodedStreams: !!(senderProto && typeof senderProto.createEncodedStreams === 'function'),
      hasReceiverCreateEncodedStreams: !!(receiverProto && typeof receiverProto.createEncodedStreams === 'function'),
      supportsNativeScriptTransform: supportsNativeScriptTransform(),
      supportsEncodedStreams: supportsEncodedStreams()
    };
  }

  root.KrakenE2EECore = {
    startPipeline: startPipeline
  };

  if (typeof window === 'undefined') {
    return;
  }

  root.KrakenE2EE = {
    supportsE2EE: function() {
      var details = getSupportDetails();
      return details.hasSubtleCrypto && (
        details.supportsNativeScriptTransform || details.supportsEncodedStreams
      );
    },
    usesWorkerTransforms: function() {
      return supportsNativeScriptTransform();
    },
    getSupportDetails: function() {
      return getSupportDetails();
    },
    createWorker: function() {
      return new Worker('/e2ee-worker.js');
    },
    attachTransform: function(target, options) {
      if (!target || !options || !options.key || !options.operation) {
        console.log('[kraken-e2ee] attach skipped', {
          hasTarget: !!target,
          operation: options && options.operation,
          hasKey: !!(options && options.key)
        });
        return false;
      }
      if (supportsNativeScriptTransform() && options.worker) {
        try {
          target.transform = new root.RTCRtpScriptTransform(options.worker, {
            operation: options.operation,
            key: options.key,
            allowUnencrypted: options.allowUnencrypted !== false
          });
          console.log('[kraken-e2ee] attached native transform', { operation: options.operation });
          return true;
        } catch (error) {
          logWarningOnce('kraken-e2ee-native-transform-unavailable', error);
        }
      }
      if (!supportsEncodedStreams() || typeof target.createEncodedStreams !== 'function') {
        console.log('[kraken-e2ee] encoded streams unavailable on target', {
          operation: options.operation,
          hasCreateEncodedStreams: typeof target.createEncodedStreams === 'function',
          support: getSupportDetails()
        });
        return false;
      }
      var streams = target.createEncodedStreams();
      if (!streams || !streams.readable || !streams.writable) {
        console.log('[kraken-e2ee] encoded streams missing readable/writable', {
          operation: options.operation,
          hasReadable: !!(streams && streams.readable),
          hasWritable: !!(streams && streams.writable)
        });
        return false;
      }
      startPipeline({
        readable: streams.readable,
        writable: streams.writable,
        options: {
          operation: options.operation,
          key: options.key,
          allowUnencrypted: options.allowUnencrypted !== false
        }
      });
      console.log('[kraken-e2ee] attached encoded streams fallback', { operation: options.operation });
      return true;
    }
  };
})(typeof self !== 'undefined' ? self : globalThis);
