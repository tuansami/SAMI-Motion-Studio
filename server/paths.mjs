import path from 'path';
import {fileURLToPath} from 'url';
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ENGINE = path.join(ROOT, 'engine');
export const ENGINE_SRC = path.join(ENGINE, 'src');
export const NODE_MODULES = path.join(ROOT, 'node_modules');
export const TEMPLATES = path.join(ROOT, 'templates');
export const DEFAULT_PROJECTS = path.join(ROOT, 'projects');
export const DATA = path.join(ROOT, '.studio');
