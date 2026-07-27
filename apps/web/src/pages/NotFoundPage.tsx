import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Car, ArrowRight, Compass } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import SEO from '@/components/SEO';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SEO
        title="Page Not Found"
        description="The page you were looking for does not exist. Head back to the Gem Auto Rentals home page or browse our available vehicles."
        noIndex
      />
      <Header />
      <main className="flex flex-1 items-center bg-gray-50">
        <section className="w-full py-20 lg:py-28">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mx-auto max-w-2xl text-center"
            >
              <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-orange-100">
                <Compass className="text-primary h-10 w-10" />
              </div>

              <p className="text-primary mb-4 text-6xl font-bold lg:text-8xl">404</p>
              <h1 className="mb-4 text-3xl font-bold text-gray-900 lg:text-4xl">
                This Page Took a Wrong Turn
              </h1>
              <p className="mb-10 text-lg leading-relaxed text-gray-600">
                We could not find the page you were looking for. It may have been moved, renamed, or
                it never existed. Let us get you back on the road.
              </p>

              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  to="/"
                  className="bg-primary inline-flex w-full items-center justify-center rounded-lg px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:bg-orange-600 hover:shadow-xl sm:w-auto"
                >
                  <Home className="mr-2 h-5 w-5" />
                  Back to Home
                </Link>

                <Link
                  to="/vehicles"
                  className="hover:border-primary hover:text-primary group inline-flex w-full items-center justify-center rounded-lg border-2 border-gray-200 bg-white px-8 py-4 text-lg font-semibold text-gray-900 transition-all sm:w-auto"
                >
                  <Car className="mr-2 h-5 w-5" />
                  Browse Vehicles
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>

              <p className="mt-10 text-sm text-gray-500">
                Still stuck?{' '}
                <Link to="/contact" className="text-primary font-medium hover:underline">
                  Contact us
                </Link>{' '}
                and we will point you in the right direction.
              </p>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
