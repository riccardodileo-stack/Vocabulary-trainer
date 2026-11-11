// Focuses a text field once the screen has finished sliding in.
//
// Why not `autoFocus`: the keyboard would open during the push animation, and iOS
// would scroll the page to make room for it before the space under the header is
// known, leaving the top of the page (e.g. the quiz word) hidden behind the header.

import { useNavigation } from 'expo-router';
import { useEffect, type RefObject } from 'react';

/** If the navigator sends no transition event (first screen, web), focus after this delay. */
const FALLBACK_DELAY_MS = 650;

/** Anything that can take the focus, e.g. a TextField ref. */
type Focusable = { focus: () => void };

type TransitionEvent = { data?: { closing?: boolean } };
type TransitionListener = (type: 'transitionEnd', callback: (event: TransitionEvent) => void) => () => void;

export function useFocusAfterTransition(ref: RefObject<Focusable | null>, enabled = true) {
  const navigation = useNavigation();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let focused = false;
    const focus = () => {
      if (!focused) {
        focused = true;
        ref.current?.focus();
      }
    };

    // 'transitionEnd' is a native-stack event, missing from the generic navigation type
    const addListener = (navigation.addListener as unknown as TransitionListener).bind(navigation);
    const unsubscribe = addListener('transitionEnd', (event) => {
      if (!event.data?.closing) {
        focus();
      }
    });
    const timer = setTimeout(focus, FALLBACK_DELAY_MS);

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, [navigation, ref, enabled]);
}
