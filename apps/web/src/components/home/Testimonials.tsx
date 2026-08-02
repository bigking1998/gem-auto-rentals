import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: 'Sarah Johnson',
    role: 'Business Traveler',
    image: null,
    rating: 5,
    quote:
      'Exceptional service from start to finish! The car was spotless and the pickup process was incredibly smooth. Will definitely use Gem Auto Rentals again.',
  },
  {
    id: 2,
    name: 'Michael Chen',
    role: 'Family Vacation',
    image: null,
    rating: 5,
    quote:
      'We rented an SUV for our family road trip and it was perfect. Great price, excellent condition, and the staff was super helpful with car seat installation.',
  },
  {
    id: 3,
    name: 'Emily Rodriguez',
    role: 'Weekend Getaway',
    image: null,
    rating: 5,
    quote:
      'Booked a convertible for a weekend trip to the coast. The online booking was easy and the car exceeded my expectations. Highly recommend!',
  },
  {
    id: 4,
    name: 'David Thompson',
    role: 'Corporate Client',
    image: null,
    rating: 5,
    quote:
      'Our company has been using Gem Auto Rentals for all our employee travel needs. Consistent quality, competitive rates, and reliable service.',
  },
];

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section className="bg-gray-50 py-20 lg:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center lg:mb-16"
        >
          <span className="bg-primary/10 text-primary-ink mb-4 inline-block rounded-full px-4 py-1.5 text-sm font-semibold">
            Testimonials
          </span>
          <h2 className="mb-4 text-3xl font-bold text-gray-900 lg:text-4xl">
            What Our Customers Say
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            Don&apos;t just take our word for it. Here&apos;s what our valued customers have to say
            about their experience.
          </p>
        </motion.div>

        {/* Testimonial Carousel */}
        <div className="mx-auto max-w-4xl">
          {/* overflow-hidden clips the slide's enter/exit translateX; without it
              the animating card widened the document by ~34px at 375px wide. */}
          <div className="relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="rounded-2xl border border-gray-100 bg-white p-8 shadow-lg lg:p-12"
              >
                {/* Quote Icon */}
                <div className="bg-accent mb-6 flex h-12 w-12 items-center justify-center rounded-full">
                  <Quote className="text-primary h-6 w-6" />
                </div>

                {/* Stars */}
                <div className="mb-6 flex items-center gap-1">
                  {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                    <Star key={i} className="text-primary h-5 w-5 fill-current" />
                  ))}
                </div>

                {/* Quote */}
                <blockquote className="mb-8 text-xl leading-relaxed text-gray-700 lg:text-2xl">
                  &ldquo;{testimonials[currentIndex].quote}&rdquo;
                </blockquote>

                {/* Author */}
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-900 text-lg font-bold text-white">
                    {testimonials[currentIndex].name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{testimonials[currentIndex].name}</p>
                    <p className="text-gray-500">{testimonials[currentIndex].role}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                onClick={prevTestimonial}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-100 bg-white shadow-md transition-colors hover:bg-gray-50"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="h-6 w-6 text-gray-600" />
              </button>

              {/* Dots */}
              <div className="flex items-center gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`h-2.5 w-2.5 rounded-full transition-all ${
                      index === currentIndex ? 'bg-primary w-8' : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={`Go to testimonial ${index + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={nextTestimonial}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-100 bg-white shadow-md transition-colors hover:bg-gray-50"
                aria-label="Next testimonial"
              >
                <ChevronRight className="h-6 w-6 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
