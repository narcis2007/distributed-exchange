const { PeerRPCClient }  = require('grenache-nodejs-http');
const Link = require('grenache-nodejs-link');
require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` });

// Function to parse the command line arguments and construct an order object
function createOrderFromArgs(args) {
    // The arguments are: price, quantity, type
    return {
        price: parseFloat(args[0]),
        quantity: parseFloat(args[1]),
        type: args[2]
    };
}

// Function to create a link
function createLink(grape) {
    const link = new Link({ grape });
    link.start();
    return link;
}

// Function to create a peer
function createPeer(link) {
    const peer = new PeerRPCClient(link, {});
    peer.init();
    return peer;
}

// Function to submit an order
function submitOrder(peer, order) {
    peer.request('submitOrder' + process.env.PEER_ID, order, { timeout: 100000 }, (err, data) => {
        if (err) {
            console.error(err);
            process.exit(-1);
        }
        console.log(data);
    });
}

// Main program flow
const args = process.argv.slice(2);
const order = createOrderFromArgs(args);
const link = createLink(process.env.GRAPE);
const peer = createPeer(link);
submitOrder(peer, order);
