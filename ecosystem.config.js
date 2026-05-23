module.exports = {
  apps: [
    {
      name: 'quizminia',
      script: 'dist/main.js',
      instances: 'max',
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '1G',
      env_file: '.env',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
