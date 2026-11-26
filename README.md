# td-shows

A [SvelteKit](https://svelte.dev/docs/kit) app with email + password **register** and **login**,
using [Supabase](https://supabase.com) for authentication and database.

Built with SvelteKit 3 / Svelte 5 (runes), TypeScript, and `@supabase/ssr` for cookie-based
sessions that work on both the server and the client.

## Features

- Register with email + password
- Log in / log out
- Server-validated sessions via cookies (rendered on the server, no token exposure)
- Protected route (`/dashboard`) that redirects anonymous users to the login form
- Email confirmation callback handling (PKCE `code` and `token_hash` flows)
- Progressive-enhancement forms (`use:enhance`) that work without JavaScript
- Friendly error if the Supabase environment variables are missing

## Project structure

```
src/
├── app.css                     # global styles
├── app.d.ts                    # App.Locals / App.PageData types
├── env.ts                      # declares PUBLIC_SUPABASE_* (SvelteKit env)
├── hooks.server.ts             # attaches Supabase + safeGetSession to every request
├── lib/
│   ├── projects.ts             # Project type, labels, embed-URL helper (shared)
│   ├── server/
│   │   └── projects.ts         # server-only upload/validation/cleanup helpers
│   └── supabase/
│       ├── env.ts              # reads/validates PUBLIC_SUPABASE_* env vars
│       ├── client.ts           # browser client (createBrowserClient)
│       └── server.ts           # per-request server client (createServerClient)
└── routes/
    ├── +layout.server.ts       # exposes session to all pages
    ├── +layout.svelte          # nav bar
    ├── +page.server.ts         # loads all projects for the home grid
    ├── +page.svelte            # public project grid
    ├── auth/callback/+server.ts# exchanges email-confirmation code for a session
    ├── dashboard/              # "My projects": manage (edit/delete) own projects
    ├── login/                  # login form + action
    ├── logout/+server.ts       # POST sign-out
    ├── projects/
    │   ├── new/                # add a project (auth-only)
    │   └── [id]/
    │       ├── +page.*         # embedded project player (public)
    │       ├── edit/           # edit a project (owner-only)
    │       └── delete/+server.ts # delete a project (owner-only, POST)
    └── register/               # register form + action
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

1. Go to <https://supabase.com/dashboard> and create a project.
2. Open **Project Settings → API** and copy the **Project URL** and **anon public** key.

### 3. Configure environment variables

```bash
cp .env.example .env
```

Then edit `.env`:

```dotenv
PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

### 4. Configure auth in the Supabase dashboard

- **Authentication → Providers → Email**: make sure it is enabled.
- **Authentication → URL Configuration**:
  - **Site URL**: `http://localhost:5173`
  - **Redirect URLs**: add `http://localhost:5173/auth/callback`

> The email-confirmation flow uses `/auth/callback` as the `emailRedirectTo`. If you turn
> **"Confirm email" off** (Authentication → Providers → Email), sign-up logs the user in
> immediately and no email is sent.

### 5. Run the dev server

```bash
npm run dev
```

Visit <http://localhost:5173>, then try `/register` and `/login`.

## Scripts

| Command           | Description                          |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Start the dev server                 |
| `npm run build`   | Production build                     |
| `npm run preview` | Preview the production build         |
| `npm run check`   | Type-check with `svelte-check`       |

## Optional: a `profiles` table

Supabase Auth stores users in the built-in `auth.users` table. If you want to store extra
profile data (display name, avatar, etc.), create a `profiles` table and keep it in sync with a
trigger:

```sql
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

Then query it from your server code, e.g. in `src/routes/dashboard/+page.server.ts`:

```ts
const { data: profile } = await locals.supabase
	.from('profiles')
	.select('*')
	.eq('id', user.id)
	.single();
```

## Projects feature

The home page lists all projects in a public grid (no sign-in required). Opening a project shows it
embedded in an iframe so it can be played.

- **Browse** projects — public, no account needed
- **Add** a project — requires sign-in (`/projects/new`)
- **Manage** your projects — edit and delete from `/dashboard`, or via the Edit button on a project
  you own. Only the owner can edit or delete a project (enforced by RLS).

Projects are stored in the `projects` table; thumbnails and uploaded files live in the `thumbnails`
and `project-files` storage buckets. Apply the schema by running the files in
[`supabase/migrations/`](supabase/migrations) in order (or `supabase db push`):

| Migration                              | Contents                                     |
| -------------------------------------- | -------------------------------------------- |
| `0001_projects.sql`                    | Table, grants, RLS, storage buckets/policies |
| `0002_project_ownership.sql`           | Owner-only update/delete policies            |

Scratch links are automatically rewritten to their `/embed` URL; other links are embedded as-is.

## Notes

- The server never trusts the cookie's session blindly: `hooks.server.ts` re-validates it with
  `auth.getUser()` before exposing `locals.user`.
- Login redirects are restricted to same-site relative paths to prevent open redirects.
# tshowcase
