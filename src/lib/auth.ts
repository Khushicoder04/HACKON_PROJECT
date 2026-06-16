import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/utils";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: "user" | "admin";
    };
  }

  interface User {
    role?: "user" | "admin";
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: "user" | "admin";
  }
}

async function getOrCreateUser(email: string, name?: string | null, image?: string | null, passwordHash?: string) {
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  if (existing) {
    if (image && existing.image !== image) {
      await supabase.from("users").update({ image, name: name || existing.name }).eq("id", existing.id);
    }
    return existing;
  }

  const role = isAdminEmail(email) ? "admin" : "user";

  const { data: newUser, error } = await supabase
    .from("users")
    .insert({
      email,
      name: name || email.split("@")[0],
      image,
      password_hash: passwordHash || null,
      role,
    })
    .select()
    .single();

  if (error) throw error;
  return newUser;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const supabase = createAdminClient();
        const { data: user } = await supabase
          .from("users")
          .select("*")
          .eq("email", credentials.email as string)
          .single();

        if (!user?.password_hash) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password_hash
        );

        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        const dbUser = await getOrCreateUser(user.email, user.name, user.image);
        user.id = dbUser.id;
        user.role = dbUser.role;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role || "user";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.role = (token.role as "user" | "admin") || "user";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    newUser: "/dashboard",
  },
  session: {
    strategy: "jwt",
  },
  trustHost: true,
});
