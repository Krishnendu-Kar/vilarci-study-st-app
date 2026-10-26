// Emoji fields in the shared data model (website / teacher app) mapped to
// Ionicons for native rendering. The data keeps its emoji for compatibility.
import type { IconName } from '../../components/ui/base';

const EMOJI_ICONS: Record<string, IconName> = {
  // simulations
  '🚀': 'rocket-outline',
  '〰️': 'pulse-outline',
  '⚛️': 'planet-outline',
  '🧪': 'flask-outline',
  '🔬': 'cube-outline',
  '🐇': 'leaf-outline',
  // badges
  '🏛️': 'business-outline',
  '🔥': 'flame-outline',
  '🏆': 'trophy-outline',
  '🎯': 'locate-outline',
  '💎': 'diamond-outline',
};

export function iconForEmoji(emoji: string | undefined, fallback: IconName = 'sparkles-outline'): IconName {
  return (emoji && EMOJI_ICONS[emoji]) || fallback;
}
