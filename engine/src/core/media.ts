import {staticFile} from 'remotion';

/**
 * Project media path → URL (use instead of staticFile for anything a user can pick).
 *  'img/a.jpg'            → public/img/a.jpg
 *  'lib:sfx/whoosh.mp3'   → shared SAMI_Library file, hardlinked by the Studio into public/_lib/sfx/whoosh.mp3
 */
export const media = (p: string) => staticFile(p && p.startsWith('lib:') ? '_lib/' + p.slice(4) : p);
