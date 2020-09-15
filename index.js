window.onload = function() {

  const KRAKEN_API = 'https://rpc.kraken.fm';

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

  const micIcon = '🎤', muteIcon = '🔇';
  const partyIcon = '🎉', performIcon = '🗣';

  var uid = localStorage.getItem('uid');
  if (!uid) {
    uid = uuidv4();
    localStorage.setItem('uid', uid);
  }

  var rname = location.pathname.split('/')[1];
  //rname = getUrlParam('room'); // DEV FIXME
  if (!rname || rname.trim() === '') {
    document.querySelector('.room.random').innerHTML = uuidv4();
    document.getElementById('invalid').style.display = 'block';
    return;
  }

  var name = localStorage.getItem(rname+':'+uid);
  if (!name || name === '') {
    document.getElementById('form').style.display = 'block';
    document.getElementById('name-submit').onclick = function () {
      var val = document.querySelector('input[name="name"]').value;
      if (!val || val.trim() === '') {
        alert('name can not be empty');
      } else if (val.length > 32) {
        alert('name too long, at most 32 characters');
      } else {
        localStorage.setItem(rname+':'+uid, val);
        window.location.reload(false);
      }
    };
    return;
  }
  uname = uid + ':' + Base64.encode(name);

  const rnameRPC = encodeURIComponent(rname);
  const unameRPC = encodeURIComponent(uname);

  var ucid = "";
  var visulizers = {};
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
    iceTransportPolicy: 'relay',
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require',
    sdpSemantics: 'unified-plan'
  };

  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();

  async function subscribe(pc) {
    var res = await rpc('subscribe', [rnameRPC, unameRPC, ucid]);
    if (res.error && typeof res.error === 'string' && res.error.indexOf(unameRPC + ' not found in')) {
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

  async function start() {
    try {
      document.querySelectorAll('.peer').forEach((el) => el.remove());

      var res = await rpc('turn', [unameRPC]);
      if (res.data && res.data.length > 0) {
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

        var stream = event.streams[0];
        var sid = decodeURIComponent(stream.id);
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

        buildCanvas(stream, id, name, event.track.id);
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
      buildCanvas(stream, uid, name, 'me');
      resizeVisulizers();
      handlePartyPerform();
      audioCtx.resume();

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });
      await pc.setLocalDescription(await pc.createOffer());

      res = await rpc('publish', [rnameRPC, unameRPC, JSON.stringify(pc.localDescription)]);
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

  function handlePartyPerform() {
    document.querySelectorAll('.footer').forEach((el) => el.style.display = 'inline-block');
    var el = document.querySelector('.party.action,.perform.action');
    el.onclick = (event) => {
      if (el.className == 'footer party action') {
        el.className = 'footer perform action';
        el.innerHTML = performIcon;
        document.querySelectorAll('.peer').forEach((peer) => {
          var ae = peer.querySelector('.action');
          var id = ae.getAttribute('data-peer-id');
          if (id === uid) {
            return;
          }
          ae.className = 'unmute action';
          ae.innerHTML = muteIcon;
          var vi = visulizers[id];
          if (vi && vi.stream && vi.stream.getTracks().length > 0) {
            vi.stream.getTracks()[0].enabled = false;
          }
        });
      } else if (el.className == 'footer perform action') {
        el.className = 'footer party action';
        el.innerHTML = partyIcon;
        document.querySelectorAll('.peer').forEach((peer) => {
          var ae = peer.querySelector('.action');
          var id = ae.getAttribute('data-peer-id');
          if (id === uid) {
            return;
          }
          ae.className = 'mute action';
          ae.innerHTML = micIcon;
          var vi = visulizers[id];
          if (vi && vi.stream && vi.stream.getTracks().length > 0) {
            vi.stream.getTracks()[0].enabled = true;
          }
        });
      }
    };
  }

  function buildCanvas(stream, id, name, tid) {
    var old = document.getElementById(`peer-${id}`);
    var peer = htmlToElement(`<div class="peer" id="peer-${id}" data-track-id="${tid}"><canvas id="canvas-${id}"></canvas><div class="info"><span class="mute action" data-peer-id="${id}">${micIcon}</span><span class="name">${name}</span></div></div>`)
    if (old) {
      old.replaceWith(peer);
    } else {
      document.getElementById('peers').prepend(peer)
    }
    visulizers[id] = { stream: stream }

    var canvas = document.getElementById(`canvas-${id}`);
    var el = peer.querySelector('.mute.action,.unmute.action');
    if (stream.getTracks().length > 0 && !stream.getTracks()[0].enabled) {
      el.className = 'unmute action';
      el.innerHTML = muteIcon;
    }
    el.onclick = (event) => {
      var el = event.target;
      var id = el.getAttribute('data-peer-id');
      var vi = visulizers[id];
      if (el.className == 'mute action') {
        el.className = 'unmute action';
        el.innerHTML = muteIcon;
        if (vi && vi.stream && vi.stream.getTracks().length > 0) {
          vi.stream.getTracks()[0].enabled = false;
        }
      } else {
        el.className = 'mute action';
        el.innerHTML = micIcon;
        if (vi && vi.stream && vi.stream.getTracks().length > 0) {
          vi.stream.getTracks()[0].enabled = true;
        }
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

        var r = Math.floor(barHeight + 64);
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
        setTimeout(function () {
          requestAnimationFrame(draw);
        }, 50)
      }
    };

    draw();
  }

  async function rpc(method, params = []) {
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

  function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
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
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(window.location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
  }

};
