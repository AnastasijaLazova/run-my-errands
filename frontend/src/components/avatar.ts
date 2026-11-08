// Avatar colours, picked by user id so a person keeps the same colour on every page.
const AVATAR_COLORS = ['#5B3FE0', '#0F9D8A', '#E8590C', '#D6336C', '#2563EB', '#3F8F3A', '#C2410C', '#0E7490']

// Neutral slate when there's no id to go on, so the square never renders empty.
export const avatarColor = (userId: number | null | undefined) =>
  userId == null || Number.isNaN(userId) ? '#3A4651' : AVATAR_COLORS[Math.abs(userId) % AVATAR_COLORS.length]
export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?'

/** Same name → same colour, for people we only know by name (no user id on the row). */
export const nameColor = (name: string | null) =>
  avatarColor([...(name ?? '')].reduce((h, c) => h + c.charCodeAt(0), 0))
