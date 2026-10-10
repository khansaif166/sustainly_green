-- Purpose: store the mobile number collected on the register form.
--
-- The form sends it as signup metadata (user_metadata.phone). Rather than have
-- the app write the column, this trigger copies it onto the profile when the
-- row is created, so the app and this migration can ship in either order:
-- before the migration the metadata simply waits in auth.users.

alter table public.profiles
  add column if not exists phone text;

create or replace function public.set_profile_phone_from_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  signup_phone text;
begin
  if new.phone is null and new.auth_user_id is not null then
    select u.raw_user_meta_data ->> 'phone'
      into signup_phone
      from auth.users u
     where u.id = new.auth_user_id;

    -- user_metadata is client-writable, so only keep something phone-shaped
    -- (the register form normalises to this: optional +, 10-15 digits).
    if signup_phone ~ '^\+?[0-9]{10,15}$' then
      new.phone := signup_phone;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists set_profile_phone_from_signup on public.profiles;
create trigger set_profile_phone_from_signup
before insert on public.profiles
for each row execute function public.set_profile_phone_from_signup();
