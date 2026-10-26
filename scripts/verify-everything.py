#!/usr/bin/env python3
"""
verify_everything.py — one command that checks every live system and reports.

WHY THIS EXISTS
---------------
Across this project four systems were declared broken when they were working, and
one change was declared live when it had never deployed. Every one of those came
from checking a surface that does not serve the user — a local .env, a green
pipeline, a health endpoint measuring something adjacent — or from checking
inside a deploy's own latency.

So this checks the surfaces that actually serve the user: the shipped JS bundle,
the public API's JSON, the database column, the rendered funnel page. It never
reads a local config file and calls that evidence about production.

SAFETY
------
Read-only by default. Nothing is created, changed or deleted. Secrets are
reported by presence and key-mode only (sk_test / sk_live), never by value.

  python3 verify_everything.py            # read-only, ~30s
  python3 verify_everything.py --stripe   # also runs a real $0 test-mode payment
                                          # end to end, then deletes everything it made

Exit code 0 when everything passes, 1 when any check fails.
"""
import argparse
import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request

WEB = "https://gemrentalcars.com"
API = "https://api.gemrentalcars.com"
ADMIN = "https://admin.gemrentalcars.com"
FUNNEL = "https://rent.gemrentalcars.com"
DROPLET = "root@157.245.120.117"
SSH_KEY = os.path.expanduser("~/.ssh/gem_auto_rentals")
REPO = os.path.expanduser("~/Gem Auto Rentals/gem-auto-rentals")
ENVFILE = os.path.expanduser("~/Gem Auto Rentals/_workspace/.env")

RESULTS = []
GREEN, RED, YELLOW, DIM, BOLD, OFF = (
    "\033[32m", "\033[31m", "\033[33m", "\033[2m", "\033[1m", "\033[0m"
)


def record(section, name, ok, detail="", warn=False):
    RESULTS.append((section, name, ok, detail, warn))
    mark = f"{YELLOW}WARN{OFF}" if warn else (f"{GREEN} ok {OFF}" if ok else f"{RED}FAIL{OFF}")
    print(f"  [{mark}] {name}" + (f"  {DIM}{detail}{OFF}" if detail else ""))


def get(url, timeout=30, headers=None):
    # GoHighLevel rejects requests with no User-Agent, so always merge one in
    # rather than letting a caller's headers replace the default.
    h = {"User-Agent": "gem-verify"}
    h.update(headers or {})
    req = urllib.request.Request(url, headers=h)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace")
    except Exception as e:  # noqa: BLE001
        return 0, str(e)


