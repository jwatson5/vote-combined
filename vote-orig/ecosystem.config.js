module.exports = {
  apps : [{
    name: 'Vote App',
    script: 'index.js',
    instances: 1,
    autorestart: true,
    watch: ['./index.js', './lib/'],
    autorestart: true,
    min_uptime: 1000,
    max_restarts: 1,
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    }
    //args: 'one two',
  }]

  //deploy : {
  //  production : {
  //    user : 'node',
  //    host : '212.83.163.1',
  //    ref  : 'origin/master',
  //    repo : 'git@github.com:repo.git',
  //    path : '/var/www/production',
  //    'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production'
  //  }
  //}
};
