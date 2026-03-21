window.onload = function() {
  // production configuration in kraken.fm
  const KRAKEN_API = 'https://rpc.kraken.fm';
  const ICE_POLICY = 'relay';

  // good for local development
  // const KRAKEN_API = 'http://192.168.122.202:7000';
  // const KRAKEN_API = 'http://localhost:7000';
  // const ICE_POLICY = 'all';

  /**
   *
   *  Base64 encode / decode
   *  http://www.webtoolkit.info
   *
   **/
  var Base64 = {

    // private property
    _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="

    // public method for encoding
    , encode: function (input)
    {
      var output = "";
      var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
      var i = 0;

      input = Base64._utf8_encode(input);

      while (i < input.length)
      {
        chr1 = input.charCodeAt(i++);
        chr2 = input.charCodeAt(i++);
        chr3 = input.charCodeAt(i++);

        enc1 = chr1 >> 2;
        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
        enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
        enc4 = chr3 & 63;

        if (isNaN(chr2))
        {
          enc3 = enc4 = 64;
        }
        else if (isNaN(chr3))
        {
          enc4 = 64;
        }

        output = output +
          this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
          this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
      } // Whend

      return output;
    } // End Function encode


    // public method for decoding
    ,decode: function (input)
    {
      var output = "";
      var chr1, chr2, chr3;
      var enc1, enc2, enc3, enc4;
      var i = 0;

      input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
      while (i < input.length)
      {
        enc1 = this._keyStr.indexOf(input.charAt(i++));
        enc2 = this._keyStr.indexOf(input.charAt(i++));
        enc3 = this._keyStr.indexOf(input.charAt(i++));
        enc4 = this._keyStr.indexOf(input.charAt(i++));

        chr1 = (enc1 << 2) | (enc2 >> 4);
        chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
        chr3 = ((enc3 & 3) << 6) | enc4;

        output = output + String.fromCharCode(chr1);

        if (enc3 != 64)
        {
          output = output + String.fromCharCode(chr2);
        }

        if (enc4 != 64)
        {
          output = output + String.fromCharCode(chr3);
        }

      } // Whend

      output = Base64._utf8_decode(output);

      return output;
    } // End Function decode


    // private method for UTF-8 encoding
    ,_utf8_encode: function (string)
    {
      var utftext = "";
      string = string.replace(/\r\n/g, "\n");

      for (var n = 0; n < string.length; n++)
      {
        var c = string.charCodeAt(n);

        if (c < 128)
        {
          utftext += String.fromCharCode(c);
        }
        else if ((c > 127) && (c < 2048))
        {
          utftext += String.fromCharCode((c >> 6) | 192);
          utftext += String.fromCharCode((c & 63) | 128);
        }
        else
        {
          utftext += String.fromCharCode((c >> 12) | 224);
          utftext += String.fromCharCode(((c >> 6) & 63) | 128);
          utftext += String.fromCharCode((c & 63) | 128);
        }

      } // Next n

      return utftext;
    } // End Function _utf8_encode

    // private method for UTF-8 decoding
    ,_utf8_decode: function (utftext)
    {
      var string = "";
      var i = 0;
      var c, c1, c2, c3;
      c = c1 = c2 = 0;

      while (i < utftext.length)
      {
        c = utftext.charCodeAt(i);

        if (c < 128)
        {
          string += String.fromCharCode(c);
          i++;
        }
        else if ((c > 191) && (c < 224))
        {
          c2 = utftext.charCodeAt(i + 1);
          string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
          i += 2;
        }
        else
        {
          c2 = utftext.charCodeAt(i + 1);
          c3 = utftext.charCodeAt(i + 2);
          string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
          i += 3;
        }

      } // Whend

      return string;
    } // End Function _utf8_decode
  }

  const micIcon = '🦜', muteIcon = '😶';
  const partyIcon = '🎉', performIcon = '🗣', heartIcon = '💓';
  const e2eeAnchorParam = 'key';

  var uid = localStorage.getItem('uid');
  if (!uid) {
    uid = uuidv4();
    localStorage.setItem('uid', uid);
  }

  var rname = getUrlParam('space');
  const spaceSum = getUrlParam('checksum');
  if (!rname || rname.trim() === '' || !spaceSum || spaceSum.length != 32) {
    document.getElementById('home').style.display = 'block';
    document.getElementById('space-submit').onclick = function () {
      var val = document.querySelector('#create-room-form input[name="name"]').value;
      if (!val || val.trim() === '') {
        alert('space name can not be empty');
        return;
      } else if (val.length > 32) {
        alert('space name too long, at most 32 characters');
        return;
      }
      var sum = createSpace();
      var e2eeKey = generateE2EEKey();
      window.location = '?space=' + fixedEncodeURIComponent(val) + '&checksum=' + sum + buildHashString({ key: e2eeKey });
    };
    return;
  }

  const e2eeContext = createE2EEContext(spaceSum);
  if (!e2eeContext.enabled) {
    return;
  }

  var name = localStorage.getItem(rname+':'+uid);
  if (!name || name === '') {
    document.getElementById('join-form').style.display = 'block';
    document.getElementById('name-submit').onclick = function () {
      var val = document.querySelector('#join-form input[name="name"]').value;
      if (!val || val.trim() === '') {
        alert('your name can not be empty');
      } else if (val.length > 32) {
        alert('your name too long, at most 32 characters');
      } else {
        localStorage.setItem(rname+':'+uid, val);
        window.location.reload(false);
      }
    };
    return;
  }
  document.getElementById('space-name').textContent = rname;
  const htmlTitle = document.querySelector('title');
  htmlTitle.textContent = rname + ' | ' + htmlTitle.innerText;
  rname = rname + spaceSum;
  var uname = uid + ':' + Base64.encode(name);

  const rnameRPC = fixedEncodeURIComponent(rname);
  const unameRPC = fixedEncodeURIComponent(uname);

  var ucid = "";
  var visualizers = {};
  window.onresize = function() {
    resizeVisulizers();
  };
  function resizeVisulizers() {
    const COL2 = 10;
    var ww = window.innerWidth;
    var wh = window.innerHeight;
    var peers = document.querySelectorAll('.peer');
    var num = peers.length;
    var width = ww;
    var height = wh / num;
    if (num > COL2) {
      width = ww / 2;
      height = wh / Math.ceil(num / 2);
    }
    peers.forEach((peer) => {
      var canvas = peer.querySelector('canvas');
      peer.style.width = `${width}px`;
      peer.style.height = `${height}px`;
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
    })
    if (num > COL2 && num % 2 == 1) {
      var peer = peers[num - 1];
      var canvas = peer.querySelector('canvas');
      peer.style.width = `${width * 2}px`;
      canvas.width = width * 2;
    }
    if (peers.length == 1) {
      document.getElementById('overlay').style.display = 'block';
    } else {
      document.getElementById('overlay').style.display = 'none';
    }
  }

  const constraints = {
    audio: true,
    video: false
  };
  const configuration = {
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require',
    sdpSemantics: 'unified-plan',
    // Needed by the createEncodedStreams() fallback used by older browsers.
    encodedInsertableStreams: true
  };

  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();

  if (e2eeContext.worker) {
    window.addEventListener('beforeunload', function() {
      e2eeContext.worker.terminate();
    }, { once: true });
  }

  async function subscribe(pc) {
    var res = await rpc('subscribe', [rnameRPC, unameRPC, ucid]);
    if (res.error && typeof res.error === 'object' && typeof res.error.code === 'number' && [5002001, 5002002].indexOf(res.error.code) != -1) {
      pc.close();
      await start();
      return;
    }
    if (res.data) {
      var jsep = JSON.parse(res.data.jsep);
      if (jsep.type == 'offer') {
        await pc.setRemoteDescription(jsep);
        var sdp = await pc.createAnswer();
        await pc.setLocalDescription(sdp);
        await rpc('answer', [rnameRPC, unameRPC, ucid, JSON.stringify(sdp)]);
      }
    }
    setTimeout(function () {
      subscribe(pc);
    }, 3000);
  }

  start();
  adminMuteStateLoop(spaceSum);

  async function start() {
    try {
      document.querySelectorAll('.peer').forEach((el) => el.remove());

      var res = await rpc('turn', [unameRPC]);
      if (ICE_POLICY === 'relay' && res.data && res.data.length > 0) {
        configuration.iceServers = res.data;
        configuration.iceTransportPolicy = 'relay';
      } else {
        configuration.iceServers = [];
        configuration.iceTransportPolicy = 'all';
      }

      var pc = new RTCPeerConnection(configuration);

      pc.onicecandidate = ({candidate}) => {
        rpc('trickle', [rnameRPC, unameRPC, ucid, JSON.stringify(candidate)]);
      };

      pc.ontrack = (event) => {
        console.log("ontrack", event);
        if (!attachE2EETransform(event.receiver, 'decrypt', e2eeContext)) {
          showBlockingOverlay('Failed to attach the end-to-end audio decryptor for this room.');
          return;
        }

        var stream = event.streams[0];
        var sid = fixedDecodeURIComponent(stream.id);
        var id = sid.split(':')[0];
        var name = Base64.decode(sid.split(':')[1]);
        console.log(id, uid);
        if (id === uid) {
          return;
        }

        event.track.onmute = (event) => {
          console.log("onmute", event);
          var el = document.querySelector(`[data-track-id="${event.target.id}"]`);
          if (el) {
            el.remove();
            resizeVisulizers();
          }
        };

        var aid = 'peer-audio-'+id;
        var el = document.getElementById(aid);
        if (el) {
          el.srcObject = stream;
        } else {
          el = document.createElement(event.track.kind)
          el.id = aid;
          el.srcObject = stream;
          el.autoplay = true;
          el.controls = false;
          document.getElementById('peers').appendChild(el)
        }

        buildCanvas(stream, id, name, event.track.id, spaceSum);
        resizeVisulizers();
      };

      var stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        document.getElementById('microphone').style.display = 'block';
        console.error(err);
        return;
      }
      buildCanvas(stream, uid, name, 'me', spaceSum);
      resizeVisulizers();
      handlePartyPerform(spaceSum);
      audioCtx.resume();

      stream.getTracks().forEach((track) => {
        var sender = pc.addTrack(track, stream);
        if (!attachE2EETransform(sender, 'encrypt', e2eeContext)) {
          throw new Error('failed to attach end-to-end audio encryptor');
        }
      });
      await pc.setLocalDescription(await pc.createOffer());

      res = await rpc('publish', [
        rnameRPC,
        unameRPC,
        JSON.stringify(pc.localDescription),
        100,
        '',
        !isAdminOfSpace(spaceSum)
      ]);
      if (res.data) {
        var jsep = JSON.parse(res.data.jsep);
        if (jsep.type == 'answer') {
          await pc.setRemoteDescription(jsep);
          ucid = res.data.track;
          subscribe(pc);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  function handlePartyPerform(spaceSum) {
    document.querySelectorAll('.footer').forEach((el) => el.style.display = 'inline-block');
    var el = document.querySelector('.party.action,.perform.action');
    el.onclick = async (event) => {
      if (!isAdminOfSpace(spaceSum)) {
        return;
      }
      var res = await rpc('list', [rnameRPC]);
      if (!res.data) {
        console.log(res.error);
        return;
      }
      for (var i in res.data.peers) {
        var p = res.data.peers[i];
        if (p.id.substr(0, 36) == localStorage.getItem('uid')) {
          continue;
        }
        if (el.className == 'footer party action' && !p.mute ||
          el.className == 'footer perform action' && p.mute) {
          await rpc('mute', [
            rnameRPC,
            p.id,
          ]);
        }
      }
      if (el.className == 'footer party action') {
        el.className = 'footer perform action';
        el.textContent = performIcon;
      } else if (el.className == 'footer perform action') {
        el.className = 'footer party action';
        el.textContent = partyIcon;
      } else if (el.className == 'footer heart action') {
        // send heart to the space
      }
    };
    if (!isAdminOfSpace(spaceSum)) {
      el.className = 'footer heart action';
      el.textContent = heartIcon;
    }
  }

  async function adminMuteStateLoop(spaceSum) {
    var res = await rpc('list', [rnameRPC]);
    if (res.data) {
      var isPartyMode = true;
      for (var i in res.data.peers) {
        var p = res.data.peers[i];
        isPartyMode = isPartyMode && !p.mute;
        var id = p.id.substr(0, 36);
        var el = document.querySelector(`span[data-peer-id="${id}"]`);
        if (!el) {
          continue;
        }
        el.setAttribute('data-peer-name', p.id);
        el.style.display = 'inline-block';

        var isMyStream = id == localStorage.getItem('uid');
        if (p.mute) {
          var vi = visualizers[id];
          if (vi && vi.stream && vi.stream.getTracks().length > 0 && isMyStream) {
            vi.stream.getTracks()[0].enabled = false;
          }
          el.className = 'unmute action';
          el.textContent = muteIcon;
        } else if (!isMyStream){
          el.className = 'mute action';
          el.textContent = micIcon;
        }
      }
      if (isAdminOfSpace(spaceSum)) {
        var el = document.querySelector('.party.action,.perform.action');
        if (isPartyMode) {
          el.className = 'footer party action';
          el.textContent = partyIcon;
        } else {
          el.className = 'footer perform action';
          el.textContent = performIcon;
        }
      }
    }
    setTimeout(function () {
      adminMuteStateLoop(spaceSum);
    }, 1000);
  }

  function buildCanvas(stream, id, name, tid, spaceSum) {
    var old = document.getElementById(`peer-${id}`);
    var peer = htmlToElement(`<div class="peer" id="peer-${id}" data-track-id="${tid}"><canvas id="canvas-${id}"></canvas><div class="info"><span class="mute action" data-peer-id="${id}">${micIcon}</span><span class="name"></span></div></div>`)
    peer.querySelector('span.name').textContent = name;
    if (old) {
      old.replaceWith(peer);
    } else {
      document.getElementById('peers').prepend(peer)
    }
    visualizers[id] = { stream: stream }

    var canvas = document.getElementById(`canvas-${id}`);
    var el = peer.querySelector('.mute.action,.unmute.action');
    if (el.getAttribute('data-peer-id') == localStorage.getItem('uid')) {
      el.style.display = 'inline-block';
    }
    if (stream.getTracks().length > 0 && !stream.getTracks()[0].enabled) {
      el.className = 'unmute action';
      el.textContent = muteIcon;
    }
    el.onclick = async (event) => {
      var el = event.target;
      var id = el.getAttribute('data-peer-id');
      var isMyStream = id == localStorage.getItem('uid');
      if (!isMyStream && !isAdminOfSpace(spaceSum)) {
        return;
      }
      var vi = visualizers[id];
      if (el.className == 'mute action') {
        el.className = 'unmute action';
        el.textContent = muteIcon;
        if (vi && vi.stream && vi.stream.getTracks().length > 0 && isMyStream) {
          vi.stream.getTracks()[0].enabled = false;
        }
      } else {
        el.className = 'mute action';
        el.textContent = micIcon;
        if (vi && vi.stream && vi.stream.getTracks().length > 0 && isMyStream) {
          vi.stream.getTracks()[0].enabled = true;
        }
      }
      if (isAdminOfSpace(spaceSum)) {
        var uname = el.getAttribute('data-peer-name');
        if (!uname || uname.substr(0, 36) != id) {
          return;
        }
        var res = await rpc('mute', [
          rnameRPC,
          uname,
        ]);
        console.log('mute', id, res);
      }
    };

    var analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    analyser.minDecibels = -80;
    analyser.maxDecibels = -10;
    analyser.smoothingTimeConstant = 0.85;
    audioCtx.createMediaStreamSource(stream).connect(analyser);
    visualize(id, canvas, analyser, tid);
  }

  function visualize(id, canvas, analyser, tid) {
    var canvasCtx = canvas.getContext("2d");
    var bufferLength = analyser.frequencyBinCount;
    var dataArray = new Float32Array(bufferLength);
    var gb = uuidToColor(id);
    var g = gb[0], b = gb[1];
    var MIN = 7;

    function draw() {
      var WIDTH = canvas.width;
      var HEIGHT = canvas.height;

      analyser.getFloatFrequencyData(dataArray);

      canvasCtx.fillStyle = 'rgb(0, 0, 0)';
      canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

      var barWidth = (WIDTH / bufferLength) * 2.5;
      var barHeight, point, x = 0;

      for (var i = 0; i < bufferLength; i++) {
        point = dataArray[i];
        barHeight = (point + 140)*2;
        if (point == -Infinity) {
          barHeight = 16;
        }

        var r = Math.floor(barHeight + 64);
        if (r > 255) {
          r = 255;
        }
        if (g % 3 === 0) {
          canvasCtx.fillStyle = `rgb(${r},${g},${b})`;
        } else if (g % 3 === 1) {
          canvasCtx.fillStyle = `rgb(${g},${r},${b})`;
        } else {
          canvasCtx.fillStyle = `rgb(${g},${b},${r})`;
        }

        barHeight = HEIGHT / MIN + barHeight / 256 * HEIGHT * (MIN - 1) / MIN;
        if (barHeight < HEIGHT / MIN) {
          barHeight = HEIGHT / MIN;
        }
        canvasCtx.fillRect(x,HEIGHT-barHeight,barWidth,barHeight);

        x += barWidth + 1;
      }

      var el = document.getElementById('peer-'+id);
      if (el && el.getAttribute('data-track-id') === tid) {
        var interval = 50;
        var al = el.querySelector('span.action');
        if (al.className.indexOf('unmute') >= 0) {
          interval = 100;
        }
        setTimeout(function () {
          requestAnimationFrame(draw);
        }, interval);
      }
    };

    draw();
  }

  async function rpc(method, params = []) {
    // console.log('RPC', method, params);
    try {
      const response = await fetch(KRAKEN_API, {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'omit', // include, *same-origin, omit
        headers: {
          'Content-Type': 'application/json'
        },
        redirect: 'follow', // manual, *follow, error
        referrerPolicy: 'no-referrer', // no-referrer, *client
        body: JSON.stringify({id: uuidv4(), method: method, params: params}) // body data type must match "Content-Type" header
      });
      return response.json(); // parses JSON response into native JavaScript objects
    } catch (err) {
      console.log('fetch error', method, params, err);
      return await rpc(method, params);
    }
  }

  function createSpace() {
    var seed = uuidv4();
    var sum = CryptoJS.MD5(seed).toString();
    localStorage.setItem(sum, seed);
    return sum;
  }

  function createE2EEContext(spaceSum) {
    var key = getHashParam(e2eeAnchorParam);
    var supportDetails = window.KrakenE2EE && window.KrakenE2EE.getSupportDetails
      ? window.KrakenE2EE.getSupportDetails()
      : null;
    console.log('[kraken-e2ee] bootstrap', {
      hasShim: !!window.KrakenE2EE,
      hasKey: !!key,
      protocol: window.location.protocol,
      isSecureContext: typeof window.isSecureContext === 'boolean' ? window.isSecureContext : null,
      support: supportDetails
    });
    if (!key) {
      if (isAdminOfSpace(spaceSum)) {
        key = generateE2EEKey();
        setHashParam(e2eeAnchorParam, key);
        console.log('[kraken-e2ee] generated room key for admin');
      } else {
        console.log('[kraken-e2ee] missing room key for non-admin join');
        showBlockingOverlay('This room is end-to-end encrypted. Open it with a URL that includes #key=...');
        return { enabled: false };
      }
    }

    if (supportDetails && (!supportDetails.hasSubtleCrypto || supportDetails.isSecureContext === false)) {
      console.log('[kraken-e2ee] secure context requirement failed', {
        protocol: window.location.protocol,
        host: window.location.host,
        support: supportDetails
      });
      showBlockingOverlay('End-to-end encryption requires a secure context. Open this room over HTTPS or from http://localhost so Firefox can enable WebCrypto AES.');
      return { enabled: false };
    }

    if (!window.KrakenE2EE || !window.KrakenE2EE.supportsE2EE()) {
      console.log('[kraken-e2ee] browser support check failed', {
        hasShim: !!window.KrakenE2EE,
        support: supportDetails
      });
      showBlockingOverlay('This browser cannot apply the WebRTC audio transforms needed for end-to-end encryption.');
      return { enabled: false };
    }

    var worker = null;
    if (window.KrakenE2EE.usesWorkerTransforms()) {
      try {
        worker = window.KrakenE2EE.createWorker();
        console.log('[kraken-e2ee] worker created');
      } catch (error) {
        console.error(error);
        console.log('[kraken-e2ee] worker creation failed', error);
        showBlockingOverlay('The end-to-end encryption worker could not be started in this browser.');
        return { enabled: false };
      }
    }

    return {
      enabled: true,
      key: key,
      worker: worker,
      encryptors: new WeakSet(),
      decryptors: new WeakSet()
    };
  }

  function isAdminOfSpace(sum) {
    var seed = localStorage.getItem(sum);
    return seed && CryptoJS.MD5(seed).toString() === sum;
  }

  function uuidv4() {
    const randomValues = new Uint8Array(16);
    window.crypto.getRandomValues(randomValues);
    randomValues[6] = (randomValues[6] & 0x0f) | 0x40; // Set the version to 4
    randomValues[8] = (randomValues[8] & 0x3f) | 0x80; // Set the variant to 10
    return Array.from(randomValues).map((value, index) => {
      const hex = value.toString(16).padStart(2, '0');
      if (index === 4 || index === 6 || index === 8 || index === 10) {
        return '-' + hex;
      }
      return hex;
    }).join('');
  }

  function htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
  }

  function uuidToColor(id) {
    var g = 0, b = 0;
    for (var i = 0; i < id.length/2; i++) {
      var code = id.charCodeAt(i);
      g = g + code;
      code = id.charCodeAt(i*2);
      b = b + code;
    }
    return [g % 256, b % 256];
  }

  function getUrlParam(name) {
    name = name.replace(/\\/g, '\\\\').replace(/\[/g, '\\[').replace(/\]/g, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(window.location.search);
    return results === null ? '' : fixedDecodeURIComponent(results[1]);
  }

  function getHashParam(name) {
    var params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    return params.get(name) || '';
  }

  function setHashParam(name, value) {
    var params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    params.set(name, value);
    var hash = params.toString();
    window.history.replaceState(null, '', window.location.pathname + window.location.search + (hash ? '#' + hash : ''));
  }

  function buildHashString(params) {
    return '#' + (new URLSearchParams(params)).toString();
  }

  function fixedEncodeURIComponent(str) {
    return encodeURIComponent(str).replace(
      /[!'()*]/g,
      (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
    ).replace(/%20/g, '+');
  }

  function fixedDecodeURIComponent(str) {
    return decodeURIComponent(str.replace(/\+/g, ' '));
  }

  function generateE2EEKey() {
    var bytes = new Uint8Array(32);
    window.crypto.getRandomValues(bytes);
    var chars = [];
    bytes.forEach((value) => chars.push(String.fromCharCode(value)));
    return btoa(chars.join('')).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }

  function attachE2EETransform(target, operation, context) {
    var registry = operation === 'encrypt' ? context.encryptors : context.decryptors;
    if (!target || registry.has(target)) {
      return !!target;
    }
    var attached = window.KrakenE2EE.attachTransform(target, {
      operation: operation,
      key: context.key,
      worker: context.worker,
      allowUnencrypted: false
    });
    if (attached) {
      registry.add(target);
    }
    return attached;
  }

  function showBlockingOverlay(message) {
    document.getElementById('home').style.display = 'none';
    document.getElementById('join-form').style.display = 'none';
    document.getElementById('microphone').style.display = 'none';

    var overlay = document.getElementById('overlay');
    overlay.innerHTML = '<p></p>';
    overlay.querySelector('p').textContent = message;
    overlay.style.display = 'block';
  }
};
