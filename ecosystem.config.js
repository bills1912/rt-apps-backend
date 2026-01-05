require('dotenv').config()
module.exports = {
    apps: [
      {
        name: 'rt-app-api:' + process.env.PORT,
        script: './app.js', // or your main entry point
        instances: 1, // change to 'max' for clustering based on CPU cores
        exec_mode: 'cluster', 
        watch: false, // set to true if you want auto-restart on file changes (dev only)
        // env: {
        //   NODE_ENV: 'production',
        //   PORT: 3000, // or your custom port
        //   WHATSAPP_API_BASE_URL: 'https://api.whatsapp.com', // example env
        //   // add other env vars here
        // },
        error_file: './logs/error.log',
        out_file: './logs/output.log',
        log_file: './logs/combined.log',
        time: true, // show timestamp in logs
        max_memory_restart: '300M', // restart if memory exceeds
        restart_delay: 5000, // wait before restarting (useful for stability)
      },
    ],
  };
  