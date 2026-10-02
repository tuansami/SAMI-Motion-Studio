import React from 'react';

// Generic social UI glyphs (no platform logos). Filled when `on` = 1.
type G = {size?: number; color?: string; on?: number; fill?: string};
export const Heart: React.FC<G> = ({size = 40, color = '#fff', on = 0, fill}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{display: 'block', overflow: 'visible'}}>
    <path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 7.9 3.6 4.5 7 4.5c2.1 0 3.6 1.2 5 3 1.4-1.8 2.9-3 5-3 3.4 0 5.6 3.4 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2z" fill={on > 0.5 ? fill || color : 'none'} stroke={on > 0.5 ? fill || color : color} strokeWidth="2" strokeLinejoin="round" />
  </svg>
);
export const Bubble: React.FC<G> = ({size = 40, color = '#fff'}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{display: 'block'}}>
    <path d="M12 3.5c5 0 9 3.4 9 7.8s-4 7.8-9 7.8c-1.1 0-2.2-.2-3.2-.5L4 20.5l1.3-4.1C3.9 15 3 13.2 3 11.3 3 6.9 7 3.5 12 3.5z" fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
  </svg>
);
export const Plane: React.FC<G> = ({size = 40, color = '#fff'}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{display: 'block'}}>
    <path d="M21.5 3.5 10 13M21.5 3.5 14.5 21l-4.5-8-8-4.5z" fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
  </svg>
);
export const Bookmark: React.FC<G> = ({size = 40, color = '#fff', on = 0, fill}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{display: 'block'}}>
    <path d="M6 3.5h12v17.5l-6-4.5-6 4.5z" fill={on > 0.5 ? fill || color : 'none'} stroke={on > 0.5 ? fill || color : color} strokeWidth="2" strokeLinejoin="round" />
  </svg>
);
export const Person: React.FC<G> = ({size = 40, color = '#fff'}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{display: 'block'}}>
    <circle cx="12" cy="8" r="4" fill="none" stroke={color} strokeWidth="2" />
    <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);
