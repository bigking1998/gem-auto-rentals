import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Users,
  Fuel,
  Gauge,
  Star,
  Check,
  Calendar,
  MapPin,
  Shield,
  Navigation,
  Baby,
  UserPlus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { cn } from '@/lib/utils';

// Mock vehicle data
const mockVehicle = {
  id: '1',
  make: 'Toyota',
  model: 'Camry',
  year: 2024,
  category: 'STANDARD',
  dailyRate: 65,
  status: 'AVAILABLE',
  seats: 5,
  doors: 4,
  transmission: 'AUTOMATIC',
  fuelType: 'GASOLINE',
  mileage: 5000,
  color: 'Silver',
  description:
    'The 2024 Toyota Camry is a reliable and comfortable mid-size sedan, perfect for business trips or family outings. With excellent fuel economy and a spacious interior, it offers the perfect balance of comfort and efficiency.',
  features: [
    'Bluetooth',
    'Backup Camera',
    'Apple CarPlay',
    'Android Auto',
    'Cruise Control',
    'Keyless Entry',
    'USB Ports',
    'Climate Control',
  ],
  images: [
    'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=1200',
    'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=1200',
    'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1200',
    'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1200',
  ],
  location: 'Main Office - Downtown',
  averageRating: 4.8,
  reviewCount: 124,
  reviews: [
    {
      id: '1',
      user: { firstName: 'John', lastName: 'D.' },
      rating: 5,
      comment: 'Excellent car! Very clean and drove perfectly. Would definitely rent again.',
      createdAt: '2024-01-10',
    },
    {
      id: '2',
      user: { firstName: 'Sarah', lastName: 'M.' },
      rating: 4,
      comment: 'Great vehicle for the price. Comfortable for long drives.',
      createdAt: '2024-01-05',
    },
    {
      id: '3',
      user: { firstName: 'Michael', lastName: 'R.' },
      rating: 5,
      comment: 'Perfect condition, smooth pickup and dropoff process.',
      createdAt: '2023-12-28',
    },
  ],
};

const extras = [
  { id: 'insurance', name: 'Full Insurance', price: 25, icon: Shield, description: 'Complete coverage for peace of mind' },
  { id: 'gps', name: 'GPS Navigation', price: 10, icon: Navigation, description: 'Never get lost on your journey' },
  { id: 'childSeat', name: 'Child Seat', price: 8, icon: Baby, description: 'Safety-certified child seat' },
  { id: 'additionalDriver', name: 'Additional Driver', price: 15, icon: UserPlus, description: 'Add another driver to your rental' },
];

