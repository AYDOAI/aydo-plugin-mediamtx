module.exports = {
    host: '192.168.1.9',
    port: '8000',
    logging: true,

    videoSettings: {
        type: 'rtsp', // rtsp or rpi
        source: 'rtsp://192.168.1.20/ch0_0.h264',
        width: 1280,
        height: 720
    },

    serviceFileTemplate: `[Unit]
Wants=network.target

[Service]
ExecStart={{{MediaMtxDir}}}/mediamtx {{{MediaMtxDir}}}/mediamtx.yml
WorkingDirectory={{{MediaMtxDir}}}
StandardOutput=inherit
StandardError=inherit
Restart=always
User=root

[Install]
WantedBy=multi-user.target`,

    mediaMtxSettings: {
        logLevel: "info",
        logDestinations: ["file"],
        logFile: "/srv/mediamtx/mediamtx.log",
        readTimeout: "10s",
        writeTimeout: "10s",
        writeQueueSize: 512,
        udpMaxPayloadSize: 1472,
        runOnConnect: "",
        runOnConnectRestart: false,
        runOnDisconnect: "",
        authMethod: "internal",
        authInternalUsers: [
            {
                user: "any",
                pass: "",
                ips: [],
                permissions: [
                    { action: "publish", path: "" },
                    { action: "read", path: "" },
                    { action: "playback", path: "" }
                ]
            },
            {
                user: "any",
                pass: "",
                ips: ["127.0.0.1", "::1"],
                permissions: [
                    { action: "api" },
                    { action: "metrics" },
                    { action: "pprof" }
                ]
            }
        ],
        authHTTPAddress: "",
        authHTTPExclude: [
            { action: "api" },
            { action: "metrics" },
            { action: "pprof" }
        ],
        authJWTJWKS: "",
        authJWTClaimKey: "mediamtx_permissions",
        api: false,
        apiAddress: ":9997",
        apiEncryption: false,
        apiServerKey: "server.key",
        apiServerCert: "server.crt",
        apiAllowOrigin: "*",
        apiTrustedProxies: [],
        metrics: false,
        metricsAddress: ":9998",
        metricsEncryption: false,
        metricsServerKey: "server.key",
        metricsServerCert: "server.crt",
        metricsAllowOrigin: "*",
        metricsTrustedProxies: [],
        pprof: false,
        pprofAddress: ":9999",
        pprofEncryption: false,
        pprofServerKey: "server.key",
        pprofServerCert: "server.crt",
        pprofAllowOrigin: "*",
        pprofTrustedProxies: [],
        playback: false,
        playbackAddress: ":9996",
        playbackEncryption: false,
        playbackServerKey: "server.key",
        playbackServerCert: "server.crt",
        playbackAllowOrigin: "*",
        playbackTrustedProxies: [],
        rtsp: true,
        protocols: ["udp", "multicast", "tcp"],
        encryption: "no",
        rtspAddress: ":8554",
        rtspsAddress: ":8322",
        rtpAddress: ":8000",
        rtcpAddress: ":8001",
        multicastIPRange: "224.1.0.0/16",
        multicastRTPPort: 8002,
        multicastRTCPPort: 8003,
        serverKey: "server.key",
        serverCert: "server.crt",
        rtspAuthMethods: ["basic"],
        rtmp: true,
        rtmpAddress: ":1935",
        hls: false,
        hlsAddress: ":8888",
        webrtc: false,
        webrtcAddress: ":8889",
        webrtcEncryption: false,
        webrtcServerKey: "server.key",
        webrtcServerCert: "server.crt",
        webrtcAllowOrigin: "*",
        webrtcTrustedProxies: [],
        pathDefaults: {
            source: "publisher",
            sourceProtocol: "automatic",
            sourceFingerprint: "",
            sourceOnDemand: false,
            sourceOnDemandStartTimeout: "10s",
            sourceOnDemandCloseAfter: "10s",
            maxReaders: 0,
            srtReadPassphrase: "",
            fallback: "",
            record: false,
            recordPath: "./recordings/%path/%Y-%m-%d_%H-%M-%S-%f",
            recordFormat: "fmp4",
            recordPartDuration: "1s",
            recordSegmentDuration: "1h",
            recordDeleteAfter: "24h",
            overridePublisher: true,
            srtPublishPassphrase: "",
            rtspTransport: "automatic",
            rtspAnyPort: false,
            rtspRangeType: "",
            rtspRangeStart: "",
            sourceRedirect: "",
            rpiCameraCamID: 0,
            rpiCameraWidth: 1920,
            rpiCameraHeight: 1080,
            rpiCameraHFlip: false,
            rpiCameraVFlip: false,
            rpiCameraBrightness: 0,
            rpiCameraContrast: 1,
            rpiCameraSaturation: 1,
            rpiCameraSharpness: 1,
            rpiCameraExposure: "normal",
            rpiCameraAWB: "auto",
            rpiCameraAWBGains: [0, 0],
            rpiCameraDenoise: "off",
            rpiCameraShutter: 0,
            rpiCameraMetering: "centre",
            rpiCameraGain: 0,
            rpiCameraEV: 0,
            rpiCameraROI: "",
            rpiCameraHDR: false,
            rpiCameraTuningFile: "",
            rpiCameraMode: "",
            rpiCameraFPS: 30,
            rpiCameraAfMode: "continuous",
            rpiCameraAfRange: "normal",
            rpiCameraAfSpeed: "normal",
            rpiCameraLensPosition: 0.0,
            rpiCameraAfWindow: "",
            rpiCameraFlickerPeriod: 0,
            rpiCameraTextOverlayEnable: false,
            rpiCameraTextOverlay: "%Y-%m-%d %H:%M:%S - MediaMTX",
            rpiCameraCodec: "auto",
            rpiCameraIDRPeriod: 60,
            rpiCameraBitrate: 1000000,
            rpiCameraProfile: "main",
            rpiCameraLevel: "4.1",
            runOnInit: "",
            runOnInitRestart: false,
            runOnDemand: "",
            runOnDemandRestart: false,
            runOnDemandStartTimeout: "10s",
            runOnDemandCloseAfter: "10s",
            runOnUnDemand: "",
            runOnReady: "",
            runOnReadyRestart: false,
            runOnNotReady: "",
            runOnRead: "",
            runOnReadRestart: false,
            runOnUnread: "",
            runOnRecordSegmentCreate: "",
            runOnRecordSegmentComplete: ""
        },
        paths: {
            all_others: ""
        }
    }
};
