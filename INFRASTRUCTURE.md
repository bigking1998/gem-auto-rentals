---
title: Infrastructure & Operations Runbook
aliases: [Infrastructure, Runbook, Ops Guide, Deployment Runbook]
tags: [infrastructure, deployment, digitalocean, operations, runbook]
created: 2026-07-27
description: Authoritative record of where Gem Auto Rentals runs, how to deploy it, how backups work, and how to fix it when something breaks. Supersedes DEPLOYMENT.md.
related: ['[[WEBSITE_AUDIT]]', '[[BUGFIX_CHECKLIST]]', '[[DEPLOYMENT]]']
---

# Infrastructure & Operations Runbook

**Last verified: 2026-07-27** — everything below was tested working on this date.

> This supersedes [[DEPLOYMENT]], which describes the retired Render + Supabase setup.

---

## 1. Where everything runs

```
gemrentalcars.com        → Vercel          (customer site, static build, global CDN)
       ↓ calls
api.gemrentalcars.com    → DigitalOcean    (Express API)
admin.gemrentalcars.com  → DigitalOcean    (admin dashboard, static build via nginx)
                              ↓
                           PostgreSQL 17   (same droplet, localhost only)
```

| Thing           | Where                        | Notes                                                                     |
| --------------- | ---------------------------- | ------------------------------------------------------------------------- |
| Customer site   | **Vercel**                   | Auto-deploys on push to `master`. Kept for the CDN and instant rollbacks. |
| Admin dashboard | **Droplet**, nginx           | Built from `apps/admin`, served from `/var/www/gem/app/apps/admin/dist`   |
| API             | **Droplet**, PM2 → port 3000 | nginx reverse-proxies `api.` to it                                        |
| Database        | **Droplet**, PostgreSQL 17   | Bound to `127.0.0.1` only — not reachable from the internet               |
| DNS             | **Cloudflare**               | Account: `Biggkingg1998@gmail.com`                                        |
| File storage    | **Cloudflare R2**            | S3-compatible; credentials in the droplet env file                        |
| Email           | **Resend** (via Amazon SES)  | DNS records for this must never be touched                                |
| Payments        | **Stripe**                   | ⚠️ Currently NOT configured on the droplet — see §9                       |

### The droplet

|        |                                   |
| ------ | --------------------------------- |
| Name   | `gem-auto-rentals`                |
| IP     | `157.245.120.117`                 |
| Region | NYC3                              |
| Size   | 4 GB RAM / 2 vCPU / 80 GB disk    |
| OS     | Ubuntu 24.04 LTS                  |
| Cost   | ~$24/mo + ~$5/mo weekly snapshots |

### Retired

- **Render** — hosted the API and admin dashboard. `render.yaml` in this repo is **obsolete**.
- **Supabase** — was only ever a Postgres database (no Auth, no Storage, no SDK). The `supabase/` folder is largely inert.

---

## 2. How to deploy

### Automatic (normal path)

```bash
git push origin master
```

That's it. Two things fire in parallel:

- **Vercel** rebuilds the customer site
- **GitHub Actions** SSHes to the droplet and runs `gem-deploy`

Takes ~2 minutes. Watch it in the repo's **Actions** tab. The workflow fails loudly if the API doesn't come back healthy.

### Manual (when you need control)

```bash
ssh -i ~/.ssh/gem_auto_rentals deploy@157.245.120.117 'gem-deploy master'
```

`gem-deploy` pulls, installs, regenerates the Prisma client, rebuilds the server and admin app, restarts the API, and health-checks it.

### Rolling back

```bash
ssh -i ~/.ssh/gem_auto_rentals root@157.245.120.117
sudo -u deploy bash
cd /var/www/gem/app
git reset --hard <good-commit-sha>
pnpm --filter server exec tsc && pm2 restart gem-api
```

---

## 3. SSH keys — two, deliberately

| Key                       | Access                                               | Lives where                                    |
| ------------------------- | ---------------------------------------------------- | ---------------------------------------------- |
| `~/.ssh/gem_auto_rentals` | **Full admin** — shell, files, database              | Your Mac **only**. Never upload this anywhere. |
| `~/.ssh/gem_deploy_ci`    | **Deploy only** — can run `gem-deploy`, nothing else | GitHub secret `DEPLOY_SSH_KEY`                 |

The CI key is registered in `/home/deploy/.ssh/authorized_keys` with a **forced command**. Even with the private key, an attacker gets no shell, no file access, no port forwarding — only the ability to redeploy your own code.

**Verify the restriction still holds:**

```bash
ssh -i ~/.ssh/gem_deploy_ci deploy@157.245.120.117 'cat /etc/passwd'
# Should run a deploy, NOT print the file.
```

---

## 4. Backups

**Schedule:** nightly at 03:15 UTC via `/etc/cron.d/gem-db-backup`
**Location:** `/var/www/gem/backups/gem_YYYY-MM-DD_HHMM.sql.gz`
**Retention:** 14 days
**Safety:** the script aborts with an error if a dump comes back under 5 KB, so a silent failure can't masquerade as a good backup.