export default function VehicleDetailPage() {
  const { id } = useParams();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const vehicle = mockVehicle; // Would fetch from API using id

  const toggleExtra = (extraId: string) => {
    setSelectedExtras((prev) =>
      prev.includes(extraId) ? prev.filter((e) => e !== extraId) : [...prev, extraId]
    );
  };

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const days = calculateDays();
  const basePrice = vehicle.dailyRate * days;
  const extrasPrice = selectedExtras.reduce((sum, extraId) => {
    const extra = extras.find((e) => e.id === extraId);
    return sum + (extra ? extra.price * days : 0);
  }, 0);
  const totalPrice = basePrice + extrasPrice;

  const nextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % vehicle.images.length);
  };

  const prevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + vehicle.images.length) % vehicle.images.length);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link
              to="/vehicles"
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to all vehicles
            </Link>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Left Column - Images */}
            <div>
              {/* Main Image */}
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 mb-4">
                <motion.img
                  key={activeImageIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  src={vehicle.images[activeImageIndex]}
                  alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                  className="w-full h-full object-cover"
                />

                {/* Navigation Arrows */}
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Image Counter */}
                <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/60 text-white text-sm rounded-full">
                  {activeImageIndex + 1} / {vehicle.images.length}
                </div>
              </div>

              {/* Thumbnail Grid */}
              <div className="grid grid-cols-4 gap-3">
                {vehicle.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImageIndex(index)}
                    className={cn(
                      'aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all',
                      index === activeImageIndex
                        ? 'border-indigo-600 ring-2 ring-indigo-600/20'
                        : 'border-transparent hover:border-gray-300'
                    )}
                  >
                    <img
                      src={image}
                      alt={`View ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column - Details */}
            <div>
              {/* Category Badge */}
              <span className="inline-block px-3 py-1 text-sm font-semibold text-indigo-600 bg-indigo-50 rounded-full mb-4">
                {vehicle.category}
              </span>

              {/* Title */}
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-6">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'w-5 h-5',
                        i < Math.floor(vehicle.averageRating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-200 fill-gray-200'
                      )}
                    />
                  ))}
                </div>
                <span className="font-semibold">{vehicle.averageRating}</span>
                <span className="text-gray-500">({vehicle.reviewCount} reviews)</span>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-4xl font-bold text-gray-900">${vehicle.dailyRate}</span>
                <span className="text-gray-500">/day</span>
              </div>

              {/* Description */}
              <p className="text-gray-600 mb-6 leading-relaxed">{vehicle.description}</p>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl mb-6">
                <div className="text-center">
                  <Users className="w-6 h-6 mx-auto text-gray-400 mb-1" />
                  <p className="font-semibold text-gray-900">{vehicle.seats}</p>
                  <p className="text-sm text-gray-500">Seats</p>
                </div>
                <div className="text-center">
                  <Gauge className="w-6 h-6 mx-auto text-gray-400 mb-1" />
                  <p className="font-semibold text-gray-900">{vehicle.transmission === 'AUTOMATIC' ? 'Auto' : 'Manual'}</p>
                  <p className="text-sm text-gray-500">Transmission</p>
                </div>
                <div className="text-center">
                  <Fuel className="w-6 h-6 mx-auto text-gray-400 mb-1" />
                  <p className="font-semibold text-gray-900 capitalize">{vehicle.fuelType.toLowerCase()}</p>
                  <p className="text-sm text-gray-500">Fuel Type</p>
                </div>
                <div className="text-center">
                  <MapPin className="w-6 h-6 mx-auto text-gray-400 mb-1" />
                  <p className="font-semibold text-gray-900">{vehicle.doors}</p>
                  <p className="text-sm text-gray-500">Doors</p>
                </div>
              </div>

              {/* Features */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Features</h3>
                <div className="grid grid-cols-2 gap-2">
                  {vehicle.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center gap-2 text-gray-600 mb-8">
                <MapPin className="w-5 h-5" />
                <span>Pickup Location: {vehicle.location}</span>
              </div>

              {/* Booking Card */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h3 className="font-semibold text-lg text-gray-900 mb-4">Book This Vehicle</h3>

                {/* Date Selection */}
                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Pick-up Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Return Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate || new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Extras */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Optional Extras
                  </label>
                  <div className="space-y-2">
                    {extras.map((extra) => (
                      <label
                        key={extra.id}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                          selectedExtras.includes(extra.id)
                            ? 'border-indigo-600 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={selectedExtras.includes(extra.id)}
                          onChange={() => toggleExtra(extra.id)}
                          className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <extra.icon className="w-5 h-5 text-gray-500" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{extra.name}</p>
                          <p className="text-xs text-gray-500">{extra.description}</p>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          +${extra.price}/day
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Breakdown */}
                {days > 0 && (
                  <div className="border-t border-gray-200 pt-4 mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">
                        ${vehicle.dailyRate} x {days} days
                      </span>
                      <span className="font-medium">${basePrice}</span>
                    </div>
                    {extrasPrice > 0 && (
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Extras</span>
                        <span className="font-medium">${extrasPrice}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2 mt-2">
                      <span>Total</span>
                      <span>${totalPrice}</span>
                    </div>
                  </div>
                )}

                <Link
                  to={days > 0 ? `/booking/${vehicle.id}?start=${startDate}&end=${endDate}&extras=${selectedExtras.join(',')}` : '#'}
                  className={cn(
                    'block w-full py-3 text-center font-semibold rounded-xl transition-all',
                    days > 0
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  )}
                  onClick={(e) => !days && e.preventDefault()}
                >
                  {days > 0 ? 'Book Now' : 'Select Dates to Book'}
                </Link>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="mt-12 pt-12 border-t border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicle.reviews.map((review) => (
                <div key={review.id} className="bg-white p-6 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {review.user.firstName[0]}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {review.user.firstName} {review.user.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{review.createdAt}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          'w-4 h-4',
                          i < review.rating
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-200 fill-gray-200'
                        )}
                      />
                    ))}
                  </div>

                  <p className="text-gray-600">{review.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
