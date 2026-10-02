import {OV} from '../core/constants';
import {useF} from './warp';
/** Scene-local time in base frames: 0 = the cut-in beat. Time-warp and fps aware. */
export const useT = () => useF() - OV;
