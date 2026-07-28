import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, MapPin, Phone, Mail, Send } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import SEO from '@/components/SEO';

const CONTACT_EMAIL = 'gemautosalesinc@gmail.com';
const PRIMARY_PHONE = '863-277-7879';
const SECONDARY_PHONE = '863-279-2907';
const ADDRESS = '1311 E CANAL ST, MULBERRY, FL 33860';

const openingHours = [
  { day: 'Monday', hours: '10:00 AM – 6:00 PM' },
  { day: 'Tuesday', hours: '10:00 AM – 12:30 PM' },
  { day: 'Wednesday', hours: '10:00 AM – 6:00 PM' },
  { day: 'Thursday', hours: '10:00 AM – 6:00 PM' },
  { day: 'Friday', hours: '10:00 AM – 6:00 PM' },
  { day: 'Saturday', hours: '11:00 AM – 3:00 PM' },
  { day: 'Sunday', hours: 'Closed', closed: true },
];

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  // NOTE: There is no public (unauthenticated) message-submission endpoint on the
  // API, so this form intentionally hands off to the visitor's own email client
  // instead of pretending to submit. See the mailto: link built below.
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const mailSubject = subject.trim() || 'Website enquiry';
    const bodyLines = [
      message.trim(),
      '',
      '—',
      name.trim() ? `Name: ${name.trim()}` : '',
      email.trim() ? `Email: ${email.trim()}` : '',
    ].filter(Boolean);
    const href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
      mailSubject
    )}&body=${encodeURIComponent(bodyLines.join('\n'))}`;
    window.location.href = href;
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SEO
        title="Contact Us"
        description="Get in touch with Gem Auto Rentals in Mulberry, Florida. Call, email, or visit us for rental enquiries, reservations, and support."
        keywords="contact gem auto rentals, car rental Mulberry Florida, rental car phone number, gem auto rentals address"
        canonicalUrl="https://gemrentalcars.com/contact"
      />
      <Header />
      <main className="flex-1 bg-gray-50">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gray-950 py-20 text-white lg:py-28">
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-gray-900 to-black" />
          <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl"
            >
              <h1 className="mb-6 text-4xl font-bold lg:text-6xl">Contact Us</h1>
              <p className="text-xl leading-relaxed text-gray-300">
                Questions about a rental, a reservation, or a vehicle in our fleet? Our team in
                Mulberry, Florida is happy to help.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Content Grid */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
              {/* Contact Details */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="space-y-6"
              >
                <div>
                  <span className="text-primary-ink bg-accent mb-4 inline-block rounded-full px-4 py-1.5 text-sm font-semibold">
                    Get in Touch
                  </span>
                  <h2 className="mb-4 text-3xl font-bold text-gray-900 lg:text-4xl">
                    We Are Here to Help
                  </h2>
                  <p className="leading-relaxed text-gray-600">
                    Reach us by phone or email during business hours, or stop by the lot in person.
                    We typically respond to email during the same business day we receive it.
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-accent flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                        <Phone className="text-primary-ink h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Call Us</p>
                        <p className="text-gray-600">
                          <a
                            href={`tel:${PRIMARY_PHONE}`}
                            className="hover:text-primary-ink transition-colors"
                          >
                            {PRIMARY_PHONE}
                          </a>
                          <span className="mx-2 text-gray-300">/</span>
                          <a
                            href={`tel:${SECONDARY_PHONE}`}
                            className="hover:text-primary-ink transition-colors"
                          >
                            {SECONDARY_PHONE}
                          </a>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="bg-accent flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                        <Mail className="text-primary-ink h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Email Us</p>
                        <a
                          href={`mailto:${CONTACT_EMAIL}`}
                          className="hover:text-primary-ink break-all text-gray-600 transition-colors"
                        >
                          {CONTACT_EMAIL}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="bg-accent flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                        <MapPin className="text-primary-ink h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Visit Us</p>
                        <p className="text-gray-600">{ADDRESS}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Operating Hours */}
                <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
                  <h3 className="mb-6 flex items-center text-xl font-bold text-gray-900">
                    <Clock className="text-primary-ink mr-3 h-6 w-6" />
                    Operating Hours
                  </h3>
                  <div className="space-y-4">
                    {openingHours.map((entry) => (
                      <div
                        key={entry.day}
                        className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-b-0 last:pb-0"
                      >
                        <span className="font-medium text-gray-600">{entry.day}</span>
                        <span
                          className={
                            entry.closed
                              ? 'font-semibold text-red-500'
                              : 'font-semibold text-gray-900'
                          }
                        >
                          {entry.hours}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Message Form (mailto hand-off) */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
                  <h3 className="mb-2 text-xl font-bold text-gray-900">Send Us a Message</h3>
                  <p className="mb-6 text-sm text-gray-500">
                    Fill this in and we will open a pre-filled email in your own mail app addressed
                    to{' '}
                    <a
                      href={`mailto:${CONTACT_EMAIL}`}
                      className="text-primary-ink break-all font-medium hover:underline"
                    >
                      {CONTACT_EMAIL}
                    </a>
                    . Nothing is sent until you press send in your mail app.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label
                        htmlFor="contact-name"
                        className="mb-2 block text-sm font-medium text-gray-700"
                      >
                        Your Name
                      </label>
                      <input
                        id="contact-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Jane Doe"
                        className="focus:ring-primary w-full rounded-lg border border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="contact-email"
                        className="mb-2 block text-sm font-medium text-gray-700"
                      >
                        Your Email
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="focus:ring-primary w-full rounded-lg border border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="contact-subject"
                        className="mb-2 block text-sm font-medium text-gray-700"
                      >
                        Subject
                      </label>
                      <input
                        id="contact-subject"
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Rental enquiry"
                        className="focus:ring-primary w-full rounded-lg border border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="contact-message"
                        className="mb-2 block text-sm font-medium text-gray-700"
                      >
                        Message
                      </label>
                      <textarea
                        id="contact-message"
                        rows={6}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Tell us what you need and the dates you have in mind."
                        className="focus:ring-primary w-full resize-y rounded-lg border border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2"
                      />
                    </div>

                    <button
                      type="submit"
                      className="bg-primary text-primary-foreground hover:bg-primary-dark group inline-flex w-full items-center justify-center rounded-lg px-8 py-4 text-lg font-semibold shadow-lg transition-all hover:shadow-xl"
                    >
                      <Send className="mr-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                      Open in My Email App
                    </button>
                  </form>

                  <p className="mt-6 text-sm text-gray-500">
                    Prefer to talk it through? Call{' '}
                    <a
                      href={`tel:${PRIMARY_PHONE}`}
                      className="text-primary-ink font-medium hover:underline"
                    >
                      {PRIMARY_PHONE}
                    </a>{' '}
                    during the hours listed here.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
