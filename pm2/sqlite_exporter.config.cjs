module.exports = {
  apps : [
      {
          name: 'sqlite_update_latest_candles',
          script: 'cmd/sqlite_update_latest_candles.js',
          max_memory_restart: '1G',
          time: true,
          autorestart: true,
          env: {
              TZ: 'UTC'
          }
      },
  ],
};
