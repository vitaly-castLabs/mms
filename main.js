'use strict'

const params = new URLSearchParams(window.location.search);
let serverCertificatePath = params.get('crt') || '';
let serverLicensePath = params.get('lic') || '';

const video = document.querySelector('video');
video.disableRemotePlayback = true;

function runWithManagedMSE(testFunction, id = 'log') {
    var log = document.createElement('pre');
    log.setAttribute('id', id);
    document.body.appendChild(log);

    var logger = new Logger(id);

    if (!!!window.ManagedMediaSource) {
        info('Managed MediaSource API is not available');
        return;
    }
    var ms = new ManagedMediaSource();

    video.src = URL.createObjectURL(ms);
    video.preload = 'auto';

    testFunction(ms, video);
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
        var sb = ms.addSourceBuffer('video/mp4');

        const encrypted = await loadCertificate();

        if (encrypted) {
            // encrypted media
            await fetchAndWaitForEncrypted(el, sb, './media/bipbop-encrypted.mp4');
        }
        else  {
            await fetchAndLoad(sb, './media/bipbopinit', [''], '.mp4');
            await fetchAndLoad(sb, './media/bipbop', range(1, 13), '.m4s');
        }
        ms.endOfStream();
    });
}
window.startUp = startUp

async function encrypted(event) {
    console.log('encrypted event:', event);
    try {
        let initDataType = event.initDataType;
        if (initDataType !== 'sinf') {
            window.console.error(`Received unexpected initialization data type "${initDataType}"`);
            return;
        }

        let video = event.target;
        if (!video.mediaKeys) {
            let access = await navigator.requestMediaKeySystemAccess('com.apple.fps', [{
                initDataTypes: [initDataType],
                audioCapabilities: [{ contentType: 'audio/mp4', robustness: '' }],
                videoCapabilities: [{ contentType: 'video/mp4', robustness: '' }],
                distinctiveIdentifier: 'not-allowed',
                persistentState: 'not-allowed',
                sessionTypes: ['temporary']
            }]);

            let keys = await access.createMediaKeys();
            await keys.setServerCertificate(window.certificate);
            await video.setMediaKeys(keys);
        }

        let initData = event.initData;

        let session = video.mediaKeys.createSession();
        session.generateRequest(initDataType, initData);

        let message = await waitFor(session, 'message');
        let licensePath = params.get('lic') || '';
        if (!licensePath.startsWith('http'))
            licensePath = `https://${licensePath}`;
        let response = await getResponse(message, licensePath);
        await session.update(response);

        return session;
    } catch(e) {
        alert(`Could not start encrypted playback due to exception "${e}"`)
    }
}
