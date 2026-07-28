import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const faqs = [
  {
    question: 'What documents do I need to rent a car?',
    answer:
      "You'll need a valid driver's license, a credit or debit card in your name, and proof of insurance (or you can purchase our coverage). International visitors may need an International Driving Permit along with their home country license.",
  },
  {
    question: 'What is the minimum age to rent a car?',
    answer:
      'The minimum age to rent a car is 21 years old. Drivers under 25 may be subject to a young driver surcharge. Some vehicle categories (luxury, sports cars) require drivers to be at least 25.',
  },
  {
    question: 'Can I modify or cancel my reservation?',
    answer:
      'Yes! You can modify or cancel your reservation up to 24 hours before pickup at no charge. Cancellations made within 24 hours may incur a fee. Log into your account or contact us to make changes.',
  },
  {
    question: 'Is insurance included in the rental price?',
    answer:
      'Basic liability insurance is included with every rental. We also offer additional coverage options including Collision Damage Waiver (CDW), Personal Accident Insurance (PAI), and roadside assistance packages.',
  },
  {
    question: 'What fuel policy do you use?',
    answer:
      "We use a full-to-full fuel policy. You'll receive the car with a full tank and should return it full. If you return the car with less fuel, we'll charge for the missing fuel plus a refueling service fee.",
  },
  {
    question: 'Can I add an additional driver?',
    answer:
      'Yes, additional drivers can be added to your rental agreement for a small daily fee. All additional drivers must meet the same requirements as the primary driver and present valid documentation.',
  },
  {
    question: 'What happens if I return the car late?',
    answer:
      "We offer a 29-minute grace period. After that, you'll be charged for an additional hour. Returns more than 2 hours late may incur a full extra day's charge. Please contact us if you anticipate being late.",
  },
  {
    question: 'Do you offer one-way rentals?',
    answer:
      'Yes, we offer one-way rentals between select locations. One-way fees vary based on pickup and drop-off locations. Check availability and pricing when making your reservation.',
  },
];

function FAQItem({
  question,
  answer,
  isOpen,
  onClick,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        onClick={onClick}
        className="group flex w-full items-center justify-between py-5 text-left focus:outline-none"
      >
        <span
          className={cn(
            'text-lg font-medium transition-colors',
            isOpen ? 'text-primary' : 'group-hover:text-primary text-gray-900'
          )}
        >
          {question}
        </span>
        <ChevronDown
          className={cn(
            'h-5 w-5 text-gray-500 transition-transform duration-200',
            isOpen && 'text-primary rotate-180'
          )}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="pb-5 leading-relaxed text-gray-600">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-white py-20 lg:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center"
          >
            <span className="bg-primary/10 text-primary mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold">
              <HelpCircle className="h-4 w-4" />
              FAQ
            </span>
            <h2 className="mb-4 text-3xl font-bold text-gray-900 lg:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600">
              Find answers to common questions about our rental services.
            </p>
          </motion.div>

          {/* FAQ List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white px-6"
          >
            {faqs.map((faq, index) => (
              <FAQItem
                key={index}
                question={faq.question}
                answer={faq.answer}
                isOpen={openIndex === index}
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              />
            ))}
          </motion.div>

          {/* Contact CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-10 text-center"
          >
            <p className="mb-4 text-gray-600">Still have questions?</p>
            <a
              href="/contact"
              className="text-primary-ink hover:text-primary-dark inline-flex items-center font-medium"
            >
              Contact our support team
              <ChevronDown className="ml-1 h-4 w-4 rotate-[-90deg]" />
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
