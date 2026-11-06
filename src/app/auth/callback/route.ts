import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const destination = request.nextUrl.searchParams.get("next") === "/auth/actualizar-contrasena"
    ? "/auth/actualizar-contrasena" : "/dashboard";
  const errorUrl = new URL("/login?error=callback", request.url);
  if (!code) return NextResponse.redirect(errorUrl);

  const redirect = NextResponse.redirect(new URL(destination, request.url));
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.redirect(errorUrl);

  // El callback intercambia el código con la clave pública y conserva cookies de sesión.
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(changes) {
        changes.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          redirect.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(errorUrl);
  return redirect;
}
