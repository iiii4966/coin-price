module.exports = {
    apps : [
        {
            name: 'coin_db_candles_consistency_monitor',
            script: 'cmd/coin_db_candles_consistency_monitor.js',
            max_memory_restart: '1G',
            time: true,
            autorestart: true,
            env: {
                TZ: 'UTC'
            }
        },
    ],
};