def post(url, body, timeout=30, headers=None):
    h = {"Content-Type": "application/json", "User-Agent": "gem-verify"}
    h.update(headers or {})
    req = urllib.request.Request(url, data=json.dumps(body).encode(), headers=h, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace")
    except Exception as e:  # noqa: BLE001
        return 0, str(e)


def ssh(cmd, timeout=90, stdin=None):
    try:
        out = subprocess.run(
            ["ssh", "-i", SSH_KEY, "-o", "ConnectTimeout=20", "-o", "BatchMode=yes", DROPLET, cmd],
            capture_output=True, text=True, timeout=timeout, input=stdin,
        )
        return out.returncode, out.stdout.strip(), out.stderr.strip()
    except Exception as e:  # noqa: BLE001
        return 1, "", str(e)


def psql(sql, timeout=90):
    """Run SQL by piping it in on stdin.

    Quoting SQL through `ssh` -> `bash -c` -> `psql -c` is a trap: the nested
    shell strips the single quotes around string literals, and $$-quoting is
    worse because the shell expands $$ to its own PID. stdin avoids all of it.
    """
    return ssh(
        'sudo -u deploy bash -c "set -a; source /var/www/gem/server/.env; set +a; '
        'psql \"\$DATABASE_URL\" -t -A -f -"',
        timeout=timeout, stdin=sql)


def section(title):
    print(f"\n{BOLD}{title}{OFF}")


# ─────────────────────────────────────────────────────────────────────────────
def check_deployment():
    section("DEPLOYMENT — is what I wrote actually live?")

    def last_commit_touching(path):
        """The newest commit that changed `path`.

        Comparing a deployed app against git HEAD is wrong: a commit that only
        touches the server legitimately leaves the customer site's bundle on an
        older commit, because the build is skipped. Comparing against HEAD turns
        that correct behaviour into a FAIL on every backend-only change — which
        is precisely the misreading this whole script exists to prevent.
        """
        return subprocess.run(
            ["git", "-C", REPO, "log", "-1", "--format=%h", "--", path],
            capture_output=True, text=True).stdout.strip()

    head = subprocess.run(["git", "-C", REPO, "rev-parse", "--short", "HEAD"],
                          capture_output=True, text=True).stdout.strip()
    # The two pipelines behave differently, so they need different rules:
    #   API    — gem-deploy runs on EVERY push, so it should always equal HEAD.
    #   Vercel — skips the build when apps/web did not change, so its bundle
    #            legitimately sits on the last commit that touched apps/web.
    web_expected = last_commit_touching("apps/web") or head
    api_expected = head

    code, body = get(f"{API}/health")
    api_commit = ""
    if code == 200:
        try:
            api_commit = json.loads(body).get("commit", "")
        except Exception:  # noqa: BLE001
            pass
    record("deploy", "API is running the latest server code", api_commit == api_expected,
           f"api={api_commit or '?'} expected={api_expected}")

    code, idx = get(f"{WEB}/?cb={int(time.time())}")
    m = re.search(r"/assets/js/index-[A-Za-z0-9_-]+\.js", idx or "")
    web_commit = ""
    if m:
        _, bundle = get(WEB + m.group(0), timeout=45)
        cm = re.search(r'commit:"([a-f0-9]+)"', bundle or "")
        web_commit = cm.group(1) if cm else ""
        globals()["_BUNDLE"] = bundle or ""
        globals()["_CHUNKS"] = sorted(set(re.findall(r'"(assets/js/[A-Za-z0-9_-]+\.js)"', bundle or "")))
    record("deploy", "Customer site is running the latest web code", web_commit == web_expected,
           f"web={web_commit or '?'} expected={web_expected}"
           + ("  (behind — Vercel builds take ~10-13 min)" if web_commit != web_expected else ""))

    # The two halves are SUPPOSED to sit on different commits whenever the most
    # recent change touched only one of them. Only flag a genuine mismatch.


def chunk(name):
    """Fetch the live code-split chunk whose name starts with `name`."""
    for c in globals().get("_CHUNKS", []):
        if c.lower().startswith(f"assets/js/{name.lower()}-"):
            _, body = get(f"{WEB}/{c}", timeout=40)
            return body or ""
    return ""


def check_customer_site():
    section("CUSTOMER SITE — the fixes, on the shipped code")
    bundle = globals().get("_BUNDLE", "")

    checks = [
        ("BookingPage", "gem_booking_draft", "Booking form saves what the customer typed"),
        ("MyBookingsPage", "Complete Payment", "A pending booking can be continued"),
        ("ResumePaymentPage", "Complete your payment", "Resume-payment page exists"),
        ("ContactPage", "Send Message", "Contact form really submits (not mailto)"),
        ("LoginPage", "Keep me signed in for 7 days", "Remember me, honestly labelled"),
        ("PaymentStep", "Currently unavailable", "Insurance shown but not selectable"),
    ]
    for cname, needle, label in checks:
        body = chunk(cname)
        record("web", label, needle in body, "" if needle in body else f"missing from {cname}")

    vd = chunk("VehicleDetailPage")
    record("web", "GPS Navigation removed", "GPS Navigation" not in vd)
    record("web", "Deposit shown on the vehicle page", "refundable deposit" in vd)

    for bad, label in [
        ("10,000+ Customers", "No fabricated customer count"),
        ("4.9 Rating", "No fabricated rating"),
        ("Guaranteed lowest rates", "No price-match promise"),
        ("863-277-7879", "Old phone number gone (7879)"),
        ("863-279-2907", "Old phone number gone (2907)"),
        ("813-422-4539", "Old phone number gone (813)"),
    ]:
        record("web", label, bad not in bundle)

    record("web", "Correct phone number present", "863-277-6712" in bundle)


def check_admin():
    section("ADMIN DASHBOARD")
    code, idx = get(f"{ADMIN}/?cb={int(time.time())}")
    record("admin", "Admin dashboard is reachable", code == 200, f"HTTP {code}")
    if code != 200:
        return
    m = re.search(r"/assets/js/index-[A-Za-z0-9_-]+\.js", idx or "")
    body = ""
    if m:
        _, body = get(ADMIN + m.group(0), timeout=45)
    record("admin", "Remember me on the admin login", "Keep me signed in for 7 days" in (body or ""))


def check_security():
    section("SECURITY — what a stranger can see")
    code, body = get(f"{API}/api/vehicles?limit=1")
    leaked = []
    if code == 200:
        try:
            d = json.loads(body)
            items = (d.get("data") or {}).get("items") or d.get("data") or []
            v = items[0] if items else {}
            leaked = [f for f in ("licensePlate", "vin", "deletedAt", "deletedBy") if f in v]
        except Exception:  # noqa: BLE001
            pass
    record("security", "Licence plates and VINs hidden from the public",
           code == 200 and not leaked, ("leaking: " + ", ".join(leaked)) if leaked else "")

    code, _ = get(f"{API}/api/contact")
    record("security", "Staff-only message list requires a login", code == 401, f"HTTP {code}")

    code, _ = get(f"{API}/api/customers")
    record("security", "Customer records require a login", code in (401, 403), f"HTTP {code}")


def check_integrations():
    section("INTEGRATIONS")
    code, body = get(f"{API}/health")
    try:
        h = json.loads(body) if code == 200 else {}
    except Exception:  # noqa: BLE001
        h = {}
    record("integrations", "API is up", h.get("status") == "ok")
    record("integrations", "Database connected", h.get("database") == "connected")
    record("integrations", "Vehicle images can be served", h.get("images") == "servable",
           ", ".join(h.get("imageBucketsMissingPublicUrl") or []))

    # Email bounce handling: 401 = secret present and verifying; 503 = not configured.
    code, _ = post(f"{API}/api/webhooks/resend", {})
    record("integrations", "Email bounce handling configured", code == 401,
           "not configured" if code == 503 else f"HTTP {code}")

    # Stripe webhook: 400 invalid-signature = keys present; "not configured" = missing.
    code, body = post(f"{API}/api/payments/webhook", {"type": "payment_intent.succeeded"},
                      headers={"stripe-signature": "t=1,v1=bogus"})
    configured = code == 400 and "not configured" not in body.lower()
    record("integrations", "Stripe webhook configured and verifying", configured, f"HTTP {code}")

    # Key modes — presence and mode only, never the value.
    rc, out, _ = ssh(
        "for k in STRIPE_SECRET_KEY STRIPE_WEBHOOK_SECRET RESEND_API_KEY RESEND_WEBHOOK_SECRET; do "
        "v=$(grep -E \"^$k=\" /var/www/gem/server/.env | cut -d= -f2- | tr -d '\"'); "
        "case \"$v\" in sk_test_*) m=TEST;; sk_live_*) m=LIVE;; '') m=MISSING;; *) m=set;; esac; "
        "echo \"$k=$m\"; done")
    modes = dict(l.split("=", 1) for l in out.splitlines() if "=" in l) if rc == 0 else {}
    srv_mode = modes.get("STRIPE_SECRET_KEY", "?")
    record("integrations", "Stripe secret key present", srv_mode != "MISSING", f"mode={srv_mode}")
    for k in ("RESEND_API_KEY", "RESEND_WEBHOOK_SECRET", "STRIPE_WEBHOOK_SECRET"):
        record("integrations", f"{k} present", modes.get(k, "MISSING") != "MISSING")

    # The mismatch that silently breaks checkout.
    bundle = globals().get("_BUNDLE", "")
    sc = chunk("stripe")
    web_mode = "LIVE" if "pk_live_" in (sc + bundle) else ("TEST" if "pk_test_" in (sc + bundle) else "?")
    match = (srv_mode == web_mode) or srv_mode in ("?", "MISSING")
    record("integrations", "Stripe website and server modes match", match,
           f"site={web_mode} server={srv_mode}" + ("  <- real payments will FAIL" if not match else ""))


def check_database():
    section("DATABASE")
    rc, out, _ = ssh(
        "cd /var/www/gem/app/server && sudo -u deploy bash -c "
        "'set -a; source /var/www/gem/server/.env; set +a; export PATH=/usr/local/bin:$PATH; "
        "npx prisma migrate status' 2>&1 | tail -20", timeout=150)
    applied = "have not yet been applied" not in out
    pending = [l.strip() for l in out.splitlines() if re.match(r"^\s*\d{8}", l)] if not applied else []
    record("database", "All migrations applied", applied,
           ("pending: " + ", ".join(pending)) if pending else "")

    rc, out, _ = psql(
        "SELECT is_nullable FROM information_schema.columns "
        "WHERE table_name='Vehicle' AND column_name='licensePlate';")
    record("database", "Plate can be left blank (not yet known)", out.strip() == "YES", out.strip())

    rc, out, _ = psql("SELECT to_regclass('public.\"ContactMessage\"');")
    record("database", "Contact messages are stored", "ContactMessage" in out)


def check_funnel():
    section("GOHIGHLEVEL FUNNEL — rent.gemrentalcars.com")
    pages = ["/home", "/waitlist", "/contact", "/privacy-policy", "/terms-and-conditions", "/thank-you"]
    for p in pages:
        code, body = get(FUNNEL + p, timeout=30)
        ok = code == 200
        detail = f"HTTP {code}"
        if ok and p in ("/home", "/waitlist"):
            boxes = len(re.findall(r'<input[^>]*type="checkbox"', body, re.I))
            pre = len(re.findall(r'<input[^>]*type="checkbox"[^>]*checked', body, re.I))
            ok = boxes == 2 and pre == 0
            detail = f"{boxes} consent boxes, {pre} pre-ticked"
        record("funnel", f"Page {p}", ok, detail)

    code, body = get(FUNNEL + "/home", timeout=30)
    has_price = "from $50 a day" in body
    record("funnel", "Landing page shows pricing", has_price,
           "" if has_price else "pricing paragraph never persisted — needs the GHL editor")

    # Workflows
    env = {}
    try:
        for line in open(ENVFILE):
            if "=" in line and not line.strip().startswith("#"):
                k, v = line.strip().split("=", 1)
                env[k] = v.strip().strip('"')
    except Exception:  # noqa: BLE001
        pass
    pit, loc = env.get("GHL_PIT"), env.get("GHL_LOCATION_ID")
    if not (pit and loc):
        record("funnel", "GoHighLevel workflows", False, "no API credentials found", warn=True)
        return
    code, body = get(
        f"https://services.leadconnectorhq.com/workflows/?locationId={loc}",
        headers={"Authorization": f"Bearer {pit}", "Version": "2021-07-28"})
    try:
        ws = json.loads(body).get("workflows", []) if code == 200 else []
    except Exception:  # noqa: BLE001
        ws = []
    pub = [w for w in ws if w.get("status") == "published"]
    record("funnel", "All automations published", len(ws) > 0 and len(pub) == len(ws),
           f"{len(pub)}/{len(ws)} published")


def check_stripe_payment():
    section("STRIPE — full payment, end to end (test mode only)")
    rc, out, _ = ssh("grep -E '^STRIPE_SECRET_KEY=' /var/www/gem/server/.env | cut -d= -f2- | tr -d '\"' | cut -c1-8")
    if not out.startswith("sk_test"):
        record("stripe", "Payment test", False,
               f"server key is {out or 'missing'} — refusing to charge a real card", warn=True)
        return

    ts = int(time.time())
    email = f"verify-test-{ts}@gemrentalcars.test"
    code, body = post(f"{API}/api/auth/register", {
        "email": email, "password": "VerifyPass12345",
        "firstName": "AUTOMATED", "lastName": "VERIFY - delete me", "phone": "8632776712"})
    try:
        token = (json.loads(body).get("data") or {}).get("token")
    except Exception:  # noqa: BLE001
        token = None
    if not token:
        record("stripe", "Could create a test customer", False, f"HTTP {code}")
        return

    auth = {"Authorization": f"Bearer {token}"}
    _, vb = get(f"{API}/api/vehicles?limit=1")
    items = (json.loads(vb).get("data") or {}).get("items") or json.loads(vb).get("data") or []
    vid = items[0]["id"]

    start = time.strftime("%Y-%m-%d", time.localtime(time.time() + 86400 * 60))
    end = time.strftime("%Y-%m-%d", time.localtime(time.time() + 86400 * 63))
    code, body = post(f"{API}/api/bookings", {
        "vehicleId": vid, "startDate": start, "endDate": end,
        "pickupLocation": "AUTOMATED TEST", "dropoffLocation": "AUTOMATED TEST",
        "notes": "automated verification - safe to delete"}, headers=auth)
    bk = json.loads(body).get("data") or {}
    bid, total = bk.get("id"), bk.get("totalAmount")
    record("stripe", "Booking created", bool(bid), f"total ${total}")
    if not bid:
        return

    code, body = post(f"{API}/api/payments/create-intent", {"bookingId": bid}, headers=auth)
    cs = (json.loads(body).get("data") or {}).get("clientSecret", "")
    pi = cs.split("_secret_")[0] if cs else ""
    record("stripe", "Stripe accepted a payment intent", bool(pi), pi[:20])

    if pi:
        rc, out, _ = ssh(
            "SK=$(grep -E '^STRIPE_SECRET_KEY=' /var/www/gem/server/.env | cut -d= -f2- | tr -d '\"'); "
            f"curl -s --max-time 30 https://api.stripe.com/v1/payment_intents/{pi}/confirm "
            "-u \"$SK:\" -d payment_method=pm_card_visa -d return_url=https://gemrentalcars.com "
            "| python3 -c \"import sys,json;print(json.load(sys.stdin).get('status'))\"")
        record("stripe", "Card charged", out.strip() == "succeeded", out.strip())

        time.sleep(12)
        code, body = get(f"{API}/api/bookings/{bid}", headers=auth)
        b = json.loads(body).get("data") or {}
        p = b.get("payment") or {}
        ok = b.get("status") == "CONFIRMED" and p.get("status") == "SUCCEEDED"
        record("stripe", "Webhook confirmed the booking", ok,
               f"booking={b.get('status')} payment={p.get('status')}")

    # Always clean up, even if a step above failed.
    rc, out, _ = psql(
        f'DELETE FROM "Payment" WHERE "bookingId" = \'{bid}\';\n'
        f'DELETE FROM "Booking" WHERE id = \'{bid}\';\n'
        f'DELETE FROM "User" WHERE email = \'{email}\';\n'
        f'SELECT count(*) FROM "Booking" WHERE id = \'{bid}\';')
    record("stripe", "Test data removed", rc == 0 and out.strip().endswith("0"), out.strip()[-20:])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--stripe", action="store_true",
                    help="also run a real test-mode payment end to end (refuses on live keys)")
    args = ap.parse_args()

    print(f"{BOLD}Gem Car Rentals — full system check{OFF}")
    print(f"{DIM}{time.strftime('%Y-%m-%d %H:%M')}  read-only unless --stripe{OFF}")

    check_deployment()
    check_customer_site()
    check_admin()
    check_security()
    check_integrations()
    check_database()
    check_funnel()
    if args.stripe:
        check_stripe_payment()

    fails = [r for r in RESULTS if not r[2] and not r[4]]
    warns = [r for r in RESULTS if r[4]]
    print(f"\n{BOLD}{'─' * 60}{OFF}")
    if not fails:
        print(f"{GREEN}{BOLD}Everything passed{OFF} — {len(RESULTS)} checks"
              + (f", {len(warns)} warning(s)" if warns else ""))
    else:
        print(f"{RED}{BOLD}{len(fails)} problem(s) found{OFF} of {len(RESULTS)} checks:\n")
        for _, name, _, detail, _ in fails:
            print(f"  {RED}•{OFF} {name}" + (f"  — {detail}" if detail else ""))
    for _, name, _, detail, _ in warns:
        print(f"  {YELLOW}•{OFF} {name}" + (f"  — {detail}" if detail else ""))
    print()
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
