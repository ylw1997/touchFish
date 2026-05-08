const { createApp } = require("./app");

const port = Number(process.env.PORT || 3210);
const host = process.env.HOST || "127.0.0.1";

createApp().listen(port, host, () => {
  console.log(`TouchFish server listening on http://${host}:${port}`);
});
