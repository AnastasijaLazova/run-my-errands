// Mirrors the backend DTOs (see backend/src/main/java/com/runmyerrands/**/dto)

export interface AuthResponse { accessToken: string; refreshToken: string; userId: number; displayName: string }

export type SignupRole = 'REQUESTER' | 'GIVER' | 'BOTH'
export interface SignupInput { email: string; password: string; displayName: string; neighbourhood: string; phone?: string; role: SignupRole }

export interface Me {
  id: number; email: string; displayName: string; phone: string | null; neighbourhood: string
  avatarUrl: string | null; locale: 'en' | 'mk'; requester: boolean; giver: boolean
}

/** Public data for the landing page (GET /public/landing). */
export interface Landing {
  categories: { id: number; key: string; nameEn: string; nameMk: string; trustTier: Category['trustTier']; fromPrice: number | null; giverCount: number }[]
  stats: { categoryCount: number; giverCount: number; completedCount: number }
  givers: { name: string; neighbourhood: string; ratingAvg: number; ratingCount: number; fromPrice: number }[]
  reviews: { authorName: string; stars: number; text: string; categoryKey: string; categoryNameEn: string; categoryNameMk: string }[]
}
export interface Category { id: number; key: string; nameEn: string; nameMk: string; trustTier: 'LOW' | 'MEDIUM' | 'HIGH' }

export interface Favor {
  id: number; requesterId: number; categoryId: number; categoryNameEn: string; categoryNameMk: string
  title: string; description: string | null; neighbourhood: string
  whenType: 'ASAP' | 'SCHEDULED'; whenAt: string | null; budget: number | null
  status: 'OPEN' | 'BOOKED' | 'CLOSED' | 'CANCELLED'; visibility: string; createdAt: string
}

export interface CreateFavorInput {
  categoryId: number; title: string; description?: string; neighbourhood?: string
  whenType?: 'ASAP' | 'SCHEDULED'; whenAt?: string; budget?: number
}

/** The category can't change after posting. */
export type UpdateFavorInput = Partial<Omit<CreateFavorInput, 'categoryId'>>

export interface GiverMatch {
  userId: number; displayName: string; avatarUrl: string | null; neighbourhood: string
  price: number; ratingAvg: number; ratingCount: number; verified: boolean
  bio: string | null; completedCount: number
}

export interface GiverProfile {
  userId: number; displayName: string; neighbourhood: string; bio: string | null
  availability: string | null; verified: boolean
  ratingAvg: number; ratingCount: number; completedCount: number
  categories: { categoryId: number; nameEn: string; nameMk: string; price: number }[]
}

export type BookingStatus = 'REQUESTED' | 'CONFIRMED' | 'DECLINED' | 'CANCELLED' | 'EXPIRED' | 'COMPLETED' | 'CLOSED'

export interface Booking {
  id: number; favorId: number; requesterId: number; giverId: number; origin: 'DIRECT_REQUEST' | 'GIVER_OFFER'
  offerId: number | null; status: BookingStatus; note: string | null; price: number | null; requestedAt: string
  respondedAt: string | null; completedAt: string | null; cancelReason: string | null
  paymentStatus: PaymentStatus | null
}

export type PaymentStatus = 'HELD' | 'RELEASED' | 'REFUNDED' | 'PARTIALLY_REFUNDED'

/** Before paying, status is UNPAID and only the amounts are set. */
export interface Payment {
  bookingId: number; status: PaymentStatus | 'UNPAID'; amount: number; fee: number; total: number
  cardBrand: string | null; cardLast4: string | null; paidAt: string | null; freeCancelUntil: string | null
  refundAmount: number | null; giverPayout: number | null; settledAt: string | null
}

export interface PayInput { cardNumber: string; expiry: string; cvc: string; holderName: string }

/** What cancelling now would do; paid=false means nothing was charged. */
export interface CancelPreview { paid: boolean; refund: number; giverPayout: number; free: boolean; freeUntil: string | null }

export interface BookingListItem {
  id: number; favorId: number; status: BookingStatus; origin: 'DIRECT_REQUEST' | 'GIVER_OFFER'; price: number | null
  requestedAt: string; completedAt: string | null; expiresAt: string | null
  otherUserId: number; otherName: string | null
  favorTitle: string; categoryKey: string; categoryNameEn: string; categoryNameMk: string
  whenType: 'ASAP' | 'SCHEDULED'; whenAt: string | null; myStars: number | null
  paymentStatus: PaymentStatus | null
}

export interface Contact { phone: string | null; displayName: string }

export interface Offer {
  id: number; favorId: number; giverId: number; message: string | null; proposedPrice: number | null
  proposedTime: string | null; status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN' | 'EXPIRED'; createdAt: string
}

export interface DashboardRequest {
  favorId: number; title: string; categoryKey: string; budget: number | null; favorStatus: Favor['status']
  whenType: 'ASAP' | 'SCHEDULED'; whenAt: string | null; matchCount: number | null
  booking: { id: number; status: BookingStatus; giverName: string | null; price: number | null; completedAt: string | null; needsRating: boolean } | null
}

export interface RequesterDashboard {
  stats: { completedCount: number; ratingAvg: number; ratingCount: number; spentThisMonth: number }
  requests: DashboardRequest[]
  toRate: { bookingId: number; giverName: string | null; favorTitle: string; completedAt: string | null }[]
}

export interface GiverDashboard {
  stats: { completedCount: number; ratingAvg: number; ratingCount: number; acceptRate: number | null; earnedThisMonth: number }
  requests: {
    bookingId: number; requesterName: string | null; categoryKey: string; categoryNameEn: string; categoryNameMk: string
    neighbourhood: string; whenType: 'ASAP' | 'SCHEDULED'; whenAt: string | null; price: number | null; note: string | null; requestedAt: string; expiresAt?: string
  }[]
  upcoming: { bookingId: number; requesterName: string | null; favorTitle: string; whenType: 'ASAP' | 'SCHEDULED'; whenAt: string | null; price: number | null }[]
  recentRatings: { authorName: string | null; stars: number; text: string | null; publishedAt: string }[]
}

export interface ReviewStatus { mineSubmitted: boolean; theirsSubmitted: boolean; published: boolean }

export type NotificationType =
  | 'BOOKING_REQUESTED' | 'BOOKING_ACCEPTED' | 'BOOKING_DECLINED' | 'BOOKING_CANCELLED' | 'BOOKING_COMPLETED'
  | 'BOOKING_EXPIRED' | 'OFFER_RECEIVED' | 'OFFER_ACCEPTED' | 'OFFER_REJECTED' | 'REVIEW_RECEIVED'
  | 'PAYMENT_RECEIVED' | 'PAYOUT_RELEASED' | 'REFUND_ISSUED'

export interface AppNotification {
  id: number; type: NotificationType; bookingId: number | null; offerId: number | null; favorId: number | null
  actorName: string | null; favorTitle: string | null; amount: number | null; createdAt: string; read: boolean
}

export interface ChatMessage { role: 'user' | 'assistant'; content: string }
