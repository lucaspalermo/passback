module.exports = {
  apps: [
    {
      name: 'passback',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: '/var/www/passback',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};
