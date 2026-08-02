import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Mail, Phone, MapPin, ArrowRight } from 'lucide-react';
import { CONTACT_EMAIL, PRIMARY_PHONE, PRIMARY_PHONE_HREF, ADDRESS } from '@/lib/contact';

/**
 * Documents.
 *
 * This page previously rendered three hard-coded `mockDocuments` — a
 * "Verified" driver's licence, a "Pending" passport and an expired insurance
 * card, complete with invented upload and expiry dates — to every customer,
 * alongside View / Re-upload / Delete buttons that were wired to nothing (the
 * state was destructured without a setter, so no action could change anything).
 *
 * There is no documents API on the backend yet, so rather than keep showing
 * people someone else's fictional records, the page now says plainly what the
 * situation is and how to actually get a licence to us. Replace this with the
 * real list + upload flow once the endpoints exist.
 */
export default function DocumentsPage() {
  return (
    <div className="mx-auto max-w-4xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
        <p className="mt-1 text-gray-500">
          Identification and insurance documents for your rentals
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-xl border border-gray-200 bg-white p-8 text-center"
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <FileText className="h-8 w-8 text-gray-400" />
        </div>
        <h2 className="mb-2 text-lg font-semibold text-gray-900">
          Online document upload isn&apos;t available yet
        </h2>
        <p className="mx-auto mb-6 max-w-lg text-gray-500">
          We&apos;re still building this. Nothing is stored here right now, and we haven&apos;t
          received any documents from you through the website.
        </p>

        <div className="mx-auto max-w-lg rounded-xl border border-gray-100 bg-gray-50 p-5 text-left">
          <p className="mb-3 text-sm font-semibold text-gray-900">
            To rent a vehicle, get your driver&apos;s licence to us one of these ways:
          </p>
          <ul className="space-y-3 text-sm text-gray-600">
            <li className="flex items-start gap-3">
              <MapPin className="text-primary-ink mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>
                Bring it with you at pickup — {ADDRESS}. This is the fastest option and always
                works.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Mail className="text-primary-ink mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>
                Email a clear photo to{' '}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-primary-ink font-medium hover:underline"
                >
                  {CONTACT_EMAIL}
                </a>
                .
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Phone className="text-primary-ink mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>
                Call{' '}
                <a
                  href={PRIMARY_PHONE_HREF}
                  className="text-primary-ink font-medium hover:underline"
                >
                  {PRIMARY_PHONE}
                </a>{' '}
                and we&apos;ll sort it out with you.
              </span>
            </li>
          </ul>
        </div>

        <Link
          to="/dashboard/bookings"
          className="text-primary-ink mt-6 inline-flex items-center gap-1 text-sm font-medium hover:underline"
        >
          Back to my bookings
          <ArrowRight className="h-4 w-4" />
        </Link>
      </motion.div>
    </div>
  );
}
