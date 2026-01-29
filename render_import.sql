--
-- PostgreSQL database dump
--



-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.7 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: -
--

SET SESSION AUTHORIZATION DEFAULT;

ALTER TABLE public."User" DISABLE TRIGGER ALL;

COPY public."User" (id, email, password, "firstName", "lastName", phone, role, "emailVerified", "avatarUrl", "createdAt", "updatedAt", "resetToken", "resetTokenExpiry", "deletedAt", "deletedBy", "stripeCustomerId") FROM stdin;
cmklsalp50000gag53kn3ujga	admin@gemautorentals.com	$2a$12$0tb6jHMT0JBHWFq96tTtbuE7ENp5vUSZmnGZf0x0.qD4Br9YqTgym	Admin	User	\N	ADMIN	t	\N	2026-01-19 23:16:10.456	2026-01-19 23:16:10.456	\N	\N	\N	\N	\N
cmklsam9o0001gag59fwvpn4p	customer@example.com	$2a$12$6T07.G.PiNhj/8T4Nt3eN.AVWga6DuukraYZO2PKRnhGQHOD3KJvO	John	Doe	+1 (555) 123-4567	CUSTOMER	t	\N	2026-01-19 23:16:11.196	2026-01-19 23:16:11.196	\N	\N	\N	\N	\N
cmklunnfw000010lk4c1b5qsu	testuser@example.com	$2a$12$IHrDTnKe6XZvsMeFo32xF.SV/ZlBJupUWEHvhEJ1X1WrbVB.Lf39m	Test	User	1234567890	CUSTOMER	f	\N	2026-01-20 00:22:18.476	2026-01-20 00:22:18.476	\N	\N	\N	\N	\N
cmklvbu860000dr9oytbs9wh2	doctest@test.com	$2a$12$T9IlB.fgFucQ4dpnQ.g1Kuf8tpqm8/5R1MTdhcfAos2fKqjlBJCBe	Doc	Test	\N	CUSTOMER	f	\N	2026-01-20 00:41:07.014	2026-01-20 00:41:07.014	\N	\N	\N	\N	\N
cmklvsaj500007eretnfiygzi	testadmin@test.com	$2a$12$sYMOcnvUf050YTTPYzvmGeeiRW9ZL3QuKBHLUdH8CHt2QNF1YdoyW	Test	Admin	\N	CUSTOMER	f	https://szvnxiozrxmsudtcsddx.supabase.co/storage/v1/object/public/avatars/cmklvsaj500007eretnfiygzi/1768870445999.png	2026-01-20 00:53:54.642	2026-01-20 00:54:06.789	\N	\N	\N	\N	\N
cmkoibl1j0000tro6s43wtcoi	devonsmartjr@gmail.com	$2a$12$DplMNybp.caDhUAtL01tkO9U4u6rug7CKrHrGldzZKegeXyiqf0CK	devon	smart	6315386119	CUSTOMER	f	\N	2026-01-21 21:00:18.631	2026-01-21 21:00:18.631	\N	\N	\N	\N	\N
cmkokrrqv0000s5nmqmv6fmij	thedamdocta@gmail.com	$2a$12$0Mu.f6lhdoldXwuwTsUV8.EFz/a1tL.DfQepEkV3RCor8yLM4ye4q	dam	docta	6315386119	CUSTOMER	f	\N	2026-01-21 22:08:52.994	2026-01-21 22:08:52.994	\N	\N	\N	\N	\N
cmkoadc360000eiy1z9k0sn8u	biggkingg1998@gmail.com	$2a$10$mQ1xNqKy2Be76l8t5dlrK.4gyBLX9fpijv/QWGO8ndM9HkBCzEze2	Big	King		ADMIN	t	https://szvnxiozrxmsudtcsddx.supabase.co/storage/v1/object/public/avatars/cmkoadc360000eiy1z9k0sn8u/1769649465990.jpg	2026-01-21 17:17:43.411	2026-01-29 01:18:19.789	\N	\N	\N	\N	cus_TrLAZpMOKgPyUS
\.


ALTER TABLE public."User" ENABLE TRIGGER ALL;

