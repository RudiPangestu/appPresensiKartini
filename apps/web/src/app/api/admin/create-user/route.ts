import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

// Server-side Supabase client with service_role key (bypass RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, role, nama, no_hp } = body;

    if (!email || !password || !role || !nama) {
      return NextResponse.json({ error: "Semua field wajib diisi" }, { status: 400 });
    }

    // 1. Buat auth user via Admin API
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (authErr) {
      return NextResponse.json({ error: authErr.message }, { status: 400 });
    }

    // 2. Insert ke user_roles (bypass RLS)
    const { error: roleErr } = await supabaseAdmin.from("user_roles").insert({
      id: authData.user.id,
      role,
    });
    if (roleErr) {
      return NextResponse.json({ error: roleErr.message }, { status: 500 });
    }

    // 3. Insert ke profiles
    const { error: profileErr } = await supabaseAdmin.from("profiles").insert({
      user_id: authData.user.id,
      nama,
      no_hp: no_hp || null,
    });
    if (profileErr) {
      return NextResponse.json({ error: profileErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, userId: authData.user.id });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}
