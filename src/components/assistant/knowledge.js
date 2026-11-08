// Source of truth: what the site actually publishes today. Anything not published is answered honestly as "not yet available".
import { FORM, SOCIALS } from '../../data/links'
const L = (label, href, external) => ({ label, href, external })
const I = [
  { keys: ['what is spectrum', 'about', 'spectrum', 'club', 'mission', 'purpose', 'vision', 'story'], mood: 'happy', links: [L('About Spectrum', '#about')],
    text: 'Spectrum is a club built around one idea: “Different Perspectives. Limitless Impact.” It brings together technology, creativity, innovation and collaboration. The full mission and story aren’t published on the site yet, so I can’t say more than that.' },
  { keys: ['domain', 'domains', 'explore', 'perspective', 'perspectives', 'technology', 'creativity', 'innovation', 'collaboration', 'activities', 'focus'], mood: 'excited', links: [L('Our Perspectives', '#perspectives')],
    text: 'Spectrum looks at the world through four perspectives: Technology, Creativity, Innovation and Collaboration. Detailed descriptions of each are still to be added to the site.' },
  { keys: ['event', 'events', 'upcoming', 'workshop', 'meetup', 'schedule'], mood: 'confused', links: [L('Events', '#events')],
    text: 'The one date I have: SPECTRUM founding crew and junior core auditions begin 17 November. Other event details haven’t been published yet, so I won’t guess. They’ll appear in the Events section once added.' },
  { keys: ['project', 'projects', 'built', 'building', 'portfolio', 'showcase'], mood: 'confused', links: [L('Gallery', '#gallery')],
    text: 'No project details are published yet. Club highlights will appear in the Gallery once photos are added.' },
  { keys: ['team', 'members', 'leader', 'leadership', 'people', 'who runs'], mood: 'confused', links: [L('Our Team', '#team')],
    text: 'Team and leadership details aren’t published yet. The Team section will introduce the people behind Spectrum once names and roles are added.' },
  { keys: ['join', 'membership', 'sign up', 'apply', 'become', 'register', 'how can i'], mood: 'excited', links: [L('Register for auditions', FORM, true), L('Join Spectrum', '#join')],
    text: 'Spectrum is holding founding crew and junior core auditions, beginning 17 November. You can register through the official Google Form. I don’t have any other membership details yet.' },
  { keys: ['gallery', 'photo', 'photos', 'pictures', 'moments'], mood: 'happy', links: [L('Gallery', '#gallery')],
    text: 'The Gallery is for visual highlights and club moments. Photos haven’t been added yet.' },
  { keys: ['contact', 'email', 'phone', 'instagram', 'linkedin', 'twitter', 'youtube', 'social', 'follow', 'reach'], mood: 'happy', links: SOCIALS.map(s => L(s.name, s.href, true)),
    text: 'You can follow Spectrum on Instagram, X, LinkedIn and YouTube. I don’t have an email address or phone number to share.' },
  { keys: ['who are you', 'your name', 'buddy', 'mascot'], mood: 'happy', links: [], text: 'I’m your Spectrum buddy, the club’s mascot. I can only share what’s published on this site.' },
  { keys: ['hi', 'hello', 'hey', 'yo'], mood: 'happy', links: [], text: 'Hi! Ask me about Spectrum, our perspectives, events, the team, or how to join.' },
  { keys: ['thanks', 'thank you'], mood: 'happy', links: [], text: 'Happy to help!' },
]
export const SUGGESTED = ['What is Spectrum?', 'What domains do you explore?', 'What events are coming up?', 'Show me your projects.', 'How can I join Spectrum?']
const BY = {
  about: ['What is Spectrum?', 'What domains do you explore?'], perspectives: ['What domains do you explore?', 'What is Spectrum?'],
  events: ['What events are coming up?', 'How can I join Spectrum?'], team: ['Who is on the team?', 'How can I join Spectrum?'],
  gallery: ['Show me your projects.', 'Where can I see photos?'], join: ['How can I join Spectrum?', 'Where can I follow Spectrum?'],
}
export const suggestionsFor = s => [...new Set([...(BY[s] || []), ...SUGGESTED])].slice(0, 5) // current section's questions first
const FALLBACK = { text: 'I don’t have that information yet. I only know what’s published on this site. You can ask about Spectrum, our perspectives, events, the team or joining.', links: [], mood: 'confused' }
export function localAnswer(q) {
  const s = ' ' + q.toLowerCase().replace(/[^a-z0-9 ]/g, ' ') + ' '
  let best = null, top = 0
  for (const it of I) { let n = 0; for (const k of it.keys) if (s.includes(' ' + k + ' ')) n += k.includes(' ') ? 3 : 2; if (n > top) { top = n; best = it } }
  return best ? { text: best.text, links: best.links, mood: best.mood } : FALLBACK
}
// Swap point for a real AI: call your own backend endpoint here (API keys must stay server-side), keep this return shape.
export async function respond(q) { await new Promise(r => setTimeout(r, 650 + Math.random() * 450)); return localAnswer(q) }
