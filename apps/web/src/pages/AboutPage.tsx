import { motion } from 'framer-motion';
import { Clock, MapPin, Phone, Mail, Car } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import SEO from '@/components/SEO';

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SEO
        title="About Us"
        description="Learn about Gem Auto Rentals - your trusted car rental partner in Mulberry, Florida. Quality vehicles, exceptional service, and competitive rates since day one."
        keywords="about gem auto rentals, car rental company, Mulberry Florida, vehicle rental service"
        canonicalUrl="https://gemrentalcars.com/about"
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
              <h1 className="mb-6 text-4xl font-bold lg:text-6xl">About Gem Auto Rentals</h1>
              <p className="text-xl leading-relaxed text-gray-300">
                &ldquo;We will make a positive difference in the lives of our customers from the
                United States, Caribbean, West Indies, and beyond.&rdquo;
              </p>
            </motion.div>
          </div>
        </section>

        {/* Content Grid */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
              {/* Introduction */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <span className="text-primary mb-4 inline-block rounded-full bg-orange-100 px-4 py-1.5 text-sm font-semibold">
                  Our Story
                </span>
                <h2 className="mb-6 text-3xl font-bold text-gray-900 lg:text-4xl">
                  Driving Excellence for Every Customer
                </h2>
                <div className="prose prose-lg text-gray-600">
                  <p className="mb-6">
                    Gem Auto Sales / Gem Auto Repair is dedicated to providing high-quality vehicles
                    and exceptional service. Our mission extends beyond just selling cars; we aim to
                    create lasting relationships and make a positive impact in our community and
                    beyond.
                  </p>
                  <p>
                    Whether you are local to Mulberry, FL, or visiting from abroad, our team is
                    committed to finding the perfect vehicle to meet your needs. We pride ourselves
                    on transparency, integrity, and putting our customers first.
                  </p>
                </div>

                <div className="mt-8 flex items-center gap-4">
                  <div className="flex -space-x-4">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-gray-200"
                      >
                        <Car className="h-5 w-5 text-gray-500" />
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Trusted by thousands</p>
                    <p className="text-sm text-gray-500">Join our satisfied customers</p>
                  </div>
                </div>
              </motion.div>

              {/* Info Cards */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="space-y-6"
              >
                {/* Operating Hours */}
                <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
                  <h3 className="mb-6 flex items-center text-xl font-bold text-gray-900">
                    <Clock className="text-primary mr-3 h-6 w-6" />
                    Operating Hours
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                      <span className="font-medium text-gray-600">Monday</span>
                      <span className="font-semibold text-gray-900">10:00 AM – 6:00 PM</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                      <span className="font-medium text-gray-600">Tuesday</span>
                      <span className="font-semibold text-gray-900">10:00 AM – 12:30 PM</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                      <span className="font-medium text-gray-600">Wednesday</span>
                      <span className="font-semibold text-gray-900">10:00 AM – 6:00 PM</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                      <span className="font-medium text-gray-600">Thursday</span>
                      <span className="font-semibold text-gray-900">10:00 AM – 6:00 PM</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                      <span className="font-medium text-gray-600">Friday</span>
                      <span className="font-semibold text-gray-900">10:00 AM – 6:00 PM</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                      <span className="font-medium text-gray-600">Saturday</span>
                      <span className="font-semibold text-gray-900">11:00 AM – 3:00 PM</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-600">Sunday</span>
                      <span className="font-semibold text-red-500">Closed</span>
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
                  <h3 className="mb-6 text-xl font-bold text-gray-900">Get in Touch</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-orange-50">
                        <MapPin className="text-primary h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Visit Us</p>
                        <p className="text-gray-600">1311 E CANAL ST, MULBERRY, FL 33860</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-orange-50">
                        <Phone className="text-primary h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Call Us</p>
                        <p className="text-gray-600">863-277-7879 / 863-279-2907</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-orange-50">
                        <Mail className="text-primary h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Email Us</p>
                        <p className="text-gray-600">gemautosalesinc@gmail.com</p>
                      </div>
                    </div>
                  </div>
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
