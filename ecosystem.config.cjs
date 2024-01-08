module.exports = {
  apps : [
      {
          name: 'bithumb_candle_1m_collector',
          script: 'cmd/bithumb_candle_1m_collector.js',
          max_memory_restart: '1G',
          time: true,
          autorestart: true,
          env: {
              TZ: 'UTC'
          }
      },
      {
          name: 'bithumb_candles_aggregator',
          script: 'cmd/bithumb_candles_aggregator.js',
          max_memory_restart: '1G',
          time: true,
          autorestart: true,
          env: {
              TZ: 'UTC'
          }
      }
  ],
};
