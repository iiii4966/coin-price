import {version, exchanges, bithumb as Bithumb, pro} from 'ccxt';

const watchAll = async (channel, params = {}) => {
    const upbit = new pro.upbit();
    await upbit.loadMarkets();

    const markets = await upbit.fetchMarkets()
    let symbols = markets.map(m => m.symbol)

    for (const s of symbols) {
        upbit.options[channel] = upbit.safeValue(upbit.options, channel, {});
        upbit.options[channel][s] = true
    }

    symbols = Object.keys(upbit.options[channel]);
    const marketIds = upbit.marketIds(symbols);
    const request = [
        {
            'ticket': upbit.uuid(),
        },
        {
            'type': channel,
            'codes': marketIds,
            // 'isOnlySnapshot': false,
            // 'isOnlyRealtime': false,
        },
    ];

    const hashes = marketIds.map(m => channel + ':' + m);
    const url = upbit.urls['api']['ws'];

    while (true) {
        try {
            const trades = await upbit.watchMultiple(url, hashes, request, hashes);
            console.log(trades)
        } catch (e) {
            throw e
        }
    }
}

(async () => {
    let upbit = new pro.upbit()
    let markets = await upbit.fetchMarkets()
    await watchAll('trade')
}) ()