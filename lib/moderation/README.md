# Moderation word list

Auto-detection **flags content for admin review**; it does not block publishing.

1. Edit `wordlist.ts` — add Hebrew terms to `MODERATION_TERMS` and/or `MODERATION_PHRASES`.
2. Deploy app code (no extra SQL for list changes).
3. Run `supabase/moderation.sql` once in Supabase if not already applied.

Tips:

- Prefer specific phrases over very short stems (fewer false positives).
- Test with a private account before expanding the list in production.
- User **Report** buttons always create a flag regardless of the word list.
