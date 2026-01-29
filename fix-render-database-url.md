# Fix Render Database Connection

## Problem
Your Render server is using the wrong port for Supabase's transaction pooler.

## Root Cause
- Supabase Transaction Pooler uses port **6543**
- Your current DATABASE_URL uses port **5432** (which is for direct connections)
- This causes "Tenant or user not found" error

## Solution

### Step 1: Update DATABASE_URL on Render

1. Go to [Render Dashboard](https://dashboard.render.com/web/srv-d5nf92t6ubrc73aqum9g)
2. Click on "Environment" tab
3. Find `DATABASE_URL` and update it to:

```
postgresql://postgres:Kinggodfrey.1998@aws-1-us-east-2.pooler.supabase.com:6543/postgres
```

**Note:** Change port from `5432` to `6543`

### Step 2: Verify DIRECT_URL (should remain unchanged)

Make sure `DIRECT_URL` is still:
```
postgresql://postgres:Kinggodfrey.1998@db.szvnxiozrxmsudtcsddx.supabase.co:5432/postgres
```

### Step 3: Redeploy

After updating the environment variable, Render will automatically redeploy your service.

## Alternative: Use Direct Connection Only

If the pooler continues to have issues, you can use the direct connection for both:

```bash
DATABASE_URL=postgresql://postgres:Kinggodfrey.1998@db.szvnxiozrxmsudtcsddx.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:Kinggodfrey.1998@db.szvnxiozrxmsudtcsddx.supabase.co:5432/postgres
```

**Note:** Direct connection is limited to 60 concurrent connections on Supabase free tier.

## Verification

Once redeployed, test your endpoints:
- Login: https://gem-auto-rentals-server.onrender.com/api/auth/login
- Vehicles: https://gem-auto-rentals-server.onrender.com/api/vehicles

Both should work without 500 errors.
