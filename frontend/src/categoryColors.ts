// One tile colour per category so lists and pickers are scannable at a glance.
export const CATEGORY_COLORS: Record<string, string> = {
  pharmacy: '#0F7B55', pet_care: '#2E9E6F', laundry: '#6E9A1F', shopping: '#3F8F3A', bill_payment: '#1E5A3F',
  yard_work: '#4F7A2A', babysitting: '#2E7D6F', housework: '#5F8F1F', home_cooking: '#3F5B12', cleaning: '#1F8A6A',
  tutoring: '#245C45', vehicle_repair: '#10241C', it_fixes: '#3B7D5C',
}

export const categoryColor = (key: string) => CATEGORY_COLORS[key] ?? 'var(--accent)'

// Lighter, landing-page palette: [background, text] per category, for pastel tiles and pills.
const CATEGORY_TILES: Record<string, [string, string]> = {
  pharmacy: ['#2E7D6F', '#FFFFFF'], shopping: ['#C4E05A', '#10241C'], bill_payment: ['#0F7B55', '#FFFFFF'],
  laundry: ['#E3F2EC', '#10241C'], pet_care: ['#A9DB8A', '#10241C'], babysitting: ['#1E5A3F', '#FFFFFF'],
  tutoring: ['#C5E8D6', '#10241C'], housework: ['#D9F27A', '#10241C'], cleaning: ['#8CD3B4', '#10241C'],
  home_cooking: ['#F1FAD0', '#10241C'], yard_work: ['#5F7A3C', '#FFFFFF'], vehicle_repair: ['#10241C', '#FFFFFF'],
  it_fixes: ['#3F8F3A', '#FFFFFF'],
}

export const categoryTile = (key: string): [string, string] => CATEGORY_TILES[key] ?? ['#0F7B55', '#FFFFFF']
