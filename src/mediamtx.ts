import {baseDriverModule} from '../core/base-driver-module';
import {inspect} from 'util';


class Mediamtx extends baseDriverModule {
  initDeviceEx(resolve, reject) {
    super.initDeviceEx(() => {
      resolve({});
    }, reject);
  }

  install(): void {
    const os = require('os');
    const platform = os.platform();
    const arch = os.arch();
    let arch2 = arch

    if (arch == 'x64') {
      arch2 = 'amd64'
    }

    const mediaMtxDir= "/srv/mediamtx"
    const mediaMtxVersion= "1.9.1"
    const mediaMtxBaseUrl= "https://github.com/bluenviron/mediamtx/releases/download"
    const mediaMtxFile=`mediamtx_v${mediaMtxVersion}_${platform}_${arch2}.tar.gz`
    const mediaMtxFileUrl= `${mediaMtxBaseUrl}/v${mediaMtxVersion}/${mediaMtxFile}`

    if (this.logging) {
      this.log('install-try, platform: ', platform, ', arch: ', arch);
      this.log('MediaMtx file: ', mediaMtxFile);
      this.log('MediaMtx file url: ', mediaMtxFileUrl);
    }

    const http = require('follow-redirects').https;
    const fs = require('fs');

    fs.mkdirSync(mediaMtxDir, { recursive: true });

    let that = this;

    const file = fs.createWriteStream(`${mediaMtxDir}/${mediaMtxFile}`);
    const request = http.get(mediaMtxFileUrl, function(response) {
      response.pipe(file);
      file.on("finish", () => {
        file.close();
        if (that.logging) {
          that.log('Download MediaMtx completed');
        }

        const tar = require('tar');
        tar.x({
          gzip: true,
          C: `${mediaMtxDir}/`,
          file: `${mediaMtxDir}/${mediaMtxFile}`,
          sync: true
        });

        if (that.logging) {
          that.log('MediaMtx decompressed');
        }

        fs.unlink(`${mediaMtxDir}/${mediaMtxFile}`, (err) => {
          if (err) throw err;

          if (that.logging) {
            that.log('MediaMtx archive was deleted');
          }
        });
      });
    });
  }
}

process.on('uncaughtException', (err) => {
  console.error(`${err ? err.message : inspect(err)}`);
});

const app = new Mediamtx();
// app.logging = true;
// app.install();
// app.initDevice({
//   params: {}
// }).then(() => {
//   app.connect({id: 1}).then(() => {
//     app.subDevices({})
//   })
// })
