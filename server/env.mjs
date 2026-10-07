// Environment for child processes (render workers, Hyperframes, ffmpeg, Python):
//  • vendor/ffmpeg/bin first on PATH (Hyperframes looks for "system" ffmpeg)
//  • TEMP/TMP on the cache drive (Z:) — renders stage GBs of frames; C: must not fill up
//  • Hyperframes: no telemetry, frame-extract cache on Z:
import fs from 'fs';
import path from 'path';
import {VENDOR, cacheDir} from './paths.mjs';

const FF_BIN = path.join(VENDOR, 'ffmpeg', 'bin');
let _env;
export const childEnv = (extra = {}) => {
  if (!_env) {
    const tmp = cacheDir('tmp');
    const sep = process.platform === 'win32' ? ';' : ':';
    const key = Object.keys(process.env).find((k) => k.toLowerCase() === 'path') || 'PATH';
    const PATHV = fs.existsSync(FF_BIN) ? FF_BIN + sep + (process.env[key] || '') : process.env[key] || '';
    _env = {
      ...process.env, [key]: PATHV, TEMP: tmp, TMP: tmp, TMPDIR: tmp,
      HYPERFRAMES_NO_TELEMETRY: '1', DO_NOT_TRACK: '1',
      HYPERFRAMES_EXTRACT_CACHE_DIR: cacheDir('hf-frames'),
    };
  }
  return {..._env, ...extra};
};
