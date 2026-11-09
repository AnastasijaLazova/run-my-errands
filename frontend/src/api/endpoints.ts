import { api } from './client'
import type * as T from './types'

export const authApi = {
  signup: (b: T.SignupInput) =>
    api<T.AuthResponse>('/auth/signup', { method: 'POST', body: b }),
  login: (b: { email: string; password: string }) =>
    api<T.AuthResponse>('/auth/login', { method: 'POST', body: b }),
  logout: () => api<void>('/auth/logout', { method: 'POST' }),
}

export const meApi = {
  get: () => api<T.Me>('/me'),
  requesterDashboard: () => api<T.RequesterDashboard>('/me/dashboard/requester'),
  giverDashboard: () => api<T.GiverDashboard>('/me/dashboard/giver'),
  update: (b: Partial<Pick<T.Me, 'displayName' | 'phone' | 'neighbourhood' | 'avatarUrl' | 'locale'>>) =>
    api<T.Me>('/me', { method: 'PATCH', body: b }),
  saveGiverProfile: (b: {
    bio?: string; availability?: string
    categories: { categoryId: number; price: number }[]
  }) => api<T.GiverProfile>('/me/giver-profile', { method: 'PUT', body: b }),
}

export const categoriesApi = { list: () => api<T.Category[]>('/categories') }

export const publicApi = { landing: () => api<T.Landing>('/public/landing') }

export const giversApi = { get: (id: number) => api<T.GiverProfile>(`/givers/${id}`) }

export const favorsApi = {
  create: (b: T.CreateFavorInput) => api<T.Favor>('/favors', { method: 'POST', body: b }),
  mine: () => api<T.Favor[]>('/favors/mine'),
  open: (categoryId?: number) => api<T.Favor[]>(`/favors/open${categoryId ? `?categoryId=${categoryId}` : ''}`),
  get: (id: number) => api<T.Favor>(`/favors/${id}`),
  update: (id: number, b: T.UpdateFavorInput) => api<T.Favor>(`/favors/${id}`, { method: 'PATCH', body: b }),
  cancel: (id: number) => api<void>(`/favors/${id}`, { method: 'DELETE' }),
  matches: (id: number, sort?: string) => api<T.GiverMatch[]>(`/favors/${id}/matches${sort ? `?sort=${sort}` : ''}`),
  offers: (id: number) => api<T.Offer[]>(`/favors/${id}/offers`),
  makeOffer: (id: number, b: { message?: string; proposedPrice?: number }) =>
    api<T.Offer>(`/favors/${id}/offers`, { method: 'POST', body: b }),
}

export const offersApi = {
  mine: () => api<T.Offer[]>('/offers/mine'),
  accept: (id: number) => api<T.Booking>(`/offers/${id}/accept`, { method: 'POST' }),
  reject: (id: number) => api<T.Offer>(`/offers/${id}/reject`, { method: 'POST' }),
  withdraw: (id: number) => api<T.Offer>(`/offers/${id}/withdraw`, { method: 'POST' }),
}

export const bookingsApi = {
  create: (b: { favorId: number; giverId: number; note?: string }) =>
    api<T.Booking>('/bookings', { method: 'POST', body: b }),
  list: (role: 'requester' | 'giver') => api<T.BookingListItem[]>(`/bookings?role=${role}`),
  get: (id: number) => api<T.Booking>(`/bookings/${id}`),
  accept: (id: number) => api<T.Booking>(`/bookings/${id}/accept`, { method: 'POST' }),
  decline: (id: number) => api<T.Booking>(`/bookings/${id}/decline`, { method: 'POST' }),
  cancel: (id: number, reason?: string) => api<T.Booking>(`/bookings/${id}/cancel`, { method: 'POST', body: { reason } }),
  complete: (id: number) => api<T.Booking>(`/bookings/${id}/complete`, { method: 'POST' }),
  contact: (id: number) => api<T.Contact>(`/bookings/${id}/contact`),
}

export const paymentsApi = {
  get: (bookingId: number) => api<T.Payment>(`/bookings/${bookingId}/payment`),
  pay: (bookingId: number, card: T.PayInput) => api<T.Payment>(`/bookings/${bookingId}/pay`, { method: 'POST', body: card }),
  cancelPreview: (bookingId: number) => api<T.CancelPreview>(`/bookings/${bookingId}/cancel-preview`),
}

export const reviewsApi = {
  submit: (bookingId: number, b: { stars: number; text?: string }) =>
    api(`/bookings/${bookingId}/review`, { method: 'POST', body: b }),
  status: (bookingId: number) => api<T.ReviewStatus>(`/bookings/${bookingId}/review-status`),
}

export const notificationsApi = {
  list: () => api<T.AppNotification[]>('/notifications'),
  unreadCount: () => api<{ count: number }>('/notifications/unread-count'),
  markRead: (id: number) => api<void>(`/notifications/${id}/read`, { method: 'POST' }),
  markAllRead: () => api<void>('/notifications/read-all', { method: 'POST' }),
}
