import {baseDriverModule} from '../core/base-driver-module';
import {inspect} from 'util';
import {spawn} from "child_process";


class Mediamtx extends baseDriverModule {
  mediaMtxDir= "/srv/mediamtx";
  mediaMtxVersion= "1.9.1";
  mediaMtxBaseUrl= "https://github.com/bluenviron/mediamtx/releases/download";

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

    const mediaMtxFile=`mediamtx_v${this.mediaMtxVersion}_${platform}_${arch2}.tar.gz`
    const mediaMtxFileUrl= `${this.mediaMtxBaseUrl}/v${this.mediaMtxVersion}/${mediaMtxFile}`

    if (this.logging) {
      this.log('install-try, platform: ', platform, ', arch: ', arch);
      this.log('MediaMtx file: ', mediaMtxFile);
      this.log('MediaMtx file url: ', mediaMtxFileUrl);
    }

    const http = require('follow-redirects').https;
    const fs = require('fs');

    fs.mkdirSync(this.mediaMtxDir, { recursive: true });

    let that = this;

    const file = fs.createWriteStream(`${this.mediaMtxDir}/${mediaMtxFile}`);
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
          C: `${that.mediaMtxDir}/`,
          file: `${that.mediaMtxDir}/${mediaMtxFile}`,
          sync: true
        });

        if (that.logging) {
          that.log('MediaMtx decompressed');
        }

        fs.unlink(`${that.mediaMtxDir}/${mediaMtxFile}`, (err) => {
          if (err) throw err;

          if (that.logging) {
            that.log('MediaMtx archive was deleted');
          }

          that.run();
        });
      });
    });
  }

  createService(): void {
    const mustache = require('mustache');
    const fs = require('fs');

    const template = fs.readFileSync('config/mediamtx.service', 'utf8');
    const output = mustache.render(template, {
      MediaMtxDir: this.mediaMtxDir
    });

    fs.writeFileSync('/etc/systemd/system/mediamtx.service', output, 'utf8');

    const { spawn } = require('child_process');
    spawn('systemctl daemon-reload');
    spawn('systemctl start mediamtx');
    spawn('systemctl enable mediamtx.service');
  }

  run(): void {
    const fs = require('fs');
    fs.copyFile(
        "config/mediamtx.yml",
        `${this.mediaMtxDir}/mediamtx.yml`,
        (err) => {}
    );

    const mediaMtxCmd = `${this.mediaMtxDir}/mediamtx ${this.mediaMtxDir}/mediamtx.yml`
    if (this.logging) {
      this.log('MediaMtx command: ', mediaMtxCmd);
    }

    const { spawn } = require('child_process');
    const mediamtx = spawn(
        `${this.mediaMtxDir}/mediamtx`,
        [`${this.mediaMtxDir}/mediamtx.yml`]
    );

    if (this.logging) {
      this.log('MediaMtx was started');
    }
  }
}

process.on('uncaughtException', (err) => {
  console.error(`${err ? err.message : inspect(err)}`);
});

const app = new Mediamtx();
app.logging = true;
app.install();
// app.initDevice({
//   params: {}
// }).then(() => {
//   app.connect({id: 1}).then(() => {
//     app.subDevices({})
//   })
// })
