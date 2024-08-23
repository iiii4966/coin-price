import {CoinDBMonitor} from "../monitor/coin_db_monitor.js";
import {configDotenv} from "dotenv";
import {Postgres} from "../db/postgres.js";
import {Slack} from "../utils/slack.js";
import {CronJob} from "cron";

const bootstrap = async () => {
    const {parsed: config} = configDotenv();

    const db = new Postgres(config)

    const slack = new Slack({slackApiToken: config.SLACK_API_TOKEN})
    const monitor = new CoinDBMonitor({coinDB: db, slack})

    const everyHourMonitor = CronJob.from({
        cronTime: '0 */2 * * *',
        onTick: async () => {
            console.log('Start candle consistency monitor\n')
            try {
                const upbitSymbols = [
                    'BTC/KRW',
                    'BSV/KRW',
                    'BTG/KRW',
                    'ETC/KRW',
                    'ETH/KRW',
                    'POLYX/KRW',
                    'QKC/KRW',
                    'ICX/KRW',
                    'ATOM/KRW',
                    'ARDR/KRW',
                    'PUNDIX/KRW',
                    'ZRX/KRW',
                    'BAT/KRW',
                    'STEEM/KRW',
                    'HPO/KRW',
                    'CBK/KRW',
                    'UPP/KRW',
                    'AXS/KRW',
                    'ANKR/KRW',
                    'IOST/KRW',
                    'BCH/KRW',
                    'CELO/KRW',
                    'AQT/KRW',
                    'MOC/KRW',
                    'CVC/KRW',
                    'SSX/KRW',
                    'XLM/KRW',
                    'ZIL/KRW',
                    'ONT/KRW',
                    'PLA/KRW',
                    'GLM/KRW',
                    'EGLD/KRW',
                    'BTT/KRW',
                ]

                const options = [
                    {units: ['1m'], checkCount: 120},
                    {units: ['3m'], checkCount: 50},
                    {units: ['15m'], checkCount: 10},
                    {units: ['1h'], checkCount: 2},
                    {units: ['1d'], checkCount: 2},
                ]
                for (const {units, checkCount} of options) {
                    let param = {
                        exchangeName: 'upbit',
                        units: units,
                        symbols: upbitSymbols,
                        checkCount: checkCount,
                        isLogDiffCandlesToFile: false,
                        isLogSummaryToFile: true,
                        isLogSummaryToSlack: true,
                    }
                    await monitor.checkCoinDBCandlesConsistency(param)
                }


                const bithumbSymbols = [
                    'BTC/KRW',
                    'BSV/KRW',
                    'BTG/KRW',
                    'ETC/KRW',
                    'ETH/KRW',
                    'CTK/KRW',
                    'PUNDIX/KRW',
                    'BTT/KRW',
                    'OGN/KRW',
                    'OXT/KRW',
                    'DAO/KRW',
                    'WNCG/KRW',
                    'TEMCO/KRW',
                    'IOST/KRW',
                    'XPR/KRW',
                    'MVC/KRW',
                    'VALOR/KRW',
                    'ADP/KRW',
                    'NCT/KRW',
                    'GMX/KRW',
                    'EGLD/KRW',
                    'BEL/KRW',
                    'HBAR/KRW',
                    'ELF/KRW',
                    'JST/KRW',
                    'LBL/KRW',
                    'CSPR/KRW',
                    'BAL/KRW',
                    'PYR/KRW',
                    'FX/KRW',
                ]
                const bithumbOptions = [
                    {units: ['1m'], checkCount: 120},
                    {units: ['3m'], checkCount: 50},
                    {units: ['10m'], checkCount: 15},
                    {units: ['1h'], checkCount: 2},
                    {units: ['1d'], checkCount: 2},
                ]
                for (const {units, checkCount} of bithumbOptions) {
                    let param = {
                        exchangeName: 'bithumb',
                        units: units,
                        symbols: bithumbSymbols,
                        checkCount: checkCount,
                        isLogDiffCandlesToFile: false,
                        isLogSummaryToFile: true,
                        isLogSummaryToSlack: true,
                    }
                    await monitor.checkCoinDBCandlesConsistency(param)
                }
            } catch (e) {
                console.error(e);
            }
        },
    });

    everyHourMonitor.start()

    process.on('SIGINT', async () => {
        console.log('Shutdown candle consistency monitor')
        await db.close()
        process.exit()
    })
}

bootstrap().catch(console.error)
