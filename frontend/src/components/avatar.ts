// Avatar colours, picked by user id so a person keeps the same colour on every page.
const AVATAR_COLORS = ['#0F7B55', '#2E9E6F', '#6E9A1F', '#1E5A3F', '#3F8F3A', '#2E7D6F', '#3F5B12', '#4F7A2A']

// Dark green when there's no id to go on, so the square never renders empty.
export const avatarColor = (userId: number | null | undefined) =>
  userId == null || Number.isNaN(userId) ? '#1E4D3A' : AVATAR_COLORS[Math.abs(userId) % AVATAR_COLORS.length]
export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?'

/** Same name → same colour, for people we only know by name (no user id on the row). */
export const nameColor = (name: string | null) =>
  avatarColor([...(name ?? '')].reduce((h, c) => h + c.charCodeAt(0), 0))
