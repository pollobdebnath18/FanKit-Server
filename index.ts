const express = require("express");
const app = express();
const port = 8000;

app.get("/", (req, res) => {
  res.send("Hello World. THis is FanKit Server");
});

app.listen(port, () => {
  console.log(`Example app is running  on port ${port}`);
});
