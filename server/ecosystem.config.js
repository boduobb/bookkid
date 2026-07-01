{
  "apps": [
    {
      "name": "xiaoshutong-server",
      "script": "index.js",
      "instances": 1,
      "exec_mode": "fork",
      "watch": false,
      "env": {
        "NODE_ENV": "production",
        "PORT": 3000
      },
      "error_file": "./logs/error.log",
      "out_file": "./logs/out.log",
      "log_date_format": "YYYY-MM-DD HH:mm:ss"
    }
  ]
}