"use server";

import { cookies, headers } from "next/headers";
import { getSupabaseAuthClient } from "@/lib/supabase/server";

export async function signInWithOAuthAction(provider) {
  try {
    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3000";
    const proto = headersList.get("x-forwarded-proto") || "http";
    const siteUrl = `${proto}://${host}`;

    const supabase = await getSupabaseAuthClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${siteUrl}/auth/callback`,
      },
    });

    if (error) {
      console.error("signInWithOAuth error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, url: data.url };
  } catch (err) {
    console.error("signInWithOAuth exception:", err);
    return { success: false, error: err.message };
  }
}

export async function signInWithIdTokenAction(idToken) {
  try {
    const supabase = await getSupabaseAuthClient();
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token: idToken,
    });

    if (error) {
      console.error("signInWithIdToken error:", error);
      return { success: false, error: error.message };
    }

    if (data?.session) {
      const cookieStore = await cookies();
      cookieStore.set("sb-access-token", data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: data.session.expires_in,
      });
      cookieStore.set("sb-refresh-token", data.session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });
      return { success: true };
    }

    return { success: false, error: "Authentication failed. No session returned." };
  } catch (err) {
    console.error("signInWithIdToken exception:", err);
    return { success: false, error: err.message };
  }
}

export async function signUpAction(email, password) {
  try {
    const supabase = await getSupabaseAuthClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error("SignUp error:", error);
      return { success: false, error: error.message };
    }

    if (data?.session) {
      // Auto logged in
      const cookieStore = await cookies();
      cookieStore.set("sb-access-token", data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: data.session.expires_in,
      });
      cookieStore.set("sb-refresh-token", data.session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });
      return { success: true };
    }

    return {
      success: true,
      message: "Please check your email for the confirmation link to complete sign up.",
    };
  } catch (err) {
    console.error("SignUp exception:", err);
    return { success: false, error: err.message };
  }
}

export async function signInAction(email, password) {
  try {
    const supabase = await getSupabaseAuthClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("SignIn error:", error);
      return { success: false, error: error.message };
    }

    if (data?.session) {
      const cookieStore = await cookies();
      cookieStore.set("sb-access-token", data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: data.session.expires_in,
      });
      cookieStore.set("sb-refresh-token", data.session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });
      return { success: true };
    }

    return { success: false, error: "Authentication failed. No session returned." };
  } catch (err) {
    console.error("SignIn exception:", err);
    return { success: false, error: err.message };
  }
}

export async function signOutAction() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("sb-access-token");
    cookieStore.delete("sb-refresh-token");
    return { success: true };
  } catch (err) {
    console.error("SignOut exception:", err);
    return { success: false, error: err.message };
  }
}

export async function getSessionUser() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("sb-access-token")?.value;

    if (!accessToken) {
      return null;
    }

    const supabase = await getSupabaseAuthClient();
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error) {
      // Access token might be expired. Try using refresh token if present.
      const refreshToken = cookieStore.get("sb-refresh-token")?.value;
      if (refreshToken) {
        const { data: refreshData, error: refreshError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (!refreshError && refreshData?.user) {
          // Store the refreshed session tokens
          cookieStore.set("sb-access-token", refreshData.session.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: refreshData.session.expires_in,
          });
          return refreshData.user;
        }
      }
      return null;
    }

    return user;
  } catch (err) {
    console.error("getSessionUser exception:", err);
    return null;
  }
}
