"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  isAllowedPostImageFile,
  POST_IMAGE_MAX_UPLOAD_BYTES,
} from "@/lib/images/post-image-file";
import { sendCommentNotificationEmail } from "@/lib/notifications/comment-email";
import {
  postImagePathFromPublicUrl,
  postImagePublicUrl,
  postImageStoragePath,
  POST_IMAGES_BUCKET,
} from "@/lib/storage/post-image-url";
import { getAcceptedConnections } from "@/lib/data/connections";
import { usersAreConnected } from "@/lib/data/messages";
import { getLocale } from "@/lib/i18n/get-locale";
import { createT, getMessages } from "@/lib/i18n/messages";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/lib/supabase/admin";

type PostInsert = Database["public"]["Tables"]["posts"]["Insert"];
type PostCommentInsert = Database["public"]["Tables"]["post_comments"]["Insert"];
type PostShareInsert = Database["public"]["Tables"]["post_shares"]["Insert"];
type MessageInsert = Database["public"]["Tables"]["direct_messages"]["Insert"];

const MAX_POST_BODY = 4000;
const MAX_COMMENT_BODY = 2000;

function getBody(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export async function createPost(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const body = getBody(formData, "body");
  if (!body || body.length > MAX_POST_BODY) {
    return { error: "invalid-body" as const };
  }

  const imageField = formData.get("image");
  const imageFile =
    imageField instanceof File && imageField.size > 0 ? imageField : null;

  if (imageFile && !isAllowedPostImageFile(imageFile, POST_IMAGE_MAX_UPLOAD_BYTES)) {
    return { error: "invalid-image" as const };
  }

  const postId = randomUUID();
  let imageUrl: string | null = null;

  if (imageFile) {
    const path = postImageStoragePath(user.id, postId);
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const uploadOpts = { upsert: true, contentType: "image/jpeg" as const };

    const { error: uploadError } = await supabase.storage
      .from(POST_IMAGES_BUCKET)
      .upload(path, buffer, uploadOpts);

    let uploaded = !uploadError;

    if (uploadError) {
      const admin = createAdminClient();
      if (admin) {
        const { error: adminError } = await admin.storage
          .from(POST_IMAGES_BUCKET)
          .upload(path, buffer, uploadOpts);
        uploaded = !adminError;
        if (adminError) {
          const code = adminError.message.toLowerCase();
          if (code.includes("bucket") || code.includes("not found")) {
            return { error: "storage-not-configured" as const };
          }
        }
      } else {
        const code = uploadError.message.toLowerCase();
        if (code.includes("bucket") || code.includes("not found")) {
          return { error: "storage-not-configured" as const };
        }
      }
    }

    if (!uploaded) {
      return { error: "insert-failed" as const };
    }

    imageUrl = postImagePublicUrl(path);
    if (!imageUrl) {
      return { error: "insert-failed" as const };
    }
  }

  const row: PostInsert = {
    id: postId,
    author_id: user.id,
    body,
    image_url: imageUrl,
  };

  let { error } = await supabase.from("posts").insert(row as never);

  if (error?.message?.toLowerCase().includes("image_url")) {
    ({ error } = await supabase.from("posts").insert({
      id: postId,
      author_id: user.id,
      body,
    } as never));
    if (!error && imageUrl) {
      await supabase.storage.from(POST_IMAGES_BUCKET).remove([postImageStoragePath(user.id, postId)]);
    }
  }

  if (error) {
    if (imageUrl) {
      await supabase.storage.from(POST_IMAGES_BUCKET).remove([postImageStoragePath(user.id, postId)]);
    }
    return { error: "insert-failed" as const };
  }

  revalidatePath("/home");
  return { success: true as const };
}

export async function togglePostLike(postId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "unauthorized" as const };
  }

  const { data: existing, error: selectError } = await supabase
    .from("post_likes")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (selectError) {
    return { error: "toggle-failed" as const };
  }

  if (existing) {
    const { error: deleteError } = await supabase
      .from("post_likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id);

    if (deleteError) {
      return { error: "toggle-failed" as const };
    }

    revalidatePath("/home");
    return { success: true as const, liked: false as const };
  }

  const { error: insertError } = await supabase
    .from("post_likes")
    .insert({ post_id: postId, user_id: user.id } as never);

  if (insertError) {
    return { error: "toggle-failed" as const };
  }

  revalidatePath("/home");
  return { success: true as const, liked: true as const };
}

