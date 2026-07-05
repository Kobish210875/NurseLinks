-- Anonymous discussion starters — run in Supabase SQL Editor (DEV first).
-- Safe to re-run: skips titles that already exist.

grant select, insert, update, delete on public.discussion_threads to service_role;
grant select, insert, update, delete on public.discussion_replies to service_role;

do $$
declare
  author uuid;
begin
  select coalesce(
    (select user_id from public.admin_users limit 1),
    (select id from public.profiles limit 1)
  ) into author;

  if author is null then
    raise exception 'No author profile found';
  end if;

  if not exists (select 1 from public.discussion_threads where title = 'איזה נעליים הכי נוחות למשמרת של 12 שעות?') then
    insert into public.discussion_threads (author_id, title, body, is_anonymous, anonymous_label)
    values (author, 'איזה נעליים הכי נוחות למשמרת של 12 שעות?', 'מחפשת המלצות מהשטח — מה באמת עובד אחרי יום ארוך על הרגליים?', true, 'אחות בט"נ');
  end if;
  if not exists (select 1 from public.discussion_threads where title = 'איך מתמודדים עם משמרת לילה בלי לשבור את השינה בימים חופשיים?') then
    insert into public.discussion_threads (author_id, title, body, is_anonymous, anonymous_label)
    values (author, 'איך מתמודדים עם משמרת לילה בלי לשבור את השינה בימים חופשיים?', 'אשמח לשמוע שגרות שעובדות לכם — אוכל, אור, שינה, משפחה.', true, 'אח משמרת לילה');
  end if;
  if not exists (select 1 from public.discussion_threads where title = 'מה הטריק שלכם לשמור על אנרגיה באמצע משמרת ארוכה?') then
    insert into public.discussion_threads (author_id, title, body, is_anonymous, anonymous_label)
    values (author, 'מה הטריק שלכם לשמור על אנרגיה באמצע משמרת ארוכה?', '12+ שעות — מה עוזר לכם לא לקרוס באמצע?', true, 'אחות מחלקה פנימית');
  end if;
  if not exists (select 1 from public.discussion_threads where title = 'איך אתם מארגנים את תחילת המשמרת?') then
    insert into public.discussion_threads (author_id, title, body, is_anonymous, anonymous_label)
    values (author, 'איך אתם מארגנים את תחילת המשמרת?', 'יש לכם checklist או הרגל קבוע שחוסך בלאגן בהמשך?', true, 'אחות חדר ניתוח');
  end if;
  if not exists (select 1 from public.discussion_threads where title = 'משמרות בוקר, ערב או לילה — מה הכי מתאים לכם?') then
    insert into public.discussion_threads (author_id, title, body, is_anonymous, anonymous_label)
    values (author, 'משמרות בוקר, ערב או לילה — מה הכי מתאים לכם?', 'סקר קטן מהקהילה — ולמה בחרתם בזה?', true, 'אחות דינמית');
  end if;
  if not exists (select 1 from public.discussion_threads where title = 'איזו מחלקה לדעתכם הכי מאתגרת פיזית?') then
    insert into public.discussion_threads (author_id, title, body, is_anonymous, anonymous_label)
    values (author, 'איזו מחלקה לדעתכם הכי מאתגרת פיזית?', 'לא רק רגשית — באמת על הגוף. מה הכי קשה לכם?', true, 'אח מט"נ');
  end if;
  if not exists (select 1 from public.discussion_threads where title = 'מחלקה שפתחה לכם את הלב למקצוע — מה היה שם מיוחד?') then
    insert into public.discussion_threads (author_id, title, body, is_anonymous, anonymous_label)
    values (author, 'מחלקה שפתחה לכם את הלב למקצוע — מה היה שם מיוחד?', 'איזו חוויה או צוות גרמו לכם להרגיש שזה המקום שלכם?', true, 'אחות מיון');
  end if;
  if not exists (select 1 from public.discussion_threads where title = 'איך מתמודדים עם עומס חריג כשאין מספיק צוות?') then
    insert into public.discussion_threads (author_id, title, body, is_anonymous, anonymous_label)
    values (author, 'איך מתמודדים עם עומס חריג כשאין מספיק צוות?', 'מה עושים בפועל כשהמציאות לא תואמת את התקן?', true, 'אחות ב-ICU');
  end if;
  if not exists (select 1 from public.discussion_threads where title = 'מה עוזר לשמור על קשר טוב עם צוות רב־מקצועי?') then
    insert into public.discussion_threads (author_id, title, body, is_anonymous, anonymous_label)
    values (author, 'מה עוזר לשמור על קשר טוב עם צוות רב־מקצועי?', 'רופאים, פראמדיקים, סיעוד — טיפים לעבודה חלקה יותר.', true, 'אחות פגייה');
  end if;
  if not exists (select 1 from public.discussion_threads where title = 'מתי הזמן הנכון לעבור מחלקה או מוסד?') then
    insert into public.discussion_threads (author_id, title, body, is_anonymous, anonymous_label)
    values (author, 'מתי הזמן הנכון לעבור מחלקה או מוסד?', 'ולמתי עדיף להישאר ולתת לזה עוד זמן?', true, 'אחות עם 5 שנות ניסיון');
  end if;
  if not exists (select 1 from public.discussion_threads where title = 'הכשרה או התמחות ששינתה לכם את הקריירה?') then
    insert into public.discussion_threads (author_id, title, body, is_anonymous, anonymous_label)
    values (author, 'הכשרה או התמחות ששינתה לכם את הקריירה?', 'מה הייתם ממליצים לקולגה שחושב על צעד הבא?', true, 'אחות מומחית');
  end if;
  if not exists (select 1 from public.discussion_threads where title = 'איך מתכוננים לראיון עבודה במחלקה שחלמתם עליה?') then
    insert into public.discussion_threads (author_id, title, body, is_anonymous, anonymous_label)
    values (author, 'איך מתכוננים לראיון עבודה במחלקה שחלמתם עליה?', 'שאלות, תרגול, מה לשאול את המראיין/ת?', true, 'אח/אחות חדש/ה');
  end if;
  if not exists (select 1 from public.discussion_threads where title = 'עבודה במוסד ציבורי מול פרטי — מה היתרונות והחסרונות?') then
    insert into public.discussion_threads (author_id, title, body, is_anonymous, anonymous_label)
    values (author, 'עבודה במוסד ציבורי מול פרטי — מה היתרונות והחסרונות?', 'מניסיון אישי — מה surprised אתכם?', true, 'אחות מהשטח');
  end if;
  if not exists (select 1 from public.discussion_threads where title = 'מה עוזר לכם "לנתק" אחרי משמרת קשה?') then
    insert into public.discussion_threads (author_id, title, body, is_anonymous, anonymous_label)
    values (author, 'מה עוזר לכם "לנתק" אחרי משמרת קשה?', 'איך לא לקחת את הביתה את כל מה שראיתם?', true, 'אחות אחרי משמרת');
  end if;
  if not exists (select 1 from public.discussion_threads where title = 'איך מדברים עם משפחות במצבים רגישים?') then
    insert into public.discussion_threads (author_id, title, body, is_anonymous, anonymous_label)
    values (author, 'איך מדברים עם משפחות במצבים רגישים?', 'מה עוזר לכם להישאר נוכחים ואנושיים?', true, 'אחות אונקולוגיה');
  end if;
  if not exists (select 1 from public.discussion_threads where title = 'סימנים שאתם מתקרבים לשחיקה — ומה עשיתם כשזיהיתם?') then
    insert into public.discussion_threads (author_id, title, body, is_anonymous, anonymous_label)
    values (author, 'סימנים שאתם מתקרבים לשחיקה — ומה עשיתם כשזיהיתם?', 'אין בושה לדבר על זה. מה עזר לכם?', true, 'אחות שמקשיבה לעצמה');
  end if;
  if not exists (select 1 from public.discussion_threads where title = 'איזה ציוד אישי לא הייתם מוותרים עליו במשמרת?') then
    insert into public.discussion_threads (author_id, title, body, is_anonymous, anonymous_label)
    values (author, 'איזה ציוד אישי לא הייתם מוותרים עליו במשמרת?', 'מד לחץ, תיק, עט, כלים — מה חייב להיות איתכם?', true, 'אחות עם תיק מלא');
  end if;
  if not exists (select 1 from public.discussion_threads where title = 'אפליקציות או כלים דיגיטליים שעוזרים לכם בעבודה?') then
    insert into public.discussion_threads (author_id, title, body, is_anonymous, anonymous_label)
    values (author, 'אפליקציות או כלים דיגיטליים שעוזרים לכם בעבודה?', 'מה באמת שווה את זה ולא רק hype?', true, 'אח דיגיטלי');
  end if;
  if not exists (select 1 from public.discussion_threads where title = 'טיפים לשמירה על הגב, הברכיים והרגליים אחרי שנים על הרגליים?') then
    insert into public.discussion_threads (author_id, title, body, is_anonymous, anonymous_label)
    values (author, 'טיפים לשמירה על הגב, הברכיים והרגליים אחרי שנים על הרגליים?', 'מי שעבר את זה — מה הייתם אומרים לעצמכם בהתחלה?', true, 'אחות 15 שנים במקצוע');
  end if;
  if not exists (select 1 from public.discussion_threads where title = 'איך מסבירים לחברים ולמשפחה מה באמת קורה במשמרת?') then
    insert into public.discussion_threads (author_id, title, body, is_anonymous, anonymous_label)
    values (author, 'איך מסבירים לחברים ולמשפחה מה באמת קורה במשמרת?', 'מי שלא במקצוע — איך גורמים להם להבין?', true, 'אחות עם משפחה');
  end if;
  if not exists (select 1 from public.discussion_threads where title = 'איך מוצאים איזון בין חיים אישיים לעבודה במשמרות?') then
    insert into public.discussion_threads (author_id, title, body, is_anonymous, anonymous_label)
    values (author, 'איך מוצאים איזון בין חיים אישיים לעבודה במשמרות?', 'זוגיות, ילדים, חברים — מה עובד לכם?', true, 'אחות אמא למשמרות');
  end if;
end $$;

notify pgrst, 'reload schema';
