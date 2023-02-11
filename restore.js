import path from 'path';
import fs from 'fs';
import AWS from 'aws-sdk';
import exec from './exec.js';

AWS.config.update({
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
});

const uri = process.env.NEW_DATABASE_URI || process.env.URI;
const backupName = process.env.BACKUP_NAME;
const bucket = process.env.BUCKET;

const s3download = ({ bucketName, keyName }) => {
  const s3 = new AWS.S3();

  const params = {
    Bucket: bucketName,
    Key: keyName,
  };

  const file = fs.createWriteStream(keyName);

  return new Promise((resolve, reject) => {
    s3.getObject(params)
      .createReadStream()
      .on('end', () => {
        return resolve();
      })
      .on('error', (error) => {
        return reject(error);
      })
      .pipe(file);
  });
};

(async () => {
  const __dirname = path.resolve();

  const dumpPath = path.resolve(__dirname, backupName);
  const command = `mongorestore --uri '${uri}' --gzip --archive=${dumpPath}`;

  try {
    await s3download({
      bucketName: bucket,
      keyName: backupName,
    });

    await exec(command);

    console.log('Restore successful!');
  } catch (err) {
    console.log(`Restore failed: ${err}`);
  }
})();
