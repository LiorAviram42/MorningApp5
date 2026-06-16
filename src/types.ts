/// <reference types="vite/client" />
export type KidId = 'yuvali' | 'maayani' | 'pelegi';

export interface Task {
  id: string;
  title: string;
  iconOff: string;
  iconOn: string;
  side: 'left' | 'right';
}

export interface KidConfig {
  id: KidId;
  name: string;
  profileImg: string;
  gradient: string;
  colorA: string;
  colorB: string;
  outlineColor: string;
}
