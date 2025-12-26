import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    providers: [], // Providers added in auth.ts
    callbacks: {
        jwt({ token, user }) {
            if (user) {
                token.role = (user as any).role
            }
            return token
        },
        session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.sub;
                (session.user as any).role = token.role
            }
            return session
        },
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            const isAuthPage = nextUrl.pathname.startsWith('/login')
            const isAdminPage = nextUrl.pathname.startsWith('/admin')

            if (isAuthPage) {
                if (isLoggedIn) {
                    return Response.redirect(new URL('/', nextUrl)) // Redirect to Dashboard
                }
                return true
            }

            // Protect all other routes (Admin, Dashboard, Schedule, Workouts)
            if (!isLoggedIn) {
                return false;
            }

            return true
        },
    },
} satisfies NextAuthConfig
