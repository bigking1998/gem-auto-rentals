-- Store messages sent from the public "Contact us" form.
--
-- Previously the form built a `mailto:` link and handed off to the visitor's own
-- email client. Nothing was persisted, nothing was sent unless the visitor
-- pressed send themselves, and a visitor with no configured mail client saw
-- nothing happen. On a site about to carry paid advertising that is a hole
-- straight through the middle of the funnel.
CREATE TABLE IF NOT EXISTS "ContactMessage" (
    "id"        TEXT NOT NULL,
    "name"      TEXT NOT NULL,
    "email"     TEXT NOT NULL,
    "subject"   TEXT,
    "message"   TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "handled"   BOOLEAN NOT NULL DEFAULT false,
    "handledAt" TIMESTAMP(3),
    "notes"     TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ContactMessage_handled_idx"   ON "ContactMessage"("handled");
CREATE INDEX IF NOT EXISTS "ContactMessage_createdAt_idx" ON "ContactMessage"("createdAt");
