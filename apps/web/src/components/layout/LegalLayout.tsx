import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Mail, Phone } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import SEO from '@/components/SEO';
import {
  BUSINESS_NAME,
  CONTACT_EMAIL,
  PRIMARY_PHONE,
  PRIMARY_PHONE_HREF,
  ADDRESS,
} from '@/lib/contact';

interface LegalLayoutProps {
  /** Page title, e.g. "Terms of Service". */
  title: string;
  /** One-line summary shown under the title and used as the meta description. */
  description: string;
  /** Canonical path, e.g. "/terms". */
  path: string;
  /** Human-readable date this text was last touched. */
  lastUpdated: string;
  children: ReactNode;
}

/**
 * Shared shell for the legal pages (/terms, /privacy).
 *
 * These pages exist because signup and checkout both ask customers to agree to
 * "the Terms of Service and Privacy Policy" — those links used to 404, which is
 * not a defensible place to collect consent. The text below is honest,
 * plain-language placeholder content and says so in a banner at the top: it has
 * not been through legal review yet.
 */
export default function LegalLayout({
  title,
  description,
  path,
  lastUpdated,
  children,
}: LegalLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <SEO
        title={title}
        description={description}
        canonicalUrl={`https://gemrentalcars.com${path}`}
      />
      <Header />

      <main className="flex-1 bg-gray-50">
        {/* Hero */}
        <section className="bg-navy relative overflow-hidden py-20 text-white lg:py-24">
          <div
            className="absolute inset-0 z-0 bg-[radial-gradient(60%_70%_at_80%_10%,hsl(var(--primary)/0.22)_0%,transparent_65%)]"
            aria-hidden="true"
          />
          <div className="container relative z-10 mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-3xl font-bold lg:text-5xl"
            >
              {title}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="mt-4 text-lg text-gray-300"
            >
              {description}
            </motion.p>
            <p className="text-primary mt-6 text-sm font-medium">Last updated {lastUpdated}</p>
          </div>
        </section>

        {/* Body */}
        <section className="container mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          {/* Honesty banner — do not remove without an actual reviewed policy */}
          <div className="mb-10 flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-700" />
            <div className="text-sm text-amber-900">
              <p className="font-semibold">Plain-language draft — pending legal review</p>
              <p className="mt-1">
                This page describes, in ordinary English, how {BUSINESS_NAME} intends to operate. It
                has <strong>not</strong> been reviewed by a lawyer and is not a final agreement. If
                anything here matters to a decision you are about to make, please contact us and ask
                — we will answer directly and in writing.
              </p>
            </div>
          </div>

          <div className="space-y-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:p-10">
            {children}
          </div>

          {/* Contact block */}
          <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-6 lg:p-8">
            <h2 className="text-primary-ink text-lg font-bold">Questions about this page?</h2>
            <p className="mt-2 text-gray-600">
              Talk to a person. We would rather answer a question than have you guess.
            </p>
            <div className="mt-4 space-y-3 text-gray-700">
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="hover:text-primary-ink flex items-center gap-3 transition-colors"
              >
                <Mail className="text-primary-ink h-5 w-5" />
                {CONTACT_EMAIL}
              </a>
              <a
                href={PRIMARY_PHONE_HREF}
                className="hover:text-primary-ink flex items-center gap-3 transition-colors"
              >
                <Phone className="text-primary-ink h-5 w-5" />
                {PRIMARY_PHONE}
              </a>
              <p className="text-sm text-gray-500">
                {BUSINESS_NAME}, {ADDRESS}
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

/** A titled section inside a legal page. */
export function LegalSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-xl font-bold text-gray-900">{heading}</h2>
      <div className="space-y-3 leading-relaxed text-gray-600">{children}</div>
    </section>
  );
}
