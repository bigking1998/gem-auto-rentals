import { Helmet } from 'react-helmet-async';

interface OrganizationData {
  name: string;
  url: string;
  logo: string;
  description: string;
  telephone: string;
  email: string;
  address: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  sameAs?: string[];
}

interface VehicleData {
  name: string;
  description: string;
  image: string;
  url: string;
  brand: string;
  model: string;
  vehicleModelDate: number;
  offers: {
    price: number;
    priceCurrency: string;
  };
  vehicleSeatingCapacity: number;
  fuelType: string;
  vehicleTransmission: string;
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

// Organization/LocalBusiness Schema
export function OrganizationSchema({ data }: { data: OrganizationData }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'LocalBusiness', 'AutoRental'],
    name: data.name,
    url: data.url,
    logo: data.logo,
    description: data.description,
    telephone: data.telephone,
    email: data.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: data.address.streetAddress,
      addressLocality: data.address.addressLocality,
      addressRegion: data.address.addressRegion,
      postalCode: data.address.postalCode,
      addressCountry: data.address.addressCountry,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 27.8953,
      longitude: -81.9756,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '08:00',
        closes: '18:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Saturday',
        opens: '09:00',
        closes: '17:00',
      },
    ],
    priceRange: '$$',
    sameAs: data.sameAs || [],
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

// Vehicle/Product Schema
export function VehicleSchema({ data }: { data: VehicleData }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: data.name,
    description: data.description,
    image: data.image,
    url: data.url,
    brand: {
      '@type': 'Brand',
      name: data.brand,
    },
    model: data.model,
    vehicleModelDate: data.vehicleModelDate,
    offers: {
      '@type': 'Offer',
      price: data.offers.price,
      priceCurrency: data.offers.priceCurrency,
      availability: 'https://schema.org/InStock',
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: 'Seating Capacity',
        value: data.vehicleSeatingCapacity,
      },
      {
        '@type': 'PropertyValue',
        name: 'Fuel Type',
        value: data.fuelType,
      },
      {
        '@type': 'PropertyValue',
        name: 'Transmission',
        value: data.vehicleTransmission,
      },
    ],
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

// Breadcrumb Schema
export function BreadcrumbSchema({ items }: { items: BreadcrumbItem[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

// FAQ Schema
export function FAQSchema({ faqs }: { faqs: Array<{ question: string; answer: string }> }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

// Default organization data for Gem Auto Rentals
export const GEM_AUTO_RENTALS_ORG: OrganizationData = {
  name: 'Gem Auto Rentals',
  url: 'https://gemrentalcars.com',
  logo: 'https://gemrentalcars.com/logo.png',
  description: 'Premium car rental service offering a wide range of vehicles from economy to luxury. Affordable rates, flexible booking, and exceptional service in Mulberry, Florida.',
  telephone: '863-277-7879',
  email: 'gemautosalesinc@gmail.com',
  address: {
    streetAddress: '1311 E CANAL ST',
    addressLocality: 'MULBERRY',
    addressRegion: 'FL',
    postalCode: '33860',
    addressCountry: 'US',
  },
  sameAs: [
    'https://facebook.com/gemautorentals',
    'https://instagram.com/gemautorentals',
  ],
};
