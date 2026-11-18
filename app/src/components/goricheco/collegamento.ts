export type Mode = 'hold' | 'intro' | 'idle' | 'preview';

export type SceneState = {
  mode: Mode;
  active: boolean;
  reducedMotion: boolean;
  compact: boolean;
  edgeInset: number;
};

export type SceneEvent = 'ready' | 'greet' | 'idle' | 'error';

export type Action = 'wave' | 'blink';
export type Expression = 'smile' | 'curious' | 'sleepy';
export type Paw = 'frontNear' | 'frontFar' | 'backNear' | 'backFar';

export type Pose = {
  yaw?: number;
  tilt?: number;
  tail?: number;
  expression?: Expression;
  gaze?: [horizontal: number, vertical: number];
  feet?: Partial<Record<Paw, [x: number, y: number, pitch: number, raised: number]>> | null;
};
