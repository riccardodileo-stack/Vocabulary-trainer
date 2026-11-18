import type { Action, Pose, SceneEvent, SceneState } from './collegamento';

export type GorichecoRenderer = {
  configure(state: Partial<SceneState>): void;
  section(pose: Pose): void;
  perform(action: Action): void;
  dispose(): void;
};

export function createGorichecoEngine(): {
  mount(canvas: HTMLCanvasElement, options?: { onEvent?: (event: SceneEvent) => void }): GorichecoRenderer;
};
