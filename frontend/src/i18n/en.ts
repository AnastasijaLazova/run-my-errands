export const en = {
  appName: 'Run My Errands',
  nav: { home: 'Home', post: 'Post a favor', bookings: 'My bookings', giverHome: 'Giver dashboard', requester: 'Requester', browse: 'Open requests', notifications: 'Alerts', logout: 'Log out', login: 'Log in' },
  auth: { loginTitle: 'Welcome back', registerTitle: 'Create your account', email: 'Email', password: 'Password', name: 'Full name', neighbourhood: 'Neighbourhood', neighbourhoodPlaceholder: 'e.g. Debar Maalo', neighbourhoodHint: 'Exact address is only shared after a booking is confirmed.', phone: 'Phone (optional)', phoneHint: 'Your number is only shared after a booking is confirmed.', signIn: 'Sign in', createAccount: 'Create account', continue: 'Continue', terms: 'By continuing you accept the community rules.', heroTitle: 'Someone two streets away is already doing that errand.', heroSub: 'Post the favor with your price, see Givers and their neighbourhoods, book one. You settle the money between yourselves.', login: 'Log in', register: 'Sign up', noAccount: 'No account yet?', haveAccount: 'Already have an account?' },
  dash: {
    morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening',
    summary: (live: number, confirmed: number) =>
      live === 0 && confirmed === 0 ? 'Nothing on the go right now — post a favor when you need a hand.'
        : `You have ${live === 1 ? 'one live request' : `${live} live requests`} and ${confirmed === 1 ? 'one confirmed booking' : `${confirmed} confirmed bookings`}.`,
    completedCount: 'Requests completed', yourRating: 'Your rating', spentThisMonth: 'Spent this month', den: 'ден',
    yourRequests: 'Your requests', noRequests: 'No requests yet.', open: 'Open',
    live: 'Live', requested: 'Requested', confirmed: 'Confirmed', rate: 'Rate', done: 'Done',
    matches: (n: number) => (n === 1 ? '1 match' : `${n} matches`),
    waitingFor: (name: string) => `waiting for ${name}`,
    confirmedWith: (name: string) => `confirmed with ${name}`,
    completed: 'Completed', needsRating: 'needs rating', today: 'Today', tomorrow: 'Tomorrow', yesterday: 'yesterday',
    waitingOnRating: 'Waiting on your rating', ratingTwoWay: 'Rating is two-way — yours publishes once both sides have rated.',
    rateName: (name: string) => `Rate ${name}`,
  },
  common: { loading: 'Loading…', empty: 'Nothing here yet.', save: 'Save', cancel: 'Cancel', back: 'Back', error: 'Something went wrong' },
  favor: { postTitle: 'Request a favor', category: 'Category', title: 'What do you need?', description: 'Details', budget: 'Your price (MKD)', when: 'When', asap: 'As soon as possible', scheduled: 'Pick a date & time', neighbourhood: 'Neighbourhood', submit: 'Find givers', mine: 'My requests', matches: 'Available givers', noMatches: 'No givers match yet — try a different price or check back later.', book: 'Request booking', offers: 'Offers received', byRating: 'Top rated', byPrice: 'Lowest price' },
  giver: { dashTitle: 'Giver home', onboardingTitle: 'Set up your giver profile', pickCategories: 'Pick what you do and set a price for each', bio: 'About you', save: 'Save profile', profile: 'Giver profile', rating: 'Rating', completed: 'completed', verified: 'Verified', browseTitle: 'Open requests', makeOffer: 'Send offer', offerMessage: 'Message', offerPrice: 'Your price (MKD)', myOffers: 'My offers' },
  booking: { title: 'My bookings', detail: 'Booking', status: 'Status', accept: 'Accept', decline: 'Decline', cancel: 'Cancel', complete: 'Mark complete', rate: 'Leave a review', contact: 'Contact', contactHidden: 'Phone number appears here once the booking is confirmed.', asRequester: 'As requester', asGiver: 'As giver' },
  rate: { title: 'Rate your experience', stars: 'Stars', text: 'Comment (optional)', submit: 'Submit review', blind: 'Reviews are hidden until you both submit, or 7 days pass.', done: 'Thanks — your review is in.' },
  notifications: { title: 'Alerts', todo: 'Notifications are not built yet (planned: backend notifications table + live updates).' },
}
export type Dict = typeof en
