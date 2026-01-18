import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gemautorentals.com' },
    update: {},
    create: {
      email: 'admin@gemautorentals.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      emailVerified: true,
    },
  });
  console.log('Created admin user:', admin.email);

  // Create test customer
  const customerPassword = await bcrypt.hash('customer123', 12);
  const customer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      password: customerPassword,
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1 (555) 123-4567',
      role: 'CUSTOMER',
      emailVerified: true,
    },
  });
  console.log('Created customer:', customer.email);

  // Create sample vehicles
  const vehicles = [
    {
      make: 'Toyota',
      model: 'Camry',
      year: 2024,
      category: 'STANDARD' as const,
      dailyRate: 65,
      status: 'AVAILABLE' as const,
      seats: 5,
      doors: 4,
      transmission: 'AUTOMATIC' as const,
      fuelType: 'GASOLINE' as const,
      mileage: 5000,
      color: 'Silver',
      licensePlate: 'ABC-1234',
      vin: '1HGBH41JXMN109186',
      location: 'Main Office',
      features: ['Bluetooth', 'Backup Camera', 'Apple CarPlay', 'Cruise Control'],
      images: ['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800'],
      description: 'Reliable and comfortable mid-size sedan, perfect for business trips or family outings.',
    },
    {
      make: 'Honda',
      model: 'CR-V',
      year: 2024,
      category: 'SUV' as const,
      dailyRate: 85,
      status: 'AVAILABLE' as const,
      seats: 5,
      doors: 4,
      transmission: 'AUTOMATIC' as const,
      fuelType: 'HYBRID' as const,
      mileage: 3000,
      color: 'Blue',
      licensePlate: 'DEF-5678',
      vin: '2HGBH41JXMN109187',
      location: 'Main Office',
      features: ['AWD', 'Sunroof', 'Heated Seats', 'Navigation', 'Lane Assist'],
      images: ['https://images.unsplash.com/photo-1568844293986-ca9c5c1f1f34?w=800'],
      description: 'Spacious hybrid SUV with excellent fuel economy and modern safety features.',
    },
    {
      make: 'BMW',
      model: '3 Series',
      year: 2024,
      category: 'PREMIUM' as const,
      dailyRate: 120,
      status: 'AVAILABLE' as const,
      seats: 5,
      doors: 4,
      transmission: 'AUTOMATIC' as const,
      fuelType: 'GASOLINE' as const,
      mileage: 2500,
      color: 'Black',
      licensePlate: 'GHI-9012',
      vin: '3HGBH41JXMN109188',
      location: 'Airport',
      features: ['Leather Seats', 'Premium Sound', 'Parking Sensors', 'Sport Mode'],
      images: ['https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800'],
      description: 'Luxury sports sedan offering a perfect blend of performance and comfort.',
    },
    {
      make: 'Tesla',
      model: 'Model 3',
      year: 2024,
      category: 'PREMIUM' as const,
      dailyRate: 130,
      status: 'AVAILABLE' as const,
      seats: 5,
      doors: 4,
      transmission: 'AUTOMATIC' as const,
      fuelType: 'ELECTRIC' as const,
      mileage: 4000,
      color: 'White',
      licensePlate: 'JKL-3456',
      vin: '4HGBH41JXMN109189',
      location: 'Main Office',
      features: ['Autopilot', 'Full Self-Driving', 'Premium Interior', 'Supercharging'],
      images: ['https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800'],
      description: 'All-electric sedan with cutting-edge technology and impressive range.',
    },
    {
      make: 'Ford',
      model: 'Mustang',
      year: 2024,
      category: 'LUXURY' as const,
      dailyRate: 150,
      status: 'AVAILABLE' as const,
      seats: 4,
      doors: 2,
      transmission: 'AUTOMATIC' as const,
      fuelType: 'GASOLINE' as const,
      mileage: 1500,
      color: 'Red',
      licensePlate: 'MNO-7890',
      vin: '5HGBH41JXMN109190',
      location: 'Airport',
      features: ['V8 Engine', 'Sport Exhaust', 'Track Mode', 'Premium Audio'],
      images: ['https://images.unsplash.com/photo-1584345604476-8ec5f82bd3c2?w=800'],
      description: 'Iconic American muscle car for those who want to make a statement.',
    },
    {
      make: 'Nissan',
      model: 'Versa',
      year: 2024,
      category: 'ECONOMY' as const,
      dailyRate: 45,
      status: 'AVAILABLE' as const,
      seats: 5,
      doors: 4,
      transmission: 'AUTOMATIC' as const,
      fuelType: 'GASOLINE' as const,
      mileage: 8000,
      color: 'Gray',
      licensePlate: 'PQR-1234',
      vin: '6HGBH41JXMN109191',
      location: 'Main Office',
      features: ['Fuel Efficient', 'Apple CarPlay', 'Android Auto'],
      images: ['https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800'],
      description: 'Affordable and fuel-efficient compact car, perfect for city driving.',
    },
    {
      make: 'Chevrolet',
      model: 'Suburban',
      year: 2024,
      category: 'VAN' as const,
      dailyRate: 140,
      status: 'AVAILABLE' as const,
      seats: 8,
      doors: 4,
      transmission: 'AUTOMATIC' as const,
      fuelType: 'GASOLINE' as const,
      mileage: 6000,
      color: 'White',
      licensePlate: 'STU-5678',
      vin: '7HGBH41JXMN109192',
      location: 'Main Office',
      features: ['Third Row', 'Towing Package', 'Entertainment System', 'Captain Chairs'],
      images: ['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800'],
      description: 'Full-size SUV with seating for 8, ideal for large families or groups.',
    },
    {
      make: 'Mercedes-Benz',
      model: 'S-Class',
      year: 2024,
      category: 'LUXURY' as const,
      dailyRate: 250,
      status: 'AVAILABLE' as const,
      seats: 5,
      doors: 4,
      transmission: 'AUTOMATIC' as const,
      fuelType: 'GASOLINE' as const,
      mileage: 1000,
      color: 'Black',
      licensePlate: 'VWX-9012',
      vin: '8HGBH41JXMN109193',
      location: 'Airport',
      features: ['Massage Seats', 'Ambient Lighting', 'Night Vision', 'Burmester Sound'],
      images: ['https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800'],
      description: 'The pinnacle of luxury sedans, featuring the finest materials and technology.',
    },
  ];

  for (const vehicleData of vehicles) {
    const vehicle = await prisma.vehicle.upsert({
      where: { licensePlate: vehicleData.licensePlate },
      update: {},
      create: vehicleData,
    });
    console.log(`Created vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model}`);
  }

  // Create sample booking
  const vehicle = await prisma.vehicle.findFirst({
    where: { make: 'Toyota' },
  });

  if (vehicle) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 7);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 3);

    const booking = await prisma.booking.upsert({
      where: { id: 'sample-booking-1' },
      update: {},
      create: {
        id: 'sample-booking-1',
        userId: customer.id,
        vehicleId: vehicle.id,
        startDate,
        endDate,
        status: 'CONFIRMED',
        dailyRate: vehicle.dailyRate,
        totalAmount: Number(vehicle.dailyRate) * 3,
        pickupLocation: 'Main Office',
        dropoffLocation: 'Main Office',
        extras: { insurance: true, gps: false },
      },
    });
    console.log('Created sample booking:', booking.id);
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
