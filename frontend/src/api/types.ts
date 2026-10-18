// Mirrors the backend DTOs (see backend/src/main/java/com/runmyerrands/**/dto)

export interface AuthResponse { accessToken: string; refreshToken: string; userId: number; displayName: string }

export interface Me {
  id: number; email: string; displayName: string; phone: string | null; neighbourhood: string
  avatarUrl: string | null; locale: 'en' | 'mk'; requester: boolean; giver: boolean
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

export interface GiverMatch {
  userId: number; displayName: string; avatarUrl: string | null; neighbourhood: string
  price: number; ratingAvg: number; ratingCount: number; verified: boolean
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

export interface ReviewStatus { mineSubmitted: boolean; theirsSubmitted: boolean; published: boolean }
