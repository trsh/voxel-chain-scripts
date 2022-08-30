import archiver from 'archiver';
import fs from 'fs';
import FormData from 'form-data';
import axios from 'axios';
import { readFile } from 'fs/promises';

const config = JSON.parse(
  await readFile(
    new URL('./config.json', import.meta.url)
  )
);

const SERVER_URL = 'http://localhost:3000';

/**
 * @param {String} sourceDir: /some/folder/to/compress
 * @param {String} outPath: /path/to/created.zip
 * @returns {Promise}
 */
async function zipDirectory(sourceDir, outPath) {
  const archive = archiver('zip', { zlib: { level: 9 } });
  const stream = fs.createWriteStream(outPath);

  return new Promise((resolve, reject) => {
    archive
      .directory(sourceDir, false)
      .on('error', err => reject(err))
      .pipe(stream)
      ;

    stream.on('close', () => resolve());
    archive.finalize();
  });
}

const zipPath = './build/transfer.zip';

await zipDirectory('./build/src/', zipPath);

// Prepeare POST form
const form = new FormData();
form.append('file', fs.createReadStream(zipPath));


// Prepeare headers and credentials
const basicHash = Buffer.from(`${config.userId}:${config.secret}`).toString('base64');
const request_config = {
  headers: {
    'Authorization': `Basic ${basicHash}`,
    ...form.getHeaders()
  }
};

console.log('Syncing scripts...');

// Send file
axios.post(SERVER_URL, form, request_config).then(function (response) {
  if (response.status === 200) {
    console.log('Scripts were synced!');
  } else {
    console.error(`Server responded with invalid status" '${response.status}'`);
  }
}).catch(function (error) {
  console.error(`Server responded with error: '${error.message}'`);
});
