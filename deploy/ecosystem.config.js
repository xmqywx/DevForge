module.exports = {
  apps: [{
    name: "devforge",
    script: "npm",
    args: "start",
    cwd: "/opt/devforge",
    env: {
      NODE_ENV: "production",
      PORT: 3102,
      DATABASE_URL: "postgres://devforge:password@localhost:5432/devforge",
      UPLOAD_DIR: "/data/devforge/uploads",
    },
  }],
};
