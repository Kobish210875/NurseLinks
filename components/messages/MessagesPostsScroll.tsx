"use client";

import FeedPostsScroll from "@/components/feed/FeedPostsScroll";

type MessagesPostsScrollProps = {
  children: React.ReactNode;
};

export default function MessagesPostsScroll({ children }: MessagesPostsScrollProps) {
  return <FeedPostsScroll>{children}</FeedPostsScroll>;
}
