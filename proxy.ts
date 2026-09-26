import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export async function proxy(request: NextRequest) {
    const session = await auth.api.getSession({ headers: request.headers });
    const path = request.nextUrl.pathname;

    if (!session && (path.startsWith("/candidate") || path.startsWith("/employer") || path.startsWith("/admin"))) {
        const loginUrl = new URL(path.startsWith("/admin") ? "/auth/admin/login" : "/auth/login", request.url);
        if (path.startsWith("/candidate")) {
            loginUrl.searchParams.set("role", "candidate");
        }
        if (path.startsWith("/employer")) {
            loginUrl.searchParams.set("role", "employer");
        }
        loginUrl.searchParams.set("redirect", path);
        return NextResponse.redirect(loginUrl);
    }

    if (session) {
        const role = session.user.role;

        if (path.startsWith("/candidate") && role !== "candidate") {
            return NextResponse.redirect(new URL(role === "employer" ? "/employer/dashboard" : role === "admin" ? "/admin" : "/", request.url));
        }

        if (path.startsWith("/employer") && role !== "employer") {
            return NextResponse.redirect(new URL(role === "candidate" ? "/candidate/dashboard" : role === "admin" ? "/admin" : "/", request.url));
        }

        if (path.startsWith("/admin") && role !== "admin") {
            return NextResponse.redirect(new URL(role === "candidate" ? "/candidate/dashboard" : role === "employer" ? "/employer/dashboard" : "/", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/candidate/:path*", "/employer/:path*", "/admin/:path*"],
};
