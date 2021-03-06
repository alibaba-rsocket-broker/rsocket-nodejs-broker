const RSocketWebSocketClient = require('rsocket-websocket-client').default;
const {RSocketClient, MESSAGE_RSOCKET_ROUTING, APPLICATION_JSON, MESSAGE_RSOCKET_AUTHENTICATION} = require("rsocket-core");
const WebSocket = require('ws');
const {Single} = require("rsocket-flowable");

const appMetadata = {ip: '192.168.1.1', port: 8181, name: 'rsocket-app1'};

const rsocketClient = new RSocketClient({
    setup: {
        keepAlive: 300_000, //send keepalive every 5 minutes
        lifetime: 2147483647, //disable keepalive respond timeout
        metadataMimeType: APPLICATION_JSON._string,
        dataMimeType: APPLICATION_JSON._string,
        payload: {
            data: JSON.stringify(appMetadata),
            metadata: JSON.stringify({[MESSAGE_RSOCKET_AUTHENTICATION._string]: '12345'})
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
        metadataPush(payload) {
            if (payload.metadata) {
                console.log('metadataPush', payload.metadata);
                appMetadata.uuid = JSON.parse(payload.metadata).uuid;
            }
            return new Single(subscriber => {
                subscriber.onSubscribe();
                subscriber.onComplete(undefined);
            });
        },
    }
});

const monoRSocket = rsocketClient.connect();

monoRSocket.then(rsocket => {
    console.log("Begin to call com.example.UserService.findUserById");
    rsocket.requestResponse({
        data: JSON.stringify([1]),
        metadata: JSON.stringify(
            {
                [MESSAGE_RSOCKET_ROUTING._string]: [
                    "com.example.UserService.findUserById",
                    //"e=uuid"
                ]
            }
        )
    }).subscribe({
        onComplete: (payload) => console.log(payload),
        onError: error => {
            console.error(error);
        },
    });
});