export async function addPostComment(postId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "unauthorized" as const };
  }

  const body = getBody(formData, "body");
  if (!body || body.length > MAX_COMMENT_BODY) {
    return { error: "invalid-body" as const };
  }

  const row: PostCommentInsert = {
    post_id: postId,
    author_id: user.id,
    body,
  };

  const { error } = await supabase.from("post_comments").insert(row as never);

  if (error) {
    return { error: "insert-failed" as const };
  }

  // Low-cost notification: send one email only on new comments.
  const [{ data: post }, { data: commenterProfile }] = await Promise.all([
    supabase
      .from("posts")
      .select("author_id, body")
      .eq("id", postId)
      .maybeSingle<{ author_id: string; body: string }>(),
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle<{ full_name: string }>(),
  ]);

  if (post?.author_id && post.author_id !== user.id) {
    try {
      const admin = createAdminClient();
      if (admin) {
        const [{ data: recipientProfile }, recipientUser] = await Promise.all([
          supabase
            .from("profiles")
            .select("full_name")
            .eq("id", post.author_id)
            .maybeSingle<{ full_name: string }>(),
          admin.auth.admin.getUserById(post.author_id),
        ]);

        const recipientEmail = recipientUser.data.user?.email;
        if (recipientEmail) {
          await sendCommentNotificationEmail({
            toEmail: recipientEmail,
            recipientName: recipientProfile?.full_name ?? "",
            commenterName: commenterProfile?.full_name ?? "Someone",
            commentBody: body,
            postPreview: post.body ?? "",
            postId,
          });
        }
      }
    } catch {
      // Avoid failing comment creation due to notification issues.
    }
  }

  revalidatePath("/home");
  return { success: true as const };
}

export async function deletePost(postId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: post } = await supabase
    .from("posts")
    .select("author_id, image_url")
    .eq("id", postId)
    .maybeSingle<{ author_id: string; image_url: string | null }>();

  if (!post || post.author_id !== user.id) {
    return { error: "forbidden" as const };
  }

  const imagePath = postImagePathFromPublicUrl(post.image_url);
  if (imagePath) {
    await supabase.storage.from(POST_IMAGES_BUCKET).remove([imagePath]);
  }

  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId)
    .eq("author_id", user.id);

  if (error) {
    return { error: "delete-failed" as const };
  }

  revalidatePath("/home");
  return { success: true as const };
}

export async function listConnectionsForShare() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "unauthorized" as const, connections: [] as const };
  }

  const connections = await getAcceptedConnections(supabase, user.id);
  return {
    connections: connections.map((c) => ({
      id: c.id,
      fullName: c.fullName,
      avatarUrl: c.avatarUrl,
      initials: c.initials,
    })),
  };
}

function postShareUrl(postId: string) {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}`
      : "");
  if (base) {
    return `${base}/home#post-${postId}`;
  }
  return `/home#post-${postId}`;
}

export async function sharePostWithConnection(postId: string, peerId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "unauthorized" as const };
  }

  if (peerId === user.id) {
    return { error: "self" as const };
  }

  const connected = await usersAreConnected(supabase, user.id, peerId);
  if (!connected) {
    return { error: "not-connected" as const };
  }

  const { data: post } = await supabase
    .from("posts")
    .select("id, author_id, body")
    .eq("id", postId)
    .maybeSingle<{ id: string; author_id: string; body: string }>();

  if (!post) {
    return { error: "not-found" as const };
  }

  const [{ data: sharerProfile }, { data: authorProfile }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle<{ full_name: string }>(),
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", post.author_id)
      .maybeSingle<{ full_name: string }>(),
  ]);

  const locale = await getLocale();
  const t = createT(getMessages(locale));
  const sharerName = sharerProfile?.full_name?.trim() || "User";
  const authorName = authorProfile?.full_name?.trim() || "User";
  const link = postShareUrl(postId);
  const preview = post.body.trim().slice(0, 120);
  const messageBody = t("post.shareMessageBody")
    .replace("{sharer}", sharerName)
    .replace("{author}", authorName)
    .replace("{preview}", preview)
    .replace("{url}", link);

  const shareRow: PostShareInsert = {
    post_id: postId,
    sharer_id: user.id,
    recipient_id: peerId,
  };

  const { error: shareError } = await supabase.from("post_shares").insert(shareRow as never);

  if (shareError) {
    const lower = shareError.message.toLowerCase();
    if (lower.includes("post_shares") || lower.includes("does not exist")) {
      return { error: "shares-not-configured" as const };
    }
    if (!lower.includes("duplicate") && !lower.includes("unique")) {
      return { error: "share-failed" as const };
    }
  }

  const messageRow: MessageInsert = {
    sender_id: user.id,
    recipient_id: peerId,
    body: messageBody,
  };

  const { error: messageError } = await supabase
    .from("direct_messages")
    .insert(messageRow as never);

  if (messageError) {
    const lower = messageError.message.toLowerCase();
    if (
      lower.includes("direct_messages") ||
      lower.includes("does not exist") ||
      lower.includes("schema cache")
    ) {
      return { error: "messaging-not-configured" as const };
    }
    return { error: "share-failed" as const };
  }

  revalidatePath("/home");
  revalidatePath("/messages");
  revalidatePath(`/messages/${peerId}`);
  return { success: true as const };
}
