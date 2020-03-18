var localVideo;
var localStream;
var localDisplay;
var screenCaptureOn = false;
var displayStream;
var remoteVideo;
var peerConnections = {};
var uuid;
var serverConnection;
var potentialCandidates = [];

var peerConnectionConfig = {
    'iceServers': [
        { 'urls': 'stun:stun.stunprotocol.org:3478' },
        { 'urls': 'stun:stun.l.google.com:19302' },
    ],
    sdpSemantics: 'unified-plan'
};

document.addEventListener("DOMContentLoaded", () => {
    uuid = createUUID();

    localVideo = document.getElementById('localVideo');
    localDisplay = document.getElementById('screenCapture');

    serverConnection = new WebSocket('wss://' + window.location.hostname + ':443');

    console.log("Opened WS on :443")

    serverConnection.onmessage = gotMessageFromServer;

    var webcamConstraints = {
        video: true,
        audio: true,
    };

    if (navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia(webcamConstraints).then(getUserMediaSuccess).catch(errorHandler);
    } else {
        alert('Your browser does not support getUserMedia API');
    }

    localDisplay.addEventListener('click', (e) => {
        var screenConstraints = {
            video: true,
            audio: true
        }
        if (navigator.mediaDevices.getDisplayMedia) {
            navigator.mediaDevices.getDisplayMedia(screenConstraints).then(getDisplayMediaSuccess).catch(errorHandler);
        } else {
            alert('Your browser does not support getDisplayMedia API');
        }
    });

    document.getElementById("start").addEventListener("click", (e) => {
        start(uuid)
    });
});

function getDisplayMediaSuccess(screen) {
    screenCaptureOn = true;
    displayStream = screen;
    localDisplay.srcObject = displayStream;
    localDisplay.play();
}

function getUserMediaSuccess(stream) {
    localStream = stream;
    localVideo.srcObject = stream;
    localVideo.play();
}

function start(uid) {
    peerConnections[uid] = new RTCPeerConnection(peerConnectionConfig);
    peerConnections[uid].onicecandidate = gotIceCandidate;
    for (const track of localStream.getTracks()) {
        peerConnections[uid].addTrack(track, localStream);
      }
    for (const track of displayStream.getTracks()) {
    peerConnections[uid].addTrack(track, displayStream);
    }
}

function gotMessageFromServer(message) {

    var signal = JSON.parse(message.data);

    if (!peerConnections[signal.uuid]) start(signal.uuid);

    // Ignore messages from ourself
    if (signal.uuid == uuid) return;
    if (signal.sender == 'host') return;
    if (signal.sdp) {

        peerConnections[signal.uuid].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(function() {
            if (signal.sdp.type == 'offer') {
                
                peerConnections[signal.uuid].createAnswer().then( (desc) => {
                    createdDescription(desc, signal.uuid)
                }).catch(errorHandler);
            }
        }).catch(errorHandler);
    } else if (signal.ice) {
            peerConnections[signal.uuid].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(errorHandler);
    }
}

function gotIceCandidate(event) {
    if (event.candidate != null) {
        serverConnection.send(JSON.stringify({ 'ice': event.candidate, 'uuid': uuid, 'sender': 'host' }));
    }
}

function createdDescription(description, uid) {

    peerConnections[uid].setLocalDescription(description).then(function() {
        serverConnection.send(JSON.stringify({ 'sdp': peerConnections[uid].localDescription, 'uuid': uuid, sender: 'host'}));
    }).catch(errorHandler);
}

function errorHandler(error) {
    console.log(error);
}

function createUUID() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }

    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}