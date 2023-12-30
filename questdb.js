import {Sender} from "@questdb/nodejs-client";


export class QuestDB {
    client;
    connected = false;
    host;
    port;
    bufferSize;

    constructor({host, port, bufferSize} = {host: 'localhost', port: 9009, bufferSize: 8192}) {
        this.bufferSize = bufferSize;
        this.host = host;
        this.port = port;
        this.client = new Sender({bufferSize});
    }

    async connect(){
        if (!this.connected || !this.client.socket) {
            await this.client.connect({host: this.host, port: this.port});
            this.connected = true
        }
        return this.client
    }

    async close() {
        if (this.connected) {
            await this.client.close()
        }
    }

    async writeTrades(exchange, trades) {
        const client = await this.connect()
        for (const trade of trades) {
            client
                .table(`${exchange}_trade`)
                .symbol('symbol', trade.symbol)
                .symbol('side', trade.side)
                .floatColumn('price', trade.price)
                .floatColumn('amount', trade.amount)
                .at(trade.timestamp, 'ms'); // epoch in millis
        }
        await client.flush();
    }
}