import { motion } from 'framer-motion';
import { Clock, MapPin, Phone, Mail, Car } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function AboutPage() {
    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1 bg-gray-50">
                {/* Hero Section */}
                <section className="bg-gray-950 text-white py-20 lg:py-28 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black z-0" />
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="max-w-3xl"
                        >
                            <h1 className="text-4xl lg:text-6xl font-bold mb-6">About Gem Auto Sales</h1>
                            <p className="text-xl text-gray-300 leading-relaxed">
                                "We will make a positive difference in the lives of our customers from the United States, Caribbean, West Indies, and beyond."
                            </p>
                        </motion.div>
                    </div>
                </section>

                {/* Content Grid */}
                <section className="py-16 lg:py-24">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
                            {/* Introduction */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6 }}
                            >
                                <span className="inline-block px-4 py-1.5 bg-orange-100 text-primary rounded-full text-sm font-semibold mb-4">
                                    Our Story
                                </span>
                                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                                    Driving Excellence for Every Customer
                                </h2>
                                <div className="prose prose-lg text-gray-600">
                                    <p className="mb-6">
                                        Gem Auto Sales / Gem Auto Repair is dedicated to providing high-quality vehicles and exceptional service.
                                        Our mission extends beyond just selling cars; we aim to create lasting relationships and make a
                                        positive impact in our community and beyond.
                                    </p>
                                    <p>
                                        Whether you are local to Mulberry, FL, or visiting from abroad, our team is committed to finding the
                                        perfect vehicle to meet your needs. We pride ourselves on transparency, integrity, and putting our customers first.
                                    </p>
                                </div>

                                <div className="mt-8 flex items-center gap-4">
                                    <div className="flex -space-x-4">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="w-12 h-12 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center">
                                                <Car className="w-5 h-5 text-gray-500" />
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
                                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                                    <h3 className="flex items-center text-xl font-bold text-gray-900 mb-6">
                                        <Clock className="w-6 h-6 text-primary mr-3" />
                                        Operating Hours
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                                            <span className="font-medium text-gray-600">Monday</span>
                                            <span className="font-semibold text-gray-900">10:00 AM – 6:00 PM</span>
                                        </div>
                                        <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                                            <span className="font-medium text-gray-600">Tuesday</span>
                                            <span className="font-semibold text-gray-900">10:00 AM – 12:30 PM</span>
                                        </div>
                                        <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                                            <span className="font-medium text-gray-600">Wednesday</span>
                                            <span className="font-semibold text-gray-900">10:00 AM – 6:00 PM</span>
                                        </div>
                                        <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                                            <span className="font-medium text-gray-600">Thursday</span>
                                            <span className="font-semibold text-gray-900">10:00 AM – 6:00 PM</span>
                                        </div>
                                        <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                                            <span className="font-medium text-gray-600">Friday</span>
                                            <span className="font-semibold text-gray-900">10:00 AM – 6:00 PM</span>
                                        </div>
                                        <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                                            <span className="font-medium text-gray-600">Saturday</span>
                                            <span className="font-semibold text-gray-900">11:00 AM – 3:00 PM</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium text-gray-600">Sunday</span>
                                            <span className="font-semibold text-red-500">Closed</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Contact Info */}
                                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                                    <h3 className="text-xl font-bold text-gray-900 mb-6">Get in Touch</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                                                <MapPin className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">Visit Us</p>
                                                <p className="text-gray-600">1311 E CANAL ST, MULBERRY, FL 33860</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                                                <Phone className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">Call Us</p>
                                                <p className="text-gray-600">863-277-7879 / 863-279-2907</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                                                <Mail className="w-5 h-5 text-primary" />
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
