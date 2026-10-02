// Runs ONE render part in its own process (forked by render.mjs).
// If Chrome/ffmpeg hangs, the parent kills this whole process tree — the Studio server never freezes.
import {renderMedia, selectComposition} from '@remotion/renderer';

const send = (m) => { try { process.send?.(m); } catch {} };

process.on('message', async (msg) => {
  if (msg?.type !== 'run') return;
  const {serveUrl, compId, inputProps, browserExecutable, chromiumOptions, media} = msg;
  try {
    const composition = await selectComposition({serveUrl, id: compId, inputProps, browserExecutable, chromiumOptions});
    send({type: 'meta', durationInFrames: composition.durationInFrames, width: composition.width, height: composition.height});
    let last = 0;
    await renderMedia({
      composition, serveUrl, inputProps, browserExecutable, chromiumOptions, ...media,
      onProgress: ({progress, renderedFrames, encodedFrames, stitchStage}) => {
        const now = Date.now();
        if (now - last < 250 && progress < 1) return; // throttle IPC
        last = now;
        send({type: 'progress', progress, renderedFrames, encodedFrames, stitchStage});
      },
    });
    send({type: 'done'});
    setTimeout(() => process.exit(0), 50);
  } catch (e) {
    send({type: 'error', message: String(e?.stack || e?.message || e).slice(0, 4000)});
    setTimeout(() => process.exit(1), 50);
  }
});
send({type: 'ready'});
