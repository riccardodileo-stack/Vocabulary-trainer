// Challenges with friends (share code / link, no server for now). Built in a later step.

import { ComingSoonScreen } from '@/components/ComingSoonScreen';
import { useT } from '@/i18n';

export default function ChallengesScreen() {
  return <ComingSoonScreen title={useT().challenges.title} tab="/challenges" />;
}
