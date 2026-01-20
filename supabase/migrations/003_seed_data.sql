-- =============================================
-- SEED SAMPLE VEHICLES
-- =============================================
INSERT INTO public.vehicles (make, model, year, category, daily_rate, status, images, features, seats, transmission, fuel_type, mileage, color, license_plate, vin, location) VALUES
('Toyota', 'Camry', 2024, 'STANDARD', 65.00, 'AVAILABLE',
  ARRAY['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800'],
  ARRAY['Bluetooth', 'Backup Camera', 'Apple CarPlay', 'Lane Assist'],
  5, 'AUTOMATIC', 'GASOLINE', 12500, 'Silver', 'GEM-1001', '1HGBH41JXMN109186', 'Los Angeles'),

('Honda', 'Civic', 2024, 'ECONOMY', 55.00, 'AVAILABLE',
  ARRAY['https://images.unsplash.com/photo-1606611013016-969c19ba27bb?w=800'],
  ARRAY['Bluetooth', 'Fuel Efficient', 'USB Ports'],
  5, 'AUTOMATIC', 'GASOLINE', 8200, 'Blue', 'GEM-1002', '2HGFC2F59MH123456', 'Los Angeles'),

('BMW', '3 Series', 2024, 'PREMIUM', 120.00, 'AVAILABLE',
  ARRAY['https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800'],
  ARRAY['Leather Seats', 'Navigation', 'Sunroof', 'Premium Sound'],
  5, 'AUTOMATIC', 'GASOLINE', 5800, 'Black', 'GEM-1003', '3MW5R1J04M8B12345', 'Beverly Hills'),

('Mercedes-Benz', 'E-Class', 2024, 'LUXURY', 175.00, 'AVAILABLE',
  ARRAY['https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800'],
  ARRAY['Massage Seats', 'Ambient Lighting', 'Burmester Sound', 'Driver Assist'],
  5, 'AUTOMATIC', 'GASOLINE', 3200, 'White', 'GEM-1004', 'W1KZF8DB4MA123456', 'Beverly Hills'),

('Ford', 'Explorer', 2024, 'SUV', 95.00, 'AVAILABLE',
  ARRAY['https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800'],
  ARRAY['Third Row Seating', '4WD', 'Towing Package', 'Roof Rails'],
  7, 'AUTOMATIC', 'GASOLINE', 15600, 'Red', 'GEM-1005', '1FM5K8GC2MGA12345', 'Santa Monica'),

('Tesla', 'Model 3', 2024, 'PREMIUM', 110.00, 'AVAILABLE',
  ARRAY['https://images.unsplash.com/photo-1536700503339-1e4b06520771?w=800'],
  ARRAY['Autopilot', 'Premium Interior', 'Glass Roof', 'Supercharging'],
  5, 'AUTOMATIC', 'ELECTRIC', 9800, 'Red', 'GEM-1006', '5YJ3E1EA5MF123456', 'Hollywood'),

('Chevrolet', 'Suburban', 2024, 'VAN', 135.00, 'AVAILABLE',
  ARRAY['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800'],
  ARRAY['8 Passenger', 'Entertainment System', 'Cargo Space', 'Wi-Fi'],
  8, 'AUTOMATIC', 'GASOLINE', 22000, 'Black', 'GEM-1007', '1GNSKJKC4MR123456', 'LAX Airport'),

('Porsche', '911', 2024, 'LUXURY', 350.00, 'AVAILABLE',
  ARRAY['https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800'],
  ARRAY['Sport Chrono', 'PASM', 'Sport Exhaust', 'Carbon Fiber'],
  2, 'AUTOMATIC', 'GASOLINE', 2100, 'Yellow', 'GEM-1008', 'WP0AB2A94MS123456', 'Beverly Hills'),

('Toyota', 'RAV4', 2024, 'SUV', 85.00, 'AVAILABLE',
  ARRAY['https://images.unsplash.com/photo-1568844293986-8c8a0e4d3b29?w=800'],
  ARRAY['AWD', 'Safety Sense', 'Apple CarPlay', 'Android Auto'],
  5, 'AUTOMATIC', 'HYBRID', 11200, 'Gray', 'GEM-1009', '2T3W1RFV5MW123456', 'Pasadena'),

('Nissan', 'Altima', 2024, 'STANDARD', 60.00, 'AVAILABLE',
  ARRAY['https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800'],
  ARRAY['ProPILOT Assist', 'Bluetooth', 'Remote Start'],
  5, 'AUTOMATIC', 'GASOLINE', 14300, 'White', 'GEM-1010', '1N4BL4BV5MN123456', 'Los Angeles'),

('Audi', 'A4', 2024, 'PREMIUM', 115.00, 'AVAILABLE',
  ARRAY['https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800'],
  ARRAY['Quattro AWD', 'Virtual Cockpit', 'Bang & Olufsen Sound'],
  5, 'AUTOMATIC', 'GASOLINE', 7600, 'Blue', 'GEM-1011', 'WAUENAF47MN123456', 'Santa Monica'),

('Jeep', 'Wrangler', 2024, 'SUV', 105.00, 'AVAILABLE',
  ARRAY['https://images.unsplash.com/photo-1519245659620-e859806a8d3b?w=800'],
  ARRAY['4x4', 'Removable Top', 'Off-Road Package', 'Trail Rated'],
  5, 'AUTOMATIC', 'GASOLINE', 18500, 'Green', 'GEM-1012', '1C4HJXDG5MW123456', 'Malibu')

ON CONFLICT (license_plate) DO NOTHING;
