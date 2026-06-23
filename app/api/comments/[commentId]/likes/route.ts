import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type LikerRow = {
  user_id: string;
  created_at: string;
};

type ProfileRow = {
  id: string;
  full_name: string;
  avatar_url: string | null;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ commentId: string }> },
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { commentId } = await params;

  const { data: likeRows, error: likeError } = await supabase
    .from("post_comment_likes")
    .select("user_id, created_at")
    .eq("comment_id", commentId)
    .order("created_at", { ascending: false })
    .limit(100)
    .returns<LikerRow[]>();

  if (likeError) {
    return NextResponse.json({ error: likeError.message }, { status: 500 });
  }

  if (!likeRows || likeRows.length === 0) {
    return NextResponse.json({ likers: [] });
  }

  const userIds = likeRows.map((r) => r.user_id);

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", userIds)
    .returns<ProfileRow[]>();

  const profileMap = new Map<string, ProfileRow>(
    (profiles ?? []).map((p) => [p.id, p]),
  );

  const likers = likeRows.map((row) => {
    const p = profileMap.get(row.user_id);
    return {
      userId: row.user_id,
      fullName: p?.full_name ?? "—",
      avatarUrl: p?.avatar_url ?? null,
    };
  });

  return NextResponse.json({ likers });
}
