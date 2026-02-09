import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
    session: {
        strategy: "jwt",
    },
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Invalid credentials");
                }

                const [user] = await db.select().from(users).where(eq(users.email, credentials.email));

                if (!user || !user.password) {
                    throw new Error("Invalid credentials");
                }

                const isPasswordCorrect = await bcrypt.compare(credentials.password, user.password);

                if (!isPasswordCorrect) {
                    throw new Error("Invalid credentials");
                }

                if (user.status !== "approved") {
                    throw new Error("Your account is pending admin approval.");
                }

                return {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    status: user.status,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as any).role;
                token.status = (user as any).status;
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.role = token.role;
                session.user.status = token.status;
                session.user.id = token.id;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
};
