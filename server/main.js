// Libs
import express from 'express';
import path from 'path';
import process from 'process';
import unzipper from 'unzipper';
import multer from 'multer';
import fs from 'fs';
import rimraf from 'rimraf';

// Local
import { authMW } from './auth.js';

// Constants
const __dirname = process.cwd();
const wordScriptsDir = './server/upload/world-scripts';
const app = express()
const port = 3000

// This should probably be a liteweight database, instead using static memory
let updated = {};

// Define disk storage rules
const storage = multer.diskStorage({
  destination: function (req, _file, cb) {
    const userId = req['userId'];
    const storeDir = path.join(wordScriptsDir, userId, req['worldId']);

    if (!fs.existsSync(storeDir)) {
      fs.mkdirSync(storeDir, { recursive: true });
    } else {
      rimraf.sync(`${storeDir}/*`);
    }

    req['upDir'] = storeDir;
    cb(null, storeDir);
  },
  filename: function (req, _file, cb) {
    const fileName = Date.now() + '-' + Math.round(Math.random() * 1E9);
    req['upFile'] = fileName;
    cb(null, fileName)
  }
})

const upload = multer({ storage: storage });

// Add auth middleware
app.use(authMW);

// Sync script POST request
app.post('/', upload.single('file'), (req, res) => {
  if (req['userId'] && req['worldId'] && req['upFile'] && req['upDir']) {
    const userId = req['userId'];
    const unzipPath = path.join(__dirname, req['upDir']);
    const zipPath = path.join(unzipPath, req['upFile']);

    fs.createReadStream(zipPath)
      .pipe(unzipper.Extract({ path: unzipPath }))
      .promise()
      .then(() => {
        fs.unlinkSync(zipPath);
        updated[userId] = 'main.js';
        res.send('OK');
      }).catch((e) => {
        const errMsg = e.message || String(e);
        console.error(errMsg);
        res.status(500).send(errMsg);
      });
  } else {
    const errMsg = 'Can\'t upload file';
    console.error(errMsg);
    res.status(500).send(errMsg);
  }
});

// For presenting the hot reload
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'server', 'index.html'));
});

// Keep alive request for script updates
app.get("/updates", (req, res) => {
  const userId = req['userId'];
  const worldId = req['worldId'];

  if (!userId || !worldId) {
    const errMsg = 'User ID/ World ID not present';
    console.error(errMsg);
    res.status(500).send(errMsg);
    return;
  }

  res.set({
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "Content-Type": "text/event-stream",
  });

  res.flushHeaders();

  const storeDir = path.join(wordScriptsDir, userId, worldId);

  if (fs.existsSync(storeDir)) {
    fs.readdirSync(storeDir).forEach(file => {
      if (file === 'main.js') {
        res.write(file);
      }
    });
  }

  const interval = setInterval(() => {
    if (updated[userId]) {
      const mainFileWithoutCache = updated[userId];
      delete updated[userId];
      res.write(mainFileWithoutCache);
    }
  }, 1500);

  res.on("close", () => {
    clearInterval(interval);
    res.end();
  });
})

// This is still filtered by auth middleware
app.use(express.static('./server/upload/world-scripts'));

// Run server
app.listen(port, () => {
  console.log(`Server app listening on port ${port}`);
})
