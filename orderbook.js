const { PeerRPCServer, PeerRPCClient }  = require('grenache-nodejs-http');
const Link = require('grenache-nodejs-link');
require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` });

// Split the SYNC_GRAPES and SYNC_GRAPES_IDS environment variables into arrays
const syncGrapes = process.env.SYNC_GRAPES.split(',');
const syncPeerIds = process.env.SYNC_GRAPES_IDS.split(',');

// Define an array to hold the order book
let orderbook = [];

// Create a link and a peer using the grape address from the environment variables
const link = createLink(process.env.GRAPE);
const peer = createPeer(link);

// Create a server transport and start listening on the port specified in the environment variables
const service = peer.transport('server');
service.listen(parseInt(process.env.SERVICE_PORT));

// Announce the submitOrder and syncOrder services at a regular interval
announceServices(service);

// Function to create a new link
function createLink(grape) {
    const link = new Link({ grape });
    link.start();
    return link;
}

// Function to create a new peer
function createPeer(link) {
    const peer = new PeerRPCServer(link, { timeout: 300000 });
    peer.init();
    return peer;
}

// Function to announce the submitOrder and syncOrder services
function announceServices(service) {
    setInterval(function () {
        link.announce('submitOrder' + process.env.PEER_ID, service.port, {});
        link.announce('syncOrder' + process.env.PEER_ID, service.port, {});
    }, 1000);
}
function processOrder(payload) {
    // Extract the type, price and quantity from the order payload
    const { price, quantity, type } = payload;

    // Find the opposite type for the order (if order type is 'buy', opposite is 'sell' and vice versa)
    const oppositeType = type === 'buy' ? 'sell' : 'buy';

    // Find matching orders in the orderbook
    const matchedOrders = orderbook.filter(order => order.type === oppositeType && order.price === price);

    let remainingQuantity = quantity;

    // Process the matched orders
    for (const order of matchedOrders) {
        if (order.quantity <= remainingQuantity) {
            remainingQuantity -= order.quantity;
            // remove the matched order from the orderbook
            orderbook = orderbook.filter(o => o !== order);
        } else {
            order.quantity -= remainingQuantity;
            remainingQuantity = 0;
        }

        // Break the loop if there's no remaining quantity
        if (remainingQuantity === 0) break;
    }

    // if there's remaining quantity, add it back to the orderbook
    if (remainingQuantity > 0) {
        orderbook.push({ price, quantity: remainingQuantity, type });
    }
}

// Function to handle a request
function handleRequest(rid, key, payload, handler) {
    console.log(rid, key, payload);
    // Check if the key starts with 'submitOrder' and process the order if it does
    if (key.startsWith('submitOrder')) {
        processOrder(payload);
        distributeOrder(payload);
    }
    // Check if the key starts with 'syncOrder' and process the order if it does
    if(key.startsWith('syncOrder')){
        processOrder(payload);
    }
    // Reply to the request
    handler.reply(null, { msg: 'ok' });
    console.log({ currentOrderbook: orderbook });
}

// Function to distribute an order to the other nodes in the network
function distributeOrder(payload) {
    syncGrapes.forEach(grape=>{
        const link = createLink(grape);
        const syncPeer = new PeerRPCClient(link, {});
        syncPeer.init();
        syncPeer.request('syncOrder' + syncPeerIds[syncGrapes.indexOf(grape)], payload, { timeout: 10000 }, (err, data) => {
            if (err) {
                console.error(err)
            }
        });
    });
}

// Attach the request handler to the server
service.on('request', handleRequest);
