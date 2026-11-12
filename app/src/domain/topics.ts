// Topics a word can belong to (a word can have several: "mouse" = computing + nature).
// The order is also the order of the outputs of the topic network (see topicClassifier.ts):
// adding or moving a topic means training the network again (design/topic-model).

export const TOPIC_IDS = [
  'tech',
  'health',
  'food',
  'travel',
  'work',
  'home',
  'nature',
  'people',
  'school',
  'sport',
  'culture',
  'feelings',
] as const;

export type TopicId = (typeof TOPIC_IDS)[number];

export const TOPIC_ICONS: Record<TopicId, string> = {
  tech: '💻',
  health: '🩺',
  food: '🍝',
  travel: '✈️',
  work: '💼',
  home: '🏠',
  nature: '🌿',
  people: '👪',
  school: '🎓',
  sport: '⚽',
  culture: '🎨',
  feelings: '😊',
};

export function isTopicId(value: unknown): value is TopicId {
  return typeof value === 'string' && (TOPIC_IDS as readonly string[]).includes(value);
}

/** "tech,food,xyz" -> ["tech", "food"] (route params). */
export function parseTopicList(text: string | undefined): TopicId[] {
  return (text ?? '').split(',').filter(isTopicId);
}
