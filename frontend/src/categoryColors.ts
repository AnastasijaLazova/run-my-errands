// One tile colour per category so lists and pickers are scannable at a glance.
export const CATEGORY_COLORS: Record<string, string> = {
  pharmacy: '#0F9D8A', pet_care: '#5B3FE0', laundry: '#6E9A1F', shopping: '#D9822B', bill_payment: '#2563EB',
  yard_work: '#3F8F3A', babysitting: '#DB4F86', housework: '#8B5CF6', home_cooking: '#C2410C', cleaning: '#0891B2',
  tutoring: '#4F46E5', vehicle_repair: '#475569', it_fixes: '#0E7490',
}

export const categoryColor = (key: string) => CATEGORY_COLORS[key] ?? 'var(--accent)'
