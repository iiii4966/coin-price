import {Sender} from "@questdb/nodejs-client";


export class Quest {
    client;
    connected = false;
    host;
    port;
    bufferSize;

    constructor(options = {}) {
        this.host = options.DB_HOST;
        this.port = options.QUEST_DB_PORT;
        this.bufferSize = options.bufferSize ?? 8192;
        this.client = new Sender({bufferSize: this.bufferSize});
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
                .timestampColumn('created_at', Date.now() * 1000)
                .at(trade.timestamp, 'ms'); // epoch in millis
        }
        await client.flush();
    }

    async writeCandles(exchange, candleUnit, candles) {
        const client = await this.connect();
        for (const candle of candles) {
            client
                .table(`${exchange}_candle_${candleUnit}`)
                .symbol('symbol', candle.symbol)
                .floatColumn('open', candle.open)
                .floatColumn('close', candle.close)
                .floatColumn('high', candle.high)
                .floatColumn('low', candle.low)
                .floatColumn('volume', candle.volume)
                .timestampColumn('created_at', candle.createdAt ?? 0)
                .at(candle.start, 'ms');
        }
        await client.flush();
    }
}
