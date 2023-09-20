'use strict'

function runWithManagedMSE(testFunction, id = 'log') {
    var el = document.createElement('video');
    el.disableRemotePlayback = true;
    el.controls = true;
    document.body.appendChild(el);

    var log = document.createElement('pre');
    log.setAttribute('id', id);
    document.body.appendChild(log);

    var logger = new Logger(id);

    if (!!!window.ManagedMediaSource) {
        info('Managed MediaSource API is not available');
        return;
    }
    var ms = new ManagedMediaSource();

    el.src = URL.createObjectURL(ms);
    el.preload = 'auto';

    testFunction(ms, el);
}

function logEvents(events, target) {
    // Log events for debugging.
    function logEvent(e) {
        var v = e.target;
        info('got ' + e.type + ' event');
    }
    events.forEach(function(e) {
        target.addEventListener(e, logEvent);
    });
}

function startUp() {
    runWithManagedMSE(async (ms, el) => {
        // Log events for debugging.
        logEvents(['suspend', 'play', 'canplay', 'canplaythrough', 'loadstart', 'loadedmetadata',
                      'loadeddata', 'playing', 'ended', 'error', 'stalled', 'emptied', 'abort',
                      'waiting', 'pause', 'durationchange', 'seeking', 'seeked'], el);
        logEvents(['sourceopen', 'ended', 'startstreaming', 'endstreaming'], ms);

        await once(ms, 'sourceopen');
        ok(true, 'Receive a sourceopen event');
        var sb = ms.addSourceBuffer('video/mp4; codecs="mp4a.40.2,avc1.4d4015"');
        await fetchAndLoad(sb, './media/bipbopinit', [''], '.mp4');
        await fetchAndLoad(sb, './media/bipbop', range(1, 13), '.m4s');
        ms.endOfStream();
    });
}
window.startUp = startUp
