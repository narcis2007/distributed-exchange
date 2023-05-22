# Distributed Exchange
This project is a simplified example of a distributed order book, which allows clients to submit buy and sell orders. It is built on the Grenache technology stack.


# How to Run the Project
- `npm install`
 

Run 2 Grapes:
- `grape --dp 20002 --aph 40001 --bn '127.0.0.1:20001'`
- `grape --dp 20001 --aph 30001 --bn '127.0.0.1:20002'`

Start the nodes of the order book with

- `npm run start-orderbook-node1`
- `npm run start-orderbook-node2`

You can then start adding orders with 

`cross-env NODE_ENV=node[number] node .\addOrder.js [price] [quantity] [type=buy/sell]`


# How It Works
When an order is submitted, it is processed by the node that the order was submitted to. The order is then synced with all other nodes, so each node maintains a complete record of the order book. The syncing process is done in a decentralized manner, where each node announces its services and other nodes pick up those announcements.

Each node runs its own instance of the order book. When a client submits an order to a node, that order is distributed to all other nodes.
If a client's order matches with another order, what remaines is added to the orderbook too

# Potential Improvements
- Implementing a persistent storage mechanism for the order book would prevent data loss when a node goes down.

- Error handling and logging could be improved.

- Code quality could be further improved by introducing unit tests, integrating a linter...

- Enhancing the order matching algorithm. Currently, it simply matches orders based on price. Other factors could be taken into consideration to improve the matching process.

- Adding more extensive input validation to ensure that the data being processed is valid.

- The current design assumes that all nodes are trustworthy and will correctly follow the protocol. In a real-world scenario, some kind of consensus mechanism or error checking would likely be needed to ensure that all nodes agree on the state of the order book.
