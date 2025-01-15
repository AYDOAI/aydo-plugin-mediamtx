import {baseDriverModule} from '../core/base-driver-module';
import {inspect} from 'util';


class Mediamtx extends baseDriverModule {
  mediaMtxDir= "/srv/mediamtx";
  mediaMtxVersion= "1.9.1";
  mediaMtxBaseUrl = "https://github.com/bluenviron/mediamtx/releases/download";

  rtspUrl: string = null;
  rtspUsername: string = null;
  rtspPassword: string = null;
  
  get configFile() {
    return '/config/mediamtx';
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

    super.installDeviceEx(() => {
      let arch2 = arch
      if (arch == 'x64') {
        arch2 = 'amd64'
      }

      if (arch == 'arm64') {
        arch2 = 'arm64v8'
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

            // that.createConfig();
            resolve({});
          });
        });
      });
    }, reject);
  }

  initDeviceEx(resolve, reject) {
    this.log('initDeviceEx-try');
    const fs = require('fs');

    if (
      fs.existsSync(`${this.mediaMtxDir}/mediamtx`) === false &&
      fs.existsSync(`${this.mediaMtxDir}/mediamtx.yml`) === false
    ) {
      this.app.log('MediaMtx not installed');
      return resolve({});
    }

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

      this.rtspUrl = this.getStreamUrl();
      this.rtspUsername = this.generateRandomString(8);
      this.rtspPassword = this.generateRandomString(16);

      resolve({});
    }, reject);
  }

  createConfig(): void {
    const YAML = require('yaml')
    const fs = require('fs');
    
    let config = this.config['pluginMediaMtx']['configMediaMtx'];
    config['paths'] = this.getConfigParams();

    if (this.ident && !config['authHTTPAddress'].includes(this.ident)) {
      config['authHTTPAddress'] = config['authHTTPAddress'] + `/${this.ident}/`;
    }

    let configStr = YAML.stringify(config, {
      defaultStringType: 'PLAIN',
    })

    configStr = configStr.replace("encryption: no", "encryption: \"no\"");
    configStr = configStr.replace("rpiCameraDenoise: off", "rpiCameraDenoise: \"off\"");

    fs.unlink(`${this.mediaMtxDir}/mediamtx.yml`, (err) => {
      fs.writeFileSync(
        `${this.mediaMtxDir}/mediamtx.yml`,
        configStr,
        'utf8'
      );
    });

    if (this.logging) {
      this.log('MediaMtx config was created');
      this.log(config);
    }
  }

  getConfigParams() {
    if (this.logging) {
      this.log('Params for config: ', this.params);
    }

    let params = {};
    let resolution = this.config['pluginMediaMtx']['videoResolutions'][this.params['resolution']];

    if (this.params['type'] == 'rpi') {
      params = {
        camera: {
          source: 'rpiCamera',
          rpiCameraWidth: resolution['width'],
          rpiCameraHeight: resolution['height'],
          rpiCameraVFlip: false,
          rpiCameraHFlip: false,
          rpiCameraBitrate: 1500000
        }
      }
    }

    if (this.params['type'] == 'rtsp') {
      params = {
        camera: {
          source: this.params.source
        }
      }
    }

    this.log('Video Stream Params:', params);
    return params;
  }

  createService(): void {
    const mustache = require('mustache');
    const fs = require('fs');

    const output = mustache.render(this.config['pluginMediaMtx']['serviceFileTemplate'], {
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

  connectEx(resolve, reject) {
    const status: any = {connected: true};

    this.capabilities = [];
    this.capabilities.push({ident: 'url', index: 1, display_name: 'RTSP url'});
    this.capabilities.push({ident: 'username', index: 2, display_name: 'Username'});
    this.capabilities.push({ident: 'password', index: 3, display_name: 'Password'});

    this.counter = 0;
    status.capabilities = this.capabilities;
    this.publish(this.eventTypeStatus(this.pluginTemplate.class_name, `${this.id}`), status);

    this.getDevices().then(devices => {
      console.log(devices);
    });

    setInterval(() => {
      this.commandEx('status', null, null, null, () => {
      }, () => {
      }, null);
    }, 15000);

    resolve({});
  }

  commandEx(command, value, params, options, resolve, reject, status) {
    const between = (min, max) => {
      return Math.floor(Math.random() * (max - min) + min);
    }
    const update = () => {
      const status: any = {
        connected: true,
        url_1: this.rtspUrl,
        username_2: this.rtspUsername,
        password_3: this.rtspPassword,
      };
      this.publish(this.eventTypeStatus(this.pluginTemplate.class_name, `${this.id}`), status);
    }
    switch (command) {
      case 'status':
        this.index++;
        this.counter++;
        update()
        resolve({});
        break;
      default:
        this.currentStatus[command] = value;
        update()
        resolve({});
    }
  }

  getStreamUrl(): string {
    let result = `rtsp://${this.params['external_host']}:${this.params['external_port']}/camera`;

    return result;
  }

  generateRandomString(length: number): string {
    const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }
}

process.on('uncaughtException', (err) => {
  console.error(`${err ? err.message : inspect(err)}`);
});

const app = new Mediamtx();
app.logging = true;
// app.installDevice({
//   params: {}
// }).then(() => {
//   app.initDevice({
//     params: {}
//   }).then(() => { });
// });
// app.initDevice({
//   params: {}
// }).then(() => { });
