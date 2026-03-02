module.exports = {
  apps: [
    {
      name: 'alp-web',
      cwd: './core/web',
      script: 'node_modules/.bin/next',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      max_memory_restart: '512M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/alp-web-error.log',
      out_file: './logs/alp-web-out.log',
      merge_logs: true,
    },
  ],
};
