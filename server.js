const bodyParser = require('body-parser');
const express = require('express');
const fs = require('fs');
const http = require('http');

const app = express();

app.use(bodyParser.raw({
  type: 'image/png',
}));

app.get('/', (req, res) => {
  res
    .type('html')
    .send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <link rel="icon" type="image/png" href="favicon.png">
          <title>Hot Tiles</title>
        </head>

        <body>
          <canvas height="16" width="16"></canvas>
          <script src="index.js"></script>
        </body>
      </html>
    `)
  ;
});

app.get('/index.js', (req, res) => {
  res.sendFile('index.js', { root: `${__dirname}/` });
});

app.get('/favicon.png', (req, res) => {
  res.sendFile('favicon.png', { root: `${__dirname}/` });
});

app.put('/tile/:index', (req, res, next) => {
  const { index } = req.params;

  fs.writeFileSync(`tile_${index}.png`, req.body, null);

  res
    .status(201)
    .end()
  ;
});

const server = http.createServer(app);

server.listen(() => {
  console.log(`App listening on port ${server.address().port}`);
});
