function uInt8ArrayToString(array) {
    return String.fromCharCode.apply(null, array);
}

function stringToUInt8Array(str)
{
    return Uint8Array.from(str, c => c.charCodeAt(0));
}

function base64DecodeUint8Array(input) {
    return Uint8Array.from(atob(input), c => c.charCodeAt(0));
}

function base64DecodeUint8Array2(input) {
    return Uint8Array.from(input);
}

function base64EncodeUint8Array(input) {
    return btoa(uInt8ArrayToString(input));
}

function waitFor(target, type) {
    return new Promise(resolve => {
        target.addEventListener(type, resolve, { once: true });
    });
}

async function fetchBuffer(url) {
    let result = await fetch(url);
    let buffer = await result.arrayBuffer();
    return buffer;
}

async function fetchAndAppend(sourceBuffer, url) {
    let buffer = await fetchBuffer(url);
    sourceBuffer.appendBuffer(buffer);
    await waitFor(sourceBuffer, 'updateend');
}

async function fetchAndWaitForEncrypted(video, sourceBuffer, url) {
    let updateEndPromise = fetchAndAppend(sourceBuffer, url);
    let event = await waitFor(video, 'encrypted');
    let session = await encrypted(event);
    await updateEndPromise;
    return session;
}

async function loadCertificate() {
    if (!navigator.vendor.includes('Apple')) {
        alert('This demo will only work with Safari');
    }
    else {
        const params = new URLSearchParams(window.location.search);
        let serverCertificatePath = params.get('crt') || '';

        if (serverCertificatePath) {
            if (!serverCertificatePath.startsWith('http'))
                serverCertificatePath = `https://${serverCertificatePath}`;

            try {
                let response = await fetch(serverCertificatePath);
                window.certificate = await response.arrayBuffer();
                console.log(`Set FPS certificate, ${window.certificate.byteLength} bytes`);
                return true;
            }
            catch(e) {
                window.console.error(`Could not load certificate at ${serverCertificatePath}`);
            }
        }
    }
    return false;
}

async function getResponse(event, spcPath) {
    let headers = new Headers();
    let customDataObject = {userId:'purchase', sessionId:'p0', merchant:'six'};

    const serializedCustomData = btoa(JSON.stringify(customDataObject));
    headers.append('dt-custom-data', serializedCustomData);

    // Request
    const request = new Request(
        spcPath,
        {
            method: 'POST',
            headers: headers,
            body: event.message
        }
    );
    let response = await fetch(request);
    let license = await response.text();
    return base64DecodeUint8Array(license);
}
