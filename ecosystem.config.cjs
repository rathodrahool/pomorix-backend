module.exports = {
    apps: [
        {
            name: "pomorix-backend",
            script: "./dist/src/main.js", // NestJS compiled output
            instances: 1,
            exec_mode: "fork",
            watch: false,
            max_memory_restart: "500M",
            error_file: "./logs/err.log",
            out_file: "./logs/out.log",
            log_file: "./logs/combined.log",
            time: true,
            merge_logs: true,
            autorestart: true,
            max_restarts: 10,
            min_uptime: "10s",
            env: {
                NODE_ENV: "production",
                PORT: 3000,
            },
        },
    ],
};
