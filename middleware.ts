export { default } from 'next-auth/middleware'

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/transfer/:path*',
    '/pay/:path*',
    '/history/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/topup/:path*',
    '/api/wallet/:path*',
    '/api/transfer/:path*',
    '/api/payment/:path*',
    '/api/transactions/:path*',
    '/api/users/:path*',
  ],
}
