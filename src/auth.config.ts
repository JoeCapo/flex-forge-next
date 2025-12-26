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
            const isAuthPage = nextUrl.pathname.startsWith('/login') || nextUrl.pathname.startsWith('/register') || nextUrl.pathname.startsWith('/admin/login')
            const isAdminRoute = nextUrl.pathname.startsWith('/admin')
            const isAdminLoginPage = nextUrl.pathname.startsWith('/admin/login')

            if (isAuthPage) {
                if (isLoggedIn) {
                    // Logic: If admin, go to admin dashboard. If user, go to user dashboard.
                    // But if they are just visiting login page, we might want to let them if they want to switch accounts?
                    // Standard practice: redirect to home.
                    const role = (auth.user as any).role
                    if (role === 'admin') {
                        return Response.redirect(new URL('/admin/dashboard', nextUrl))
                    } else {
                        return Response.redirect(new URL('/', nextUrl))
                    }
                }
                return true
            }

            // Protect Admin Routes
            if (isAdminRoute && !isAdminLoginPage) {
                if (!isLoggedIn) {
                    return Response.redirect(new URL('/admin/login', nextUrl))
                }
                if ((auth.user as any).role !== 'admin') {
                    return Response.redirect(new URL('/', nextUrl))
                }
            }

            // Protect App Routes (everything else needs login)
            if (!isLoggedIn) {
                const loginUrl = new URL('/login', nextUrl);
                // Only add callbackUrl if we're not on the home page
                if (nextUrl.pathname !== '/') {
                    loginUrl.searchParams.set('callbackUrl', nextUrl.toString());
                }
                return Response.redirect(loginUrl);
            }

            return true
        },
    },
} satisfies NextAuthConfig