### Run one right now

```bash
ssh -i ~/.ssh/gem_auto_rentals root@157.245.120.117 'cd /var/www/gem && sudo -u deploy /usr/local/bin/gem-db-backup'
```

### Restore (tested and verified working)

```bash
ssh -i ~/.ssh/gem_auto_rentals root@157.245.120.117
LATEST=$(ls -t /var/www/gem/backups/*.sql.gz | head -1)

# always restore into a scratch DB first and check it
sudo -u postgres createdb restore_test
zcat $LATEST | sudo -u postgres psql -q restore_test
sudo -u postgres psql -tAc 'select count(*) from "Vehicle"' restore_test
```

⚠️ **Known gap:** backups live on the same droplet as the database. DigitalOcean's weekly snapshots are the only true offsite copy, so a total droplet loss could cost up to 7 days. Fixing this means shipping nightly dumps to R2 or Spaces — not yet done.

---

## 5. Common operations

```bash
# SSH in
ssh -i ~/.ssh/gem_auto_rentals root@157.245.120.117

# Is the API alive?
curl https://api.gemrentalcars.com/health

# Process status / logs / restart
sudo -u deploy bash -c 'export PATH=/usr/local/bin:$PATH; pm2 list'
sudo -u deploy bash -c 'export PATH=/usr/local/bin:$PATH; pm2 logs gem-api --lines 50'
sudo -u deploy bash -c 'export PATH=/usr/local/bin:$PATH; pm2 restart gem-api'

# Database shell
sudo -u deploy bash -c 'set -a; source /var/www/gem/server/.env; set +a; psql "$DATABASE_URL"'

# nginx
nginx -t && systemctl reload nginx
```

### Key paths

| Path                             | What                                                                                |
| -------------------------------- | ----------------------------------------------------------------------------------- |
| `/var/www/gem/app`               | Git checkout — the running code                                                     |
| `/var/www/gem/server/.env`       | **Env file. Lives OUTSIDE the git tree** so deploys never clobber it. Symlinked in. |
| `/var/www/gem/backups`           | Database dumps                                                                      |
| `/usr/local/bin/gem-deploy`      | Deploy script                                                                       |
| `/usr/local/bin/gem-db-backup`   | Backup script                                                                       |
| `/etc/nginx/sites-available/gem` | nginx config for both subdomains                                                    |

---

## 6. Environment variables

Live in `/var/www/gem/server/.env` (mode `600`, owned by `deploy`). **Not in git, and never should be.**

Set: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT`, `NODE_ENV`, `WEB_URL`, `ADMIN_URL`, `RESEND_API_KEY`, `FROM_EMAIL`, all six `R2_*` vars, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`.

**Deliberately dropped during migration** (verified unused by any code):

- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — the SDK is never imported
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` — the package isn't even installed

**Deliberately omitted:** `STRIPE_SECRET_KEY` — see §9.

---

## 7. SSL

Let's Encrypt via certbot, auto-renewing. Covers `api.` and `admin.`; the apex and `www` are Vercel's responsibility.

```bash
certbot certificates          # check expiry
certbot renew --dry-run       # test renewal
```

---

## 8. Security posture

- Firewall (`ufw`): only 22, 80, 443 open
- `fail2ban` active
- PostgreSQL bound to localhost — **not internet-reachable**
- App runs as `deploy`, never root
- `deploy` has narrow sudo: reload/restart nginx only
- Stack traces are gated to development mode

---

## 9. Known gaps

| Gap                               | Impact                                                                                                                                  |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Stripe not configured**         | Payment routes report "not configured". Intentional — the live key was left off during migration. Add it in Stripe **test mode** first. |
| **Backups not offsite**           | See §4. Up to 7 days at risk in a total-droplet-loss scenario.                                                                          |
| **`DIRECT_URL` = `DATABASE_URL`** | Fine for local Postgres, but means migrations run through the same connection.                                                          |
| **`render.yaml` obsolete**        | Should be deleted once Render is fully retired.                                                                                         |
| **`supabase/` folder inert**      | RLS policies and storage buckets that nothing uses. Safe to delete.                                                                     |
| **Admin upload false success**    | `AddVehiclePage.tsx` shows "success" even when image uploads fail. See [[BUGFIX_CHECKLIST]] NEW-1.                                      |
| **Wallet Pass unfinished**        | Code exists, no database migration. Routes will error if called.                                                                        |

---

## 10. If everything is broken

1. **Is the API up?** `curl https://api.gemrentalcars.com/health`
2. **Is the process running?** `pm2 list` — if not, `pm2 restart gem-api`
3. **Is the database up?** `systemctl status postgresql`
4. **Is nginx up?** `systemctl status nginx`
5. **Check logs:** `pm2 logs gem-api --lines 100`
6. **Disk full?** `df -h` — a full disk breaks Postgres in confusing ways
7. **Still broken?** Roll back to a known-good commit (§2)

**Emergency fallback:** Render and Supabase were still running as of 2026-07-27. If they haven't been deleted, pointing DNS back is a ~1 minute fix.
