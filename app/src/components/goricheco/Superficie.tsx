'use dom';

import type { DOMProps } from 'expo/dom';
import { useEffect, useRef } from 'react';

import type { Action, Pose, SceneEvent, SceneState } from './collegamento';
import { createGorichecoEngine, type GorichecoRenderer } from './scena-generata';

type Props = {
  dom?: DOMProps;
  state: SceneState;
  onSceneEvent?: (event: SceneEvent) => Promise<void>;
  pose?: Pose;
  action?: { name: Action; sequence: number };
};

export default function Superficie({ state, onSceneEvent, pose, action }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<GorichecoRenderer | null>(null);
  const notify = useRef(onSceneEvent);
  const lastAction = useRef<string | null>(null);
  const actionName = action?.name;
  const actionSequence = action?.sequence;

  useEffect(() => {
    notify.current = onSceneEvent;
  }, [onSceneEvent]);

  useEffect(() => {
    if (!canvas.current) return;
    const emit = (event: SceneEvent) => { void notify.current?.(event).catch(() => {}); };
    try {
      const engine = createGorichecoEngine();
      renderer.current = engine.mount(canvas.current, { onEvent: emit });
    } catch {
      emit('error');
    }
    return () => {
      renderer.current?.dispose();
      renderer.current = null;
    };
  }, []);

  useEffect(() => {
    if (pose) renderer.current?.section(pose);
  }, [pose]);

  useEffect(() => {
    renderer.current?.configure(state);
  }, [state]);

  useEffect(() => {
    if (!renderer.current || !actionName || actionSequence === undefined) return;
    const key = actionName + ':' + actionSequence;
    if (lastAction.current === key) return;
    renderer.current.perform(actionName);
    lastAction.current = key;
  }, [actionName, actionSequence]);

  return (
    <canvas
      ref={canvas}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, display: 'block', width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  );
}
