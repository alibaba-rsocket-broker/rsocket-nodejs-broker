const RSocketWebSocketClient = require('rsocket-websocket-client').default;
const {RSocketClient} = require("rsocket-core");
const WebSocket = require('ws');
const {Single} = require("rsocket-flowable");

const appMetadata = {ip: '192.168.1.2', port: 8182, name: 'rsocket-app2'};

const rsocketClient = new RSocketClient({
    setup: {
        keepAlive: 1000000,
        lifetime: 100000,
        metadataMimeType: 'message/x.rsocket.composite-metadata.v0',
        dataMimeType: 'application/json',
        payload: {
            data: JSON.stringify(appMetadata),
        }
    },
    transport: new RSocketWebSocketClient(
        {
            debug: true,
            url: 'ws://localhost:42252',
            wsCreator: url => new WebSocket(url)
        }
    ),
    responder: {
        requestResponse(payload) {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    resolve({
                        data: {
                            message: 'Hello, ' + payload.data.name + '!'
                        }
                    });
                }, 1000);
            });
        },
        fireAndForget(payload) {
            console.log('fireAndForget', payload.data);
        },
        metadataPush(payload) {
            if (payload.metadata) {
                console.log('metadataPush', payload.metadata);
                appMetadata.uuid = JSON.parse(payload.metadata).uuid;
            }
            return Single.of({});
        },
    }
});

const monoRSocket = rsocketClient.connect();

monoRSocket.then(rsocket => {
    rsocket.requestResponse({
        data: "leijuan",
        metadata: ''
    }).subscribe({
        onComplete: (payload) => console.log(payload),
        onError: error => {
            console.error(error);
        },
    });
});


