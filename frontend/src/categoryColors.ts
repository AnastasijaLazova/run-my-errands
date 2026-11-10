// One tile colour per category so lists and pickers are scannable at a glance.
export const CATEGORY_COLORS: Record<string, string> = {
  pharmacy: '#0F9D8A', pet_care: '#5B3FE0', laundry: '#6E9A1F', shopping: '#D9822B', bill_payment: '#2563EB',
  yard_work: '#3F8F3A', babysitting: '#DB4F86', housework: '#8B5CF6', home_cooking: '#C2410C', cleaning: '#0891B2',
  tutoring: '#4F46E5', vehicle_repair: '#475569', it_fixes: '#0E7490',
}

export const categoryColor = (key: string) => CATEGORY_COLORS[key] ?? 'var(--accent)'

// Lighter, landing-page palette: [background, text] per category, for pastel tiles and pills.
const CATEGORY_TILES: Record<string, [string, string]> = {
  pharmacy: ['#2E7D6F', '#FFFFFF'], shopping: ['#F5B82E', '#10241C'], bill_payment: ['#0F7B55', '#FFFFFF'],
  laundry: ['#DCEFFB', '#10241C'], pet_care: ['#FF7A59', '#10241C'], babysitting: ['#6A5AE0', '#FFFFFF'],
  tutoring: ['#FFD6C9', '#10241C'], housework: ['#D9F27A', '#10241C'], cleaning: ['#8CD3B4', '#10241C'],
  home_cooking: ['#E8DDF9', '#10241C'], yard_work: ['#5F7A3C', '#FFFFFF'], vehicle_repair: ['#10241C', '#FFFFFF'],
  it_fixes: ['#1F5EA8', '#FFFFFF'],
}

export const categoryTile = (key: string): [string, string] => CATEGORY_TILES[key] ?? ['#0F7B55', '#FFFFFF']
