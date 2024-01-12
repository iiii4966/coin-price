module.exports = {
  apps : [
      {
          name: 'upbit_candle_1m_collector',
          script: 'cmd/upbit_candle_1m_collector.js',
          max_memory_restart: '1G',
          time: true,
          autorestart: true,
          env: {
              TZ: 'UTC'
          }
      },
      {
          name: 'upbit_candles_aggregator',
          script: 'cmd/upbit_candles_aggregator.js',
          max_memory_restart: '1G',
          time: true,
          autorestart: true,
          env: {
              TZ: 'UTC'
          }
      },
  ],
};
