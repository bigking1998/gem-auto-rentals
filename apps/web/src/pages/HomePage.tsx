import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/home/HeroSection';
import TrustBadges from '@/components/home/TrustBadges';
import FeaturedVehicles from '@/components/home/FeaturedVehicles';
import HowItWorks from '@/components/home/HowItWorks';
import WhyChooseUs from '@/components/home/WhyChooseUs';
import Statistics from '@/components/home/Statistics';
import Testimonials from '@/components/home/Testimonials';
import FAQ from '@/components/home/FAQ';
import CTASection from '@/components/home/CTASection';
import SEO from '@/components/SEO';
import { OrganizationSchema, FAQSchema, GEM_AUTO_RENTALS_ORG } from '@/components/StructuredData';

const homepageFAQs = [
  { question: 'What documents do I need to rent a car?', answer: "You'll need a valid driver's license, a credit or debit card in your name, and proof of insurance (or you can purchase our coverage). International visitors may need an International Driving Permit along with their home country license." },
  { question: 'What is the minimum age to rent a car?', answer: 'The minimum age to rent a car is 21 years old. Drivers under 25 may be subject to a young driver surcharge. Some vehicle categories (luxury, sports cars) require drivers to be at least 25.' },
  { question: 'Can I modify or cancel my reservation?', answer: 'Yes! You can modify or cancel your reservation up to 24 hours before pickup at no charge. Cancellations made within 24 hours may incur a fee. Log into your account or contact us to make changes.' },
  { question: 'Is insurance included in the rental price?', answer: 'Basic liability insurance is included with every rental. We also offer additional coverage options including Collision Damage Waiver (CDW), Personal Accident Insurance (PAI), and roadside assistance packages.' },
  { question: 'What fuel policy do you use?', answer: "We use a full-to-full fuel policy. You'll receive the car with a full tank and should return it full. If you return the car with less fuel, we'll charge for the missing fuel plus a refueling service fee." },
  { question: 'Can I add an additional driver?', answer: 'Yes, additional drivers can be added to your rental agreement for a small daily fee. All additional drivers must meet the same requirements as the primary driver and present valid documentation.' },
  { question: 'What happens if I return the car late?', answer: "We offer a 29-minute grace period. After that, you'll be charged for an additional hour. Returns more than 2 hours late may incur a full extra day's charge. Please contact us if you anticipate being late." },
  { question: 'Do you offer one-way rentals?', answer: 'Yes, we offer one-way rentals between select locations. One-way fees vary based on pickup and drop-off locations. Check availability and pricing when making your reservation.' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="Premium Car Rentals"
        description="Gem Auto Rentals offers premium car rental services with a wide selection of vehicles from economy to luxury. Affordable rates, flexible booking, and exceptional service in Mulberry, Florida."
        keywords="car rental, vehicle rental, rent a car, luxury car rental, economy car rental, SUV rental, van rental, Mulberry FL, Florida car rental"
      />
      <OrganizationSchema data={GEM_AUTO_RENTALS_ORG} />
      <FAQSchema faqs={homepageFAQs} />
      <Header />
      <main className="flex-1">
        <HeroSection />
        <TrustBadges />
        <FeaturedVehicles />
        <HowItWorks />
        <WhyChooseUs />
        <Statistics />
        <Testimonials />
        <FAQ />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
