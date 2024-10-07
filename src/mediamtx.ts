import {baseDriverModule} from '../core/base-driver-module';
import {inspect} from 'util';


class Mediamtx extends baseDriverModule {
  mediaMtxDir= "/srv/mediamtx";
  mediaMtxVersion= "1.9.1";
  mediaMtxBaseUrl= "https://github.com/bluenviron/mediamtx/releases/download";

  params = {
    type: 'rtsp', // rtsp or rpi
    source: 'rtsp://192.168.1.20/ch0_0.h264',
    width: 1280,
    height: 720,
  }

  get type() {
    return this.params.type;
  }

  get source() {
    return this.params.source;
  }

  get width() {
    return this.params.width;
  }

  get height() {
    return this.params.height;
  }

  get loadConfig() {
    return true;
  }

  installDeviceEx(resolve, reject) {
    const fs = require('fs');
    const os = require('os');
    const platform = os.platform();
    const arch = os.arch();

    if (
      fs.existsSync(`${this.mediaMtxDir}/mediamtx`) &&
      fs.existsSync(`${this.mediaMtxDir}/mediamtx.yml`)
    ) {
      this.app.log('MediaMtx already installed');
      return resolve({});
    }

    super.initDeviceEx(() => {
      let arch2 = arch

      if (arch == 'x64') {
        arch2 = 'amd64'
      }

      const mediaMtxFile = `mediamtx_v${this.mediaMtxVersion}_${platform}_${arch2}.tar.gz`
      const mediaMtxFileUrl = `${this.mediaMtxBaseUrl}/v${this.mediaMtxVersion}/${mediaMtxFile}`

      if (this.logging) {
        this.log('MediaMtx install, platform: ', platform, ', arch: ', arch);
        this.log('MediaMtx file: ', mediaMtxFile);
        this.log('MediaMtx file url: ', mediaMtxFileUrl);
      }

      const http = require('follow-redirects').https;

      fs.mkdirSync(this.mediaMtxDir, { recursive: true });

      let that = this;

      const file = fs.createWriteStream(`${this.mediaMtxDir}/${mediaMtxFile}`);
      const request = http.get(mediaMtxFileUrl, function (response) {
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
          });
        });
      });
      resolve({});
    }, reject);
  }

  initDeviceEx(resolve, reject) {
    if (this.checkRun() == true) {
      this.log('MediaMtx already running');
      return resolve({});
    }

    super.initDeviceEx(() => {
      this.createConfig();

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

      resolve({});
    }, reject);
  }

  createConfig(): void {
    const mustache = require('mustache');
    const fs = require('fs');

    const template = fs.readFileSync('config/mediamtx.yml', 'utf8');
    const output = mustache.render(template, this.getConfigParams());

    fs.unlink(`${this.mediaMtxDir}/mediamtx.yml`, (err) => {
      fs.writeFileSync(`${this.mediaMtxDir}/mediamtx.yml`, output, 'utf8');
    });

    if (this.logging) {
      this.log('MediaMtx config was created');
    }
  }

  getConfigParams() {
    let params = {
      type: this.type,
      source: this.source,
      width: this.width,
      height: this.height,
      rpiCamera: false,
    }

    if (this.type == 'rpi') {
      params.source = 'rpiCamera';
      params.rpiCamera = true;
    }

    return params;
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

  checkRun() {
    let that = this;
    const ps = require('ps-node');

    ps.lookup({
      command: `${this.mediaMtxDir}/mediamtx`,
      psargs: ''
    }, function (err, resultList) {
      if (err) {
        throw new Error(err);
      }

      resultList.forEach(function (process) {
        if (process && process.command == `${that.mediaMtxDir}/mediamtx`) {
          return true;
        }
      });
    });

    return false;
  }
}

process.on('uncaughtException', (err) => {
  console.error(`${err ? err.message : inspect(err)}`);
});

const app = new Mediamtx();
// app.logging = true;
// app.installDevice({
//   params: {}
// }).then(() => { });
// app.initDevice({
//   params: {}
// }).then(() => {
//   app.connect({id: 1}).then(() => {
//     app.subDevices({})
//   })
// })
