import express from 'express';
import path from 'path';
import process from 'process';
import unzipper from 'unzipper';
import multer from 'multer';
import fs from 'fs';
import rimraf from 'rimraf';

const __dirname = process.cwd();
const wordScriptsDir = './server/upload/world-scripts';

const app = express()
const port = 3000

// This should probably be a liteweight database, instead using static memory
let updated = {};

const storage = multer.diskStorage({
  destination: function (req, _file, cb) {
    const userId = req['userId'];
    const storeDir = path.join(wordScriptsDir, `${userId}`);

    if (!fs.existsSync(storeDir)) {
      fs.mkdirSync(storeDir);
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

app.use((req, res, next) => {
  // TODO: here we should also check for real user session and userId
  if (req.method === 'GET') {
    const userId = req.query.userId;

    if (!userId) {
      return res.status(401).send('Invalid Authentication Credentials');
    }

    req['userId'] = userId;
    return next();
  }

  // Check for basic auth header
  if (!req.headers.authorization || req.headers.authorization.indexOf('Basic ') === -1) {
    return res.status(401).send('Missing Authorization Header');
  }

  // Verify auth credentials
  const base64Credentials = req.headers.authorization.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [userId, secret] = credentials.split(':');

  // TODO: Here we should call real authorization method
  if (userId !== '1' || secret !== '123') {
    return res.status(401).send('Invalid Authentication Credentials');
  }

  req['userId'] = userId;
  next()
})

const upload = multer({ storage: storage });

app.post('/', upload.single('file'), (req, res) => {

  if (req['userId'] && req['upFile'] && req['upDir']) {
    const userId = req['userId'];
    const unzipPath = path.join(__dirname, req['upDir']);
    const zipPath = path.join(unzipPath, req['upFile']);

    fs.createReadStream(zipPath)
      .pipe(unzipper.Extract({ path: unzipPath }))
      .promise()
      .then(() => {
        fs.unlinkSync(zipPath);
        const timeStamp = Date.now();
        const mainFileWithoutCache = `main-${timeStamp}.js`;
        fs.renameSync(path.join(unzipPath, 'main.js'), path.join(unzipPath, mainFileWithoutCache));
        updated[userId] = mainFileWithoutCache;
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

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'server', 'index.html'));
});

app.get("/updates", (req, res) => {
  const userId = req['userId'];

  if (!userId) {
    res.status(500).send('User ID not present');
    return;
  }

  res.set({
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "Content-Type": "text/event-stream",
  });
  res.flushHeaders();

  const storeDir = path.join(wordScriptsDir, `${userId}`);

  fs.readdirSync(storeDir).forEach(file => {
    if (file.startsWith('main-') && path.extname(file) === '.js') {
      res.write(file);
    }
  });

  const interval = setInterval(() => {
    if (updated[userId]) {
      const mainFileWithoutCache = updated[userId];
      delete updated[userId];
      res.write(mainFileWithoutCache);
    }
  }, 3000);

  res.on("close", () => {
    clearInterval(interval);
    res.end();
  });
})

// TODO: this should be not statics, but check user session and grant or deny access to script
app.use(express.static('./server/upload/world-scripts'));

app.listen(port, () => {
  console.log(`Server app listening on port ${port}`);
})
