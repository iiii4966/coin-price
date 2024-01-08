module.exports = {
  apps : [
      {
          name: 'bithumb_candle_1m_collector',
          script: 'cmd/bithumb_candle_1m_collector.js',
          max_memory_restart: '1G',
          time: true,
          autorestart: true,
      },
      {
          name: 'bithumb_candles_collector',
          script: 'cmd/bithumb_candles_collector.js',
          max_memory_restart: '1G',
          time: true,
          autorestart: true,
      }
  ],
};