--
-- Data for Name: ActivityLog; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public."ActivityLog" DISABLE TRIGGER ALL;

COPY public."ActivityLog" (id, "userId", action, "entityType", "entityId", description, metadata, "ipAddress", "userAgent", status, "errorMessage", "createdAt") FROM stdin;
cmkudcxde00059mrgcvwc9vfd	cmkoadc360000eiy1z9k0sn8u	CONVERSATION_CREATE	Conversation	cmkudcwq100019mrgeh3pzfqk	Started conversation with customer@example.com	null	\N	\N	SUCCESS	\N	2026-01-25 23:28:00.242
cmkvveaxu0005n7bpozyraujg	cmkoadc360000eiy1z9k0sn8u	CONVERSATION_CREATE	Conversation	cmkvveacm0001n7bpq6t5k0xw	Started conversation with devonsmartjr@gmail.com	null	\N	\N	SUCCESS	\N	2026-01-27 00:40:43.747
\.


ALTER TABLE public."ActivityLog" ENABLE TRIGGER ALL;

--
-- Data for Name: Vehicle; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public."Vehicle" DISABLE TRIGGER ALL;

COPY public."Vehicle" (id, make, model, year, category, "dailyRate", status, images, features, description, seats, doors, transmission, "fuelType", mileage, color, "licensePlate", vin, location, "createdAt", "updatedAt", "deletedAt", "deletedBy") FROM stdin;
cmklsamw90003gag5hhhvwzc1	Honda	CR-V	2024	SUV	85.00	AVAILABLE	{https://images.unsplash.com/photo-1568844293986-ca9c5c1f1f34?w=800}	{AWD,Sunroof,"Heated Seats",Navigation,"Lane Assist"}	Spacious hybrid SUV with excellent fuel economy and modern safety features.	5	4	AUTOMATIC	HYBRID	3000	Blue	DEF-5678	2HGBH41JXMN109187	Main Office	2026-01-19 23:16:12.009	2026-01-19 23:16:12.009	\N	\N
cmklsan4z0004gag5i2l8pt27	BMW	3 Series	2024	PREMIUM	120.00	AVAILABLE	{https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800}	{"Leather Seats","Premium Sound","Parking Sensors","Sport Mode"}	Luxury sports sedan offering a perfect blend of performance and comfort.	5	4	AUTOMATIC	GASOLINE	2500	Black	GHI-9012	3HGBH41JXMN109188	Airport	2026-01-19 23:16:12.323	2026-01-19 23:16:12.323	\N	\N
cmklsane80005gag56fip52ls	Tesla	Model 3	2024	PREMIUM	130.00	AVAILABLE	{https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800}	{Autopilot,"Full Self-Driving","Premium Interior",Supercharging}	All-electric sedan with cutting-edge technology and impressive range.	5	4	AUTOMATIC	ELECTRIC	4000	White	JKL-3456	4HGBH41JXMN109189	Main Office	2026-01-19 23:16:12.657	2026-01-19 23:16:12.657	\N	\N
cmklsannx0006gag5put01pdm	Ford	Mustang	2024	LUXURY	150.00	AVAILABLE	{https://images.unsplash.com/photo-1584345604476-8ec5f82bd3c2?w=800}	{"V8 Engine","Sport Exhaust","Track Mode","Premium Audio"}	Iconic American muscle car for those who want to make a statement.	4	2	AUTOMATIC	GASOLINE	1500	Red	MNO-7890	5HGBH41JXMN109190	Airport	2026-01-19 23:16:13.005	2026-01-19 23:16:13.005	\N	\N
cmklsanx40007gag5hfv99f4c	Nissan	Versa	2024	ECONOMY	45.00	AVAILABLE	{https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800}	{"Fuel Efficient","Apple CarPlay","Android Auto"}	Affordable and fuel-efficient compact car, perfect for city driving.	5	4	AUTOMATIC	GASOLINE	8000	Gray	PQR-1234	6HGBH41JXMN109191	Main Office	2026-01-19 23:16:13.337	2026-01-19 23:16:13.337	\N	\N
cmklsao7h0008gag5yn3h3j2i	Chevrolet	Suburban	2024	VAN	140.00	AVAILABLE	{https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800}	{"Third Row","Towing Package","Entertainment System","Captain Chairs"}	Full-size SUV with seating for 8, ideal for large families or groups.	8	4	AUTOMATIC	GASOLINE	6000	White	STU-5678	7HGBH41JXMN109192	Main Office	2026-01-19 23:16:13.71	2026-01-26 20:07:49.048	\N	\N
cmklsaoi80009gag5etyngkcn	Mercedes-Benz	S-Class	2024	LUXURY	250.00	AVAILABLE	{https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800}	{"Massage Seats","Ambient Lighting","Night Vision","Burmester Sound","Air Conditioning","Keyless Entry","Heated Seats"}	The pinnacle of luxury sedans, featuring the finest materials and technology.	5	4	AUTOMATIC	GASOLINE	1000	Black	VWX-9012	8HGBH41JXMN109193	Airport	2026-01-19 23:16:14.096	2026-01-29 01:25:27.43	\N	\N
cmklsamj30002gag56n2cyzir	Toyota	Camry	2024	STANDARD	65.00	AVAILABLE	{https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800}	{"Backup Camera","Apple CarPlay","Cruise Control","Air Conditioning",Bluetooth}	Reliable and comfortable mid-size sedan, perfect for business trips or family outings.	5	4	AUTOMATIC	GASOLINE	5000	Silver	ABC-1234	1HGBH41JXMN109186	Main Office	2026-01-19 23:16:11.535	2026-01-29 01:21:47.785	\N	\N
\.


ALTER TABLE public."Vehicle" ENABLE TRIGGER ALL;

--
-- Data for Name: Booking; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public."Booking" DISABLE TRIGGER ALL;

COPY public."Booking" (id, "userId", "vehicleId", "startDate", "endDate", status, "totalAmount", "dailyRate", extras, "pickupLocation", "dropoffLocation", notes, "contractSigned", "contractUrl", "createdAt", "updatedAt", "deletedAt", "deletedBy") FROM stdin;
sample-booking-1	cmklsam9o0001gag59fwvpn4p	cmklsamj30002gag56n2cyzir	2026-01-26 23:16:14.68	2026-01-29 23:16:14.68	CONFIRMED	195.00	65.00	{"gps": false, "insurance": true}	Main Office	Main Office	\N	f	\N	2026-01-19 23:16:14.684	2026-01-19 23:16:14.684	\N	\N
cmkluprs0000410lkh2omf14j	cmklunnfw000010lk4c1b5qsu	cmklsaoi80009gag5etyngkcn	2026-03-01 00:00:00	2026-03-04 00:00:00	CONFIRMED	750.00	250.00	{}	Airport	Main Office	\N	f	\N	2026-01-20 00:23:57.407	2026-01-20 00:24:48.919	\N	\N
cmklurl04000610lk5gnv67gs	cmklunnfw000010lk4c1b5qsu	cmklsaoi80009gag5etyngkcn	2026-04-01 00:00:00	2026-04-03 00:00:00	CANCELLED	500.00	250.00	{}	Main Office	Main Office	\N	f	\N	2026-01-20 00:25:21.939	2026-01-20 00:25:24.174	\N	\N
cmklvudy300027ere2kq6grsp	cmklvsaj500007eretnfiygzi	cmklsamj30002gag56n2cyzir	2026-04-01 00:00:00	2026-04-05 00:00:00	CANCELLED	260.00	65.00	{}	Airport	Airport	\N	t	cmklvudy300027ere2kq6grsp/1768870541887-contract.pdf	2026-01-20 00:55:32.38	2026-01-25 17:41:22.899	\N	\N
cmklunwqw000210lkqkya794s	cmklunnfw000010lk4c1b5qsu	cmklsaoi80009gag5etyngkcn	2026-02-01 00:00:00	2026-02-05 00:00:00	CANCELLED	1000.00	250.00	{}	Main Office	Main Office	\N	f	\N	2026-01-20 00:22:30.536	2026-01-27 00:18:41.098	\N	\N
\.


ALTER TABLE public."Booking" ENABLE TRIGGER ALL;

--
-- Data for Name: CompanySettings; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public."CompanySettings" DISABLE TRIGGER ALL;

COPY public."CompanySettings" (id, "companyName", "companyEmail", "companyPhone", "companyAddress", "companyLogo", "defaultCurrency", "defaultTimezone", "taxRate", "minBookingHours", "maxBookingDays", "cancellationHours", "depositPercentage", "operatingHours", "termsOfService", "privacyPolicy", "cancellationPolicy", "createdAt", "updatedAt") FROM stdin;
default	Gem Auto Rentals	\N	\N	\N	\N	USD	America/New_York	0.0000	24	30	24	0.20	\N	\N	\N	\N	2026-01-25 18:09:19.569	2026-01-25 18:09:19.569
\.


ALTER TABLE public."CompanySettings" ENABLE TRIGGER ALL;

--
-- Data for Name: Conversation; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public."Conversation" DISABLE TRIGGER ALL;

COPY public."Conversation" (id, "customerId", subject, status, priority, "assignedToId", "bookingId", "lastMessageAt", "createdAt", "updatedAt", "deletedAt", "deletedBy") FROM stdin;
cmkudcwq100019mrgeh3pzfqk	cmklsam9o0001gag59fwvpn4p	Booking Confirmation	OPEN	NORMAL	cmkoadc360000eiy1z9k0sn8u	\N	2026-01-25 23:27:59.4	2026-01-25 23:27:59.4	2026-01-25 23:27:59.4	\N	\N
cmkvveacm0001n7bpq6t5k0xw	cmkoibl1j0000tro6s43wtcoi	test	OPEN	HIGH	cmkoadc360000eiy1z9k0sn8u	\N	2026-01-27 00:40:42.982	2026-01-27 00:40:42.982	2026-01-27 00:40:42.982	\N	\N
\.


ALTER TABLE public."Conversation" ENABLE TRIGGER ALL;

--
-- Data for Name: Document; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public."Document" DISABLE TRIGGER ALL;

COPY public."Document" (id, "userId", type, "verifiedAt", "verifiedBy", "expiresAt", "createdAt", "updatedAt", "bookingId", "fileName", "fileSize", "fileUrl", "mimeType", notes, status, "deletedAt", "deletedBy") FROM stdin;
cmkoikqvs0002tro6tlsbw27i	cmkoadc360000eiy1z9k0sn8u	DRIVERS_LICENSE_BACK	\N	\N	\N	2026-01-21 21:07:26.104	2026-01-21 21:07:26.104	\N	IMG_8033-preview.jpeg	5011609	cmkoadc360000eiy1z9k0sn8u/DRIVERS_LICENSE_BACK/1769029644123-IMG_8033-preview.jpeg	image/jpeg	\N	PENDING	\N	\N
\.


ALTER TABLE public."Document" ENABLE TRIGGER ALL;

--
-- Data for Name: Integration; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public."Integration" DISABLE TRIGGER ALL;

COPY public."Integration" (id, provider, "isEnabled", "isConnected", "accessToken", "refreshToken", "tokenExpiresAt", config, "connectedAt", "lastSyncAt", "lastError", "createdAt", "updatedAt") FROM stdin;
cmkvxu7jz0000cppv915gv267	STRIPE	f	f	\N	\N	\N	\N	\N	\N	\N	2026-01-27 01:49:05.087	2026-01-27 01:49:05.087
cmkvxu7jz0001cppvsgewp8yg	PAYPAL	f	f	\N	\N	\N	\N	\N	\N	\N	2026-01-27 01:49:05.087	2026-01-27 01:49:05.087
cmkvxu7jz0002cppvrx53o8ce	MAILCHIMP	f	f	\N	\N	\N	\N	\N	\N	\N	2026-01-27 01:49:05.087	2026-01-27 01:49:05.087
cmkvxu7jz0003cppv0r458ny9	TWILIO	f	f	\N	\N	\N	\N	\N	\N	\N	2026-01-27 01:49:05.087	2026-01-27 01:49:05.087
cmkvxu7jz0004cppvg1bs384e	GOOGLE_CALENDAR	f	f	\N	\N	\N	\N	\N	\N	\N	2026-01-27 01:49:05.087	2026-01-27 01:49:05.087
cmkvxu7jz0005cppvi9rvvwfh	QUICKBOOKS	f	f	\N	\N	\N	\N	\N	\N	\N	2026-01-27 01:49:05.087	2026-01-27 01:49:05.087
cmkvxu7jz0006cppvyl6uu01y	ZAPIER	f	f	\N	\N	\N	\N	\N	\N	\N	2026-01-27 01:49:05.087	2026-01-27 01:49:05.087
\.


ALTER TABLE public."Integration" ENABLE TRIGGER ALL;

--
-- Data for Name: Invoice; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public."Invoice" DISABLE TRIGGER ALL;

COPY public."Invoice" (id, "bookingId", "customerId", "invoiceNumber", status, subtotal, "taxAmount", "discountAmount", "totalAmount", "lineItems", "issueDate", "dueDate", "paidAt", "paymentId", "pdfUrl", notes, "createdAt", "updatedAt", "deletedAt", "deletedBy") FROM stdin;
\.


ALTER TABLE public."Invoice" ENABLE TRIGGER ALL;

--
-- Data for Name: MaintenanceRecord; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public."MaintenanceRecord" DISABLE TRIGGER ALL;

COPY public."MaintenanceRecord" (id, "vehicleId", type, description, cost, "performedAt", "nextDueAt", "mileageAt", "createdAt", "updatedAt", "deletedAt", "deletedBy") FROM stdin;
\.


ALTER TABLE public."MaintenanceRecord" ENABLE TRIGGER ALL;

--
-- Data for Name: Message; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public."Message" DISABLE TRIGGER ALL;

COPY public."Message" (id, "conversationId", "senderId", "senderType", content, "contentType", "readAt", "emailMessageId", "createdAt") FROM stdin;
cmkudcwq100039mrgxblw00l0	cmkudcwq100019mrgeh3pzfqk	cmkoadc360000eiy1z9k0sn8u	STAFF	Hi John! This is a test message to confirm your booking. Thank you for choosing Gem Auto Rentals!	TEXT	\N	\N	2026-01-25 23:27:59.4
cmkvveacm0003n7bpbdpeccga	cmkvveacm0001n7bpq6t5k0xw	cmkoadc360000eiy1z9k0sn8u	STAFF	Test lil nigga	TEXT	\N	\N	2026-01-27 00:40:42.982
\.


ALTER TABLE public."Message" ENABLE TRIGGER ALL;

--
-- Data for Name: MessageAttachment; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public."MessageAttachment" DISABLE TRIGGER ALL;

COPY public."MessageAttachment" (id, "messageId", "fileName", "fileUrl", "fileSize", "mimeType", "createdAt") FROM stdin;
\.


ALTER TABLE public."MessageAttachment" ENABLE TRIGGER ALL;

--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public."Notification" DISABLE TRIGGER ALL;

COPY public."Notification" (id, "userId", type, title, message, "entityType", "entityId", "actionUrl", channels, "emailSent", "emailSentAt", "smsSent", "smsSentAt", "readAt", "createdAt") FROM stdin;
\.


ALTER TABLE public."Notification" ENABLE TRIGGER ALL;

--
-- Data for Name: Payment; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public."Payment" DISABLE TRIGGER ALL;

COPY public."Payment" (id, "bookingId", amount, status, "stripePaymentIntentId", "stripeChargeId", method, "refundAmount", "refundReason", "createdAt", "updatedAt") FROM stdin;
\.


ALTER TABLE public."Payment" ENABLE TRIGGER ALL;

--
-- Data for Name: Review; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public."Review" DISABLE TRIGGER ALL;

COPY public."Review" (id, "userId", "vehicleId", rating, comment, "createdAt", "updatedAt", "deletedAt", "deletedBy") FROM stdin;
\.


ALTER TABLE public."Review" ENABLE TRIGGER ALL;

--
-- Data for Name: Session; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public."Session" DISABLE TRIGGER ALL;

COPY public."Session" (id, "userId", token, "userAgent", "ipAddress", device, browser, os, location, "isActive", "lastActiveAt", "expiresAt", "revokedAt", "revokedReason", "createdAt") FROM stdin;
\.


ALTER TABLE public."Session" ENABLE TRIGGER ALL;

--
-- Data for Name: UserPreferences; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public."UserPreferences" DISABLE TRIGGER ALL;

COPY public."UserPreferences" (id, "userId", "emailBookingConfirm", "emailBookingReminder", "emailPaymentReceipt", "emailPromotions", "emailNewsletter", "pushEnabled", "smsBookingReminder", "smsPaymentAlert", language, timezone, "dateFormat", currency, "createdAt", "updatedAt") FROM stdin;
\.


ALTER TABLE public."UserPreferences" ENABLE TRIGGER ALL;

--
-- Data for Name: WebhookLog; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public."WebhookLog" DISABLE TRIGGER ALL;

COPY public."WebhookLog" (id, provider, "eventType", payload, status, "processedAt", "errorMessage", "retryCount", "createdAt") FROM stdin;
\.


ALTER TABLE public."WebhookLog" ENABLE TRIGGER ALL;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--


\.



--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

-- SKIP users DISABLE TRIGGER ALL;

\.


-- SKIP users ENABLE TRIGGER ALL;

--
-- Data for Name: vehicles; Type: TABLE DATA; Schema: public; Owner: -
--

-- SKIP vehicles DISABLE TRIGGER ALL;

663cb4b4-1afa-41ab-8d96-38b474efcb49	Toyota	Camry	2024	STANDARD	65.00	AVAILABLE	{https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800}	{Bluetooth,"Backup Camera","Apple CarPlay","Lane Assist"}	\N	5	4	AUTOMATIC	GASOLINE	12500	Silver	GEM-1001	1HGBH41JXMN109186	Los Angeles	2026-01-20 00:39:32.625322+00	2026-01-20 00:39:32.625322+00
6bc04681-9542-443e-94d8-b067b24def86	Honda	Civic	2024	ECONOMY	55.00	AVAILABLE	{https://images.unsplash.com/photo-1606611013016-969c19ba27bb?w=800}	{Bluetooth,"Fuel Efficient","USB Ports"}	\N	5	4	AUTOMATIC	GASOLINE	8200	Blue	GEM-1002	2HGFC2F59MH123456	Los Angeles	2026-01-20 00:39:32.625322+00	2026-01-20 00:39:32.625322+00
563319ea-d8f7-4378-8a95-4a0fa297c4bb	BMW	3 Series	2024	PREMIUM	120.00	AVAILABLE	{https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800}	{"Leather Seats",Navigation,Sunroof,"Premium Sound"}	\N	5	4	AUTOMATIC	GASOLINE	5800	Black	GEM-1003	3MW5R1J04M8B12345	Beverly Hills	2026-01-20 00:39:32.625322+00	2026-01-20 00:39:32.625322+00
0f0773ae-fc8a-452b-9de8-3d74bdc0a4f4	Mercedes-Benz	E-Class	2024	LUXURY	175.00	AVAILABLE	{https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800}	{"Massage Seats","Ambient Lighting","Burmester Sound","Driver Assist"}	\N	5	4	AUTOMATIC	GASOLINE	3200	White	GEM-1004	W1KZF8DB4MA123456	Beverly Hills	2026-01-20 00:39:32.625322+00	2026-01-20 00:39:32.625322+00
9ed3307f-962a-4e90-b6e7-5075e7aeb11c	Ford	Explorer	2024	SUV	95.00	AVAILABLE	{https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800}	{"Third Row Seating",4WD,"Towing Package","Roof Rails"}	\N	7	4	AUTOMATIC	GASOLINE	15600	Red	GEM-1005	1FM5K8GC2MGA12345	Santa Monica	2026-01-20 00:39:32.625322+00	2026-01-20 00:39:32.625322+00
b9a33255-bbbe-4a77-a227-952e0db86180	Tesla	Model 3	2024	PREMIUM	110.00	AVAILABLE	{https://images.unsplash.com/photo-1536700503339-1e4b06520771?w=800}	{Autopilot,"Premium Interior","Glass Roof",Supercharging}	\N	5	4	AUTOMATIC	ELECTRIC	9800	Red	GEM-1006	5YJ3E1EA5MF123456	Hollywood	2026-01-20 00:39:32.625322+00	2026-01-20 00:39:32.625322+00
d9cca044-f8db-44a6-a0a7-6d10dd59f22e	Chevrolet	Suburban	2024	VAN	135.00	AVAILABLE	{https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800}	{"8 Passenger","Entertainment System","Cargo Space",Wi-Fi}	\N	8	4	AUTOMATIC	GASOLINE	22000	Black	GEM-1007	1GNSKJKC4MR123456	LAX Airport	2026-01-20 00:39:32.625322+00	2026-01-20 00:39:32.625322+00
f92d1c8e-fed4-409a-b4ad-fbc72c0b1493	Porsche	911	2024	LUXURY	350.00	AVAILABLE	{https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800}	{"Sport Chrono",PASM,"Sport Exhaust","Carbon Fiber"}	\N	2	4	AUTOMATIC	GASOLINE	2100	Yellow	GEM-1008	WP0AB2A94MS123456	Beverly Hills	2026-01-20 00:39:32.625322+00	2026-01-20 00:39:32.625322+00
4748d0a5-5606-447e-9862-5b0c7495c764	Toyota	RAV4	2024	SUV	85.00	AVAILABLE	{https://images.unsplash.com/photo-1568844293986-8c8a0e4d3b29?w=800}	{AWD,"Safety Sense","Apple CarPlay","Android Auto"}	\N	5	4	AUTOMATIC	HYBRID	11200	Gray	GEM-1009	2T3W1RFV5MW123456	Pasadena	2026-01-20 00:39:32.625322+00	2026-01-20 00:39:32.625322+00
6f12ea7e-23c5-4a4b-81f6-b742ae3d585c	Nissan	Altima	2024	STANDARD	60.00	AVAILABLE	{https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800}	{"ProPILOT Assist",Bluetooth,"Remote Start"}	\N	5	4	AUTOMATIC	GASOLINE	14300	White	GEM-1010	1N4BL4BV5MN123456	Los Angeles	2026-01-20 00:39:32.625322+00	2026-01-20 00:39:32.625322+00
2932a11e-6cde-4bb6-8879-fda1d44dfe8e	Audi	A4	2024	PREMIUM	115.00	AVAILABLE	{https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800}	{"Quattro AWD","Virtual Cockpit","Bang & Olufsen Sound"}	\N	5	4	AUTOMATIC	GASOLINE	7600	Blue	GEM-1011	WAUENAF47MN123456	Santa Monica	2026-01-20 00:39:32.625322+00	2026-01-20 00:39:32.625322+00
4b631454-5ef5-448d-b071-2a01bf83022f	Jeep	Wrangler	2024	SUV	105.00	AVAILABLE	{https://images.unsplash.com/photo-1519245659620-e859806a8d3b?w=800}	{4x4,"Removable Top","Off-Road Package","Trail Rated"}	\N	5	4	AUTOMATIC	GASOLINE	18500	Green	GEM-1012	1C4HJXDG5MW123456	Malibu	2026-01-20 00:39:32.625322+00	2026-01-20 00:39:32.625322+00
\.


-- SKIP vehicles ENABLE TRIGGER ALL;

--
-- Data for Name: bookings; Type: TABLE DATA; Schema: public; Owner: -
--

-- SKIP bookings DISABLE TRIGGER ALL;

\.


-- SKIP bookings ENABLE TRIGGER ALL;

--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: -
--

-- SKIP documents DISABLE TRIGGER ALL;

\.


-- SKIP documents ENABLE TRIGGER ALL;

--
-- Data for Name: maintenance_records; Type: TABLE DATA; Schema: public; Owner: -
--

-- SKIP maintenance_records DISABLE TRIGGER ALL;

\.


-- SKIP maintenance_records ENABLE TRIGGER ALL;

--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: -
--

-- SKIP payments DISABLE TRIGGER ALL;

\.


-- SKIP payments ENABLE TRIGGER ALL;

--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: -
--

-- SKIP reviews DISABLE TRIGGER ALL;

\.


-- SKIP reviews ENABLE TRIGGER ALL;

--
-- PostgreSQL database dump complete
--



