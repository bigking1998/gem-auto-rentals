--
-- PostgreSQL database dump
--

\restrict VGFUyAHtZm51EhBLffNg3Ab4ja8GxQXQbmgFJLEtxpVXeDrClr2AcRMfYVAb6e6

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
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: -
--

SET SESSION AUTHORIZATION DEFAULT;

ALTER TABLE auth.audit_log_entries DISABLE TRIGGER ALL;

COPY auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) FROM stdin;
\.


ALTER TABLE auth.audit_log_entries ENABLE TRIGGER ALL;

--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: -
--

ALTER TABLE auth.flow_state DISABLE TRIGGER ALL;

COPY auth.flow_state (id, user_id, auth_code, code_challenge_method, code_challenge, provider_type, provider_access_token, provider_refresh_token, created_at, updated_at, authentication_method, auth_code_issued_at) FROM stdin;
\.


ALTER TABLE auth.flow_state ENABLE TRIGGER ALL;

--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: -
--

ALTER TABLE auth.users DISABLE TRIGGER ALL;

COPY auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous) FROM stdin;
00000000-0000-0000-0000-000000000000	e6c44364-ee9c-45d0-afef-f041a9b44dbf	authenticated	authenticated	biggkingg1998@gmail.com	$2a$10$BU8eFhBr0.1ThiKOdl5.cOF48boXpd.aDoTDlGREd7G3v5QiGdKxm	2026-01-19 23:07:35.346734+00	\N		\N		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-01-19 23:07:35.293537+00	2026-01-19 23:07:35.352593+00	\N	\N			\N		0	\N		\N	f	\N	f
\.


ALTER TABLE auth.users ENABLE TRIGGER ALL;

--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: -
--

ALTER TABLE auth.identities DISABLE TRIGGER ALL;

COPY auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id) FROM stdin;
e6c44364-ee9c-45d0-afef-f041a9b44dbf	e6c44364-ee9c-45d0-afef-f041a9b44dbf	{"sub": "e6c44364-ee9c-45d0-afef-f041a9b44dbf", "email": "biggkingg1998@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-01-19 23:07:35.328389+00	2026-01-19 23:07:35.329255+00	2026-01-19 23:07:35.329255+00	9710f363-e00c-4081-a4c9-6a3ba434078d
\.


ALTER TABLE auth.identities ENABLE TRIGGER ALL;

--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: -
--

ALTER TABLE auth.instances DISABLE TRIGGER ALL;

COPY auth.instances (id, uuid, raw_base_config, created_at, updated_at) FROM stdin;
\.


ALTER TABLE auth.instances ENABLE TRIGGER ALL;

--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: -
--

ALTER TABLE auth.oauth_clients DISABLE TRIGGER ALL;

COPY auth.oauth_clients (id, client_secret_hash, registration_type, redirect_uris, grant_types, client_name, client_uri, logo_uri, created_at, updated_at, deleted_at, client_type) FROM stdin;
\.


ALTER TABLE auth.oauth_clients ENABLE TRIGGER ALL;

--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: -
--

ALTER TABLE auth.sessions DISABLE TRIGGER ALL;

COPY auth.sessions (id, user_id, created_at, updated_at, factor_id, aal, not_after, refreshed_at, user_agent, ip, tag, oauth_client_id, refresh_token_hmac_key, refresh_token_counter, scopes) FROM stdin;
\.


ALTER TABLE auth.sessions ENABLE TRIGGER ALL;

--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_amr_claims DISABLE TRIGGER ALL;

COPY auth.mfa_amr_claims (session_id, created_at, updated_at, authentication_method, id) FROM stdin;
\.


ALTER TABLE auth.mfa_amr_claims ENABLE TRIGGER ALL;

--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_factors DISABLE TRIGGER ALL;

COPY auth.mfa_factors (id, user_id, friendly_name, factor_type, status, created_at, updated_at, secret, phone, last_challenged_at, web_authn_credential, web_authn_aaguid, last_webauthn_challenge_data) FROM stdin;
\.


ALTER TABLE auth.mfa_factors ENABLE TRIGGER ALL;

--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_challenges DISABLE TRIGGER ALL;

COPY auth.mfa_challenges (id, factor_id, created_at, verified_at, ip_address, otp_code, web_authn_session_data) FROM stdin;
\.


ALTER TABLE auth.mfa_challenges ENABLE TRIGGER ALL;

--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: -
--

ALTER TABLE auth.oauth_authorizations DISABLE TRIGGER ALL;

COPY auth.oauth_authorizations (id, authorization_id, client_id, user_id, redirect_uri, scope, state, resource, code_challenge, code_challenge_method, response_type, status, authorization_code, created_at, expires_at, approved_at, nonce) FROM stdin;
\.


ALTER TABLE auth.oauth_authorizations ENABLE TRIGGER ALL;

--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: -
--

ALTER TABLE auth.oauth_client_states DISABLE TRIGGER ALL;

COPY auth.oauth_client_states (id, provider_type, code_verifier, created_at) FROM stdin;
\.


ALTER TABLE auth.oauth_client_states ENABLE TRIGGER ALL;

--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: -
--

ALTER TABLE auth.oauth_consents DISABLE TRIGGER ALL;

COPY auth.oauth_consents (id, user_id, client_id, scopes, granted_at, revoked_at) FROM stdin;
\.


ALTER TABLE auth.oauth_consents ENABLE TRIGGER ALL;

--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: -
--

ALTER TABLE auth.one_time_tokens DISABLE TRIGGER ALL;

COPY auth.one_time_tokens (id, user_id, token_type, token_hash, relates_to, created_at, updated_at) FROM stdin;
\.


ALTER TABLE auth.one_time_tokens ENABLE TRIGGER ALL;

--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: -
--

ALTER TABLE auth.refresh_tokens DISABLE TRIGGER ALL;

COPY auth.refresh_tokens (instance_id, id, token, user_id, revoked, created_at, updated_at, parent, session_id) FROM stdin;
\.


ALTER TABLE auth.refresh_tokens ENABLE TRIGGER ALL;

--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_providers DISABLE TRIGGER ALL;

COPY auth.sso_providers (id, resource_id, created_at, updated_at, disabled) FROM stdin;
\.


ALTER TABLE auth.sso_providers ENABLE TRIGGER ALL;

--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_providers DISABLE TRIGGER ALL;

COPY auth.saml_providers (id, sso_provider_id, entity_id, metadata_xml, metadata_url, attribute_mapping, created_at, updated_at, name_id_format) FROM stdin;
\.


ALTER TABLE auth.saml_providers ENABLE TRIGGER ALL;

--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_relay_states DISABLE TRIGGER ALL;

COPY auth.saml_relay_states (id, sso_provider_id, request_id, for_email, redirect_to, created_at, updated_at, flow_state_id) FROM stdin;
\.


ALTER TABLE auth.saml_relay_states ENABLE TRIGGER ALL;

--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: auth; Owner: -
--

ALTER TABLE auth.schema_migrations DISABLE TRIGGER ALL;

COPY auth.schema_migrations (version) FROM stdin;
20171026211738
20171026211808
20171026211834
20180103212743
20180108183307
20180119214651
20180125194653
00
20210710035447
20210722035447
20210730183235
20210909172000
20210927181326
20211122151130
20211124214934
20211202183645
20220114185221
20220114185340
20220224000811
20220323170000
20220429102000
20220531120530
20220614074223
20220811173540
20221003041349
20221003041400
20221011041400
20221020193600
20221021073300
20221021082433
20221027105023
20221114143122
20221114143410
20221125140132
20221208132122
20221215195500
20221215195800
20221215195900
20230116124310
20230116124412
20230131181311
20230322519590
20230402418590
20230411005111
20230508135423
20230523124323
20230818113222
20230914180801
20231027141322
20231114161723
20231117164230
20240115144230
20240214120130
20240306115329
20240314092811
20240427152123
20240612123726
20240729123726
20240802193726
20240806073726
20241009103726
20250717082212
20250731150234
20250804100000
20250901200500
20250903112500
20250904133000
20250925093508
20251007112900
20251104100000
20251111201300
20251201000000
\.


ALTER TABLE auth.schema_migrations ENABLE TRIGGER ALL;

--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_domains DISABLE TRIGGER ALL;

COPY auth.sso_domains (id, sso_provider_id, domain, created_at, updated_at) FROM stdin;
\.


ALTER TABLE auth.sso_domains ENABLE TRIGGER ALL;

--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: -
--

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

ALTER TABLE public._prisma_migrations DISABLE TRIGGER ALL;

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
\.


ALTER TABLE public._prisma_migrations ENABLE TRIGGER ALL;

--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.users DISABLE TRIGGER ALL;

COPY public.users (id, email, first_name, last_name, phone, role, email_verified, avatar_url, date_of_birth, address, city, state, zip_code, country, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.users ENABLE TRIGGER ALL;

--
-- Data for Name: vehicles; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.vehicles DISABLE TRIGGER ALL;

COPY public.vehicles (id, make, model, year, category, daily_rate, status, images, features, description, seats, doors, transmission, fuel_type, mileage, color, license_plate, vin, location, created_at, updated_at) FROM stdin;
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


ALTER TABLE public.vehicles ENABLE TRIGGER ALL;

--
-- Data for Name: bookings; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.bookings DISABLE TRIGGER ALL;

COPY public.bookings (id, user_id, vehicle_id, start_date, end_date, status, total_amount, daily_rate, extras, pickup_location, dropoff_location, notes, contract_signed, contract_url, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.bookings ENABLE TRIGGER ALL;

--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.documents DISABLE TRIGGER ALL;

COPY public.documents (id, user_id, type, url, filename, verified, verified_at, verified_by, expires_at, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.documents ENABLE TRIGGER ALL;

--
-- Data for Name: maintenance_records; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.maintenance_records DISABLE TRIGGER ALL;

COPY public.maintenance_records (id, vehicle_id, type, description, cost, performed_at, next_due_at, mileage_at, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.maintenance_records ENABLE TRIGGER ALL;

--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.payments DISABLE TRIGGER ALL;

COPY public.payments (id, booking_id, amount, status, stripe_payment_intent_id, stripe_charge_id, method, refund_amount, refund_reason, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.payments ENABLE TRIGGER ALL;

--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.reviews DISABLE TRIGGER ALL;

COPY public.reviews (id, user_id, vehicle_id, rating, comment, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.reviews ENABLE TRIGGER ALL;

--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: realtime; Owner: -
--

ALTER TABLE realtime.schema_migrations DISABLE TRIGGER ALL;

COPY realtime.schema_migrations (version, inserted_at) FROM stdin;
20211116024918	2026-01-18 23:59:46
20211116045059	2026-01-18 23:59:46
20211116050929	2026-01-18 23:59:46
20211116051442	2026-01-18 23:59:46
20211116212300	2026-01-18 23:59:46
20211116213355	2026-01-18 23:59:46
20211116213934	2026-01-18 23:59:46
20211116214523	2026-01-18 23:59:47
20211122062447	2026-01-18 23:59:47
20211124070109	2026-01-18 23:59:47
20211202204204	2026-01-18 23:59:47
20211202204605	2026-01-18 23:59:47
20211210212804	2026-01-18 23:59:48
20211228014915	2026-01-18 23:59:48
20220107221237	2026-01-18 23:59:48
20220228202821	2026-01-18 23:59:48
20220312004840	2026-01-18 23:59:48
20220603231003	2026-01-18 23:59:48
20220603232444	2026-01-18 23:59:48
20220615214548	2026-01-18 23:59:49
20220712093339	2026-01-18 23:59:49
20220908172859	2026-01-18 23:59:49
20220916233421	2026-01-18 23:59:49
20230119133233	2026-01-18 23:59:49
20230128025114	2026-01-18 23:59:49
20230128025212	2026-01-18 23:59:49
20230227211149	2026-01-18 23:59:50
20230228184745	2026-01-18 23:59:50
20230308225145	2026-01-18 23:59:50
20230328144023	2026-01-18 23:59:50
20231018144023	2026-01-18 23:59:50
20231204144023	2026-01-18 23:59:50
20231204144024	2026-01-18 23:59:50
20231204144025	2026-01-18 23:59:51
20240108234812	2026-01-18 23:59:51
20240109165339	2026-01-18 23:59:51
20240227174441	2026-01-18 23:59:51
20240311171622	2026-01-18 23:59:51
20240321100241	2026-01-18 23:59:51
20240401105812	2026-01-18 23:59:52
20240418121054	2026-01-18 23:59:52
20240523004032	2026-01-18 23:59:52
20240618124746	2026-01-18 23:59:53
20240801235015	2026-01-18 23:59:53
20240805133720	2026-01-18 23:59:53
20240827160934	2026-01-18 23:59:53
20240919163303	2026-01-18 23:59:53
20240919163305	2026-01-18 23:59:53
20241019105805	2026-01-18 23:59:53
20241030150047	2026-01-18 23:59:54
20241108114728	2026-01-18 23:59:54
20241121104152	2026-01-18 23:59:54
20241130184212	2026-01-18 23:59:54
20241220035512	2026-01-18 23:59:54
20241220123912	2026-01-18 23:59:55
20241224161212	2026-01-18 23:59:55
20250107150512	2026-01-18 23:59:55
20250110162412	2026-01-18 23:59:55
20250123174212	2026-01-18 23:59:55
20250128220012	2026-01-18 23:59:55
20250506224012	2026-01-18 23:59:55
20250523164012	2026-01-18 23:59:55
20250714121412	2026-01-18 23:59:56
20250905041441	2026-01-18 23:59:56
20251103001201	2026-01-18 23:59:56
\.


ALTER TABLE realtime.schema_migrations ENABLE TRIGGER ALL;

--
-- Data for Name: subscription; Type: TABLE DATA; Schema: realtime; Owner: -
--

ALTER TABLE realtime.subscription DISABLE TRIGGER ALL;

COPY realtime.subscription (id, subscription_id, entity, filters, claims, created_at) FROM stdin;
\.


ALTER TABLE realtime.subscription ENABLE TRIGGER ALL;

--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets DISABLE TRIGGER ALL;

COPY storage.buckets (id, name, owner, created_at, updated_at, public, avif_autodetection, file_size_limit, allowed_mime_types, owner_id, type) FROM stdin;
documents	documents	\N	2026-01-20 00:39:32.870574+00	2026-01-20 00:39:32.870574+00	f	f	10485760	{image/jpeg,image/png,image/webp,application/pdf}	\N	STANDARD
vehicles	vehicles	\N	2026-01-20 00:47:33.092142+00	2026-01-20 00:47:33.092142+00	t	f	5242880	{image/jpeg,image/png,image/webp}	\N	STANDARD
avatars	avatars	\N	2026-01-20 00:47:33.092142+00	2026-01-20 00:47:33.092142+00	t	f	2097152	{image/jpeg,image/png,image/webp}	\N	STANDARD
contracts	contracts	\N	2026-01-20 00:47:33.092142+00	2026-01-20 00:47:33.092142+00	f	f	10485760	{application/pdf,image/jpeg,image/png}	\N	STANDARD
\.


ALTER TABLE storage.buckets ENABLE TRIGGER ALL;

--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets_analytics DISABLE TRIGGER ALL;

COPY storage.buckets_analytics (name, type, format, created_at, updated_at, id, deleted_at) FROM stdin;
\.


ALTER TABLE storage.buckets_analytics ENABLE TRIGGER ALL;

--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets_vectors DISABLE TRIGGER ALL;

COPY storage.buckets_vectors (id, type, created_at, updated_at) FROM stdin;
\.


ALTER TABLE storage.buckets_vectors ENABLE TRIGGER ALL;

--
-- Data for Name: migrations; Type: TABLE DATA; Schema: storage; Owner: -
--

ALTER TABLE storage.migrations DISABLE TRIGGER ALL;

COPY storage.migrations (id, name, hash, executed_at) FROM stdin;
0	create-migrations-table	e18db593bcde2aca2a408c4d1100f6abba2195df	2026-01-18 23:59:48.617153
1	initialmigration	6ab16121fbaa08bbd11b712d05f358f9b555d777	2026-01-18 23:59:48.630188
2	storage-schema	5c7968fd083fcea04050c1b7f6253c9771b99011	2026-01-18 23:59:48.634093
3	pathtoken-column	2cb1b0004b817b29d5b0a971af16bafeede4b70d	2026-01-18 23:59:48.650088
4	add-migrations-rls	427c5b63fe1c5937495d9c635c263ee7a5905058	2026-01-18 23:59:48.657635
5	add-size-functions	79e081a1455b63666c1294a440f8ad4b1e6a7f84	2026-01-18 23:59:48.661106
6	change-column-name-in-get-size	f93f62afdf6613ee5e7e815b30d02dc990201044	2026-01-18 23:59:48.664566
7	add-rls-to-buckets	e7e7f86adbc51049f341dfe8d30256c1abca17aa	2026-01-18 23:59:48.668108
8	add-public-to-buckets	fd670db39ed65f9d08b01db09d6202503ca2bab3	2026-01-18 23:59:48.670734
9	fix-search-function	3a0af29f42e35a4d101c259ed955b67e1bee6825	2026-01-18 23:59:48.674191
10	search-files-search-function	68dc14822daad0ffac3746a502234f486182ef6e	2026-01-18 23:59:48.679363
11	add-trigger-to-auto-update-updated_at-column	7425bdb14366d1739fa8a18c83100636d74dcaa2	2026-01-18 23:59:48.685444
12	add-automatic-avif-detection-flag	8e92e1266eb29518b6a4c5313ab8f29dd0d08df9	2026-01-18 23:59:48.688642
13	add-bucket-custom-limits	cce962054138135cd9a8c4bcd531598684b25e7d	2026-01-18 23:59:48.69145
14	use-bytes-for-max-size	941c41b346f9802b411f06f30e972ad4744dad27	2026-01-18 23:59:48.694262
15	add-can-insert-object-function	934146bc38ead475f4ef4b555c524ee5d66799e5	2026-01-18 23:59:48.713567
16	add-version	76debf38d3fd07dcfc747ca49096457d95b1221b	2026-01-18 23:59:48.716677
17	drop-owner-foreign-key	f1cbb288f1b7a4c1eb8c38504b80ae2a0153d101	2026-01-18 23:59:48.719287
18	add_owner_id_column_deprecate_owner	e7a511b379110b08e2f214be852c35414749fe66	2026-01-18 23:59:48.724085
19	alter-default-value-objects-id	02e5e22a78626187e00d173dc45f58fa66a4f043	2026-01-18 23:59:48.7351
20	list-objects-with-delimiter	cd694ae708e51ba82bf012bba00caf4f3b6393b7	2026-01-18 23:59:48.737769
21	s3-multipart-uploads	8c804d4a566c40cd1e4cc5b3725a664a9303657f	2026-01-18 23:59:48.742895
22	s3-multipart-uploads-big-ints	9737dc258d2397953c9953d9b86920b8be0cdb73	2026-01-18 23:59:48.753871
23	optimize-search-function	9d7e604cddc4b56a5422dc68c9313f4a1b6f132c	2026-01-18 23:59:48.765128
24	operation-function	8312e37c2bf9e76bbe841aa5fda889206d2bf8aa	2026-01-18 23:59:48.768026
25	custom-metadata	d974c6057c3db1c1f847afa0e291e6165693b990	2026-01-18 23:59:48.770581
26	objects-prefixes	ef3f7871121cdc47a65308e6702519e853422ae2	2026-01-18 23:59:48.774111
27	search-v2	33b8f2a7ae53105f028e13e9fcda9dc4f356b4a2	2026-01-18 23:59:48.785215
28	object-bucket-name-sorting	ba85ec41b62c6a30a3f136788227ee47f311c436	2026-01-18 23:59:48.885705
29	create-prefixes	a7b1a22c0dc3ab630e3055bfec7ce7d2045c5b7b	2026-01-18 23:59:48.890986
30	update-object-levels	6c6f6cc9430d570f26284a24cf7b210599032db7	2026-01-18 23:59:48.895921
31	objects-level-index	33f1fef7ec7fea08bb892222f4f0f5d79bab5eb8	2026-01-18 23:59:48.901649
32	backward-compatible-index-on-objects	2d51eeb437a96868b36fcdfb1ddefdf13bef1647	2026-01-18 23:59:48.907448
33	backward-compatible-index-on-prefixes	fe473390e1b8c407434c0e470655945b110507bf	2026-01-18 23:59:48.914945
34	optimize-search-function-v1	82b0e469a00e8ebce495e29bfa70a0797f7ebd2c	2026-01-18 23:59:48.916378
35	add-insert-trigger-prefixes	63bb9fd05deb3dc5e9fa66c83e82b152f0caf589	2026-01-18 23:59:48.920284
36	optimise-existing-functions	81cf92eb0c36612865a18016a38496c530443899	2026-01-18 23:59:48.922927
37	add-bucket-name-length-trigger	3944135b4e3e8b22d6d4cbb568fe3b0b51df15c1	2026-01-18 23:59:48.942108
38	iceberg-catalog-flag-on-buckets	19a8bd89d5dfa69af7f222a46c726b7c41e462c5	2026-01-18 23:59:48.961949
39	add-search-v2-sort-support	39cf7d1e6bf515f4b02e41237aba845a7b492853	2026-01-18 23:59:48.973675
40	fix-prefix-race-conditions-optimized	fd02297e1c67df25a9fc110bf8c8a9af7fb06d1f	2026-01-18 23:59:49.016361
41	add-object-level-update-trigger	44c22478bf01744b2129efc480cd2edc9a7d60e9	2026-01-18 23:59:49.049196
42	rollback-prefix-triggers	f2ab4f526ab7f979541082992593938c05ee4b47	2026-01-18 23:59:49.22316
43	fix-object-level	ab837ad8f1c7d00cc0b7310e989a23388ff29fc6	2026-01-18 23:59:49.826282
44	vector-bucket-type	99c20c0ffd52bb1ff1f32fb992f3b351e3ef8fb3	2026-01-18 23:59:49.83266
45	vector-buckets	049e27196d77a7cb76497a85afae669d8b230953	2026-01-18 23:59:49.838245
46	buckets-objects-grants	fedeb96d60fefd8e02ab3ded9fbde05632f84aed	2026-01-18 23:59:49.84781
47	iceberg-table-metadata	649df56855c24d8b36dd4cc1aeb8251aa9ad42c2	2026-01-18 23:59:49.850599
48	iceberg-catalog-ids	2666dff93346e5d04e0a878416be1d5fec345d6f	2026-01-18 23:59:49.85308
49	buckets-objects-grants-postgres	072b1195d0d5a2f888af6b2302a1938dd94b8b3d	2026-01-18 23:59:49.867463
\.


ALTER TABLE storage.migrations ENABLE TRIGGER ALL;

--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: -
--

ALTER TABLE storage.objects DISABLE TRIGGER ALL;

COPY storage.objects (id, bucket_id, name, owner, created_at, updated_at, last_accessed_at, metadata, version, owner_id, user_metadata, level) FROM stdin;
26aeb94b-63f7-4aab-aca6-23184bf35a36	avatars	cmklvsaj500007eretnfiygzi/1768870445999.png	\N	2026-01-20 00:54:06.736173+00	2026-01-20 00:54:06.736173+00	2026-01-20 00:54:06.736173+00	{"eTag": "\\"e3c4c5943e3ef9bf3960b205faf607c5\\"", "size": 69, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-01-20T00:54:07.000Z", "contentLength": 69, "httpStatusCode": 200}	2ef58aa7-89dc-4ba0-bba3-9180b522fb34	\N	{}	2
8e21b054-4278-44cb-b953-aaf424f91bcc	contracts	cmklvudy300027ere2kq6grsp/1768870541887-contract.pdf	\N	2026-01-20 00:55:42.230107+00	2026-01-20 00:55:42.230107+00	2026-01-20 00:55:42.230107+00	{"eTag": "\\"4fef11fc20fc5e5f295bd5756f470b4f\\"", "size": 241, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-01-20T00:55:43.000Z", "contentLength": 241, "httpStatusCode": 200}	c89e0094-d16a-4650-bf46-31b6b2423731	\N	{}	2
032eabec-fada-4f0e-9ece-dea9e86b71d8	documents	cmkoadc360000eiy1z9k0sn8u/DRIVERS_LICENSE_BACK/1769029644123-IMG_8033-preview.jpeg	\N	2026-01-21 21:07:25.940347+00	2026-01-21 21:07:25.940347+00	2026-01-21 21:07:25.940347+00	{"eTag": "\\"f1abe0a981d74cb7ce47b66b656324fe\\"", "size": 5011609, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-01-21T21:07:26.000Z", "contentLength": 5011609, "httpStatusCode": 200}	c1e354cb-3ffa-42c3-b675-47a5e1a6cf5a	\N	{}	3
dac19183-a2bd-4605-af3a-f8bd66557517	avatars	cmkoadc360000eiy1z9k0sn8u/1769649465990.jpg	\N	2026-01-29 01:17:46.625345+00	2026-01-29 01:17:46.625345+00	2026-01-29 01:17:46.625345+00	{"eTag": "\\"ee0c6f73f41dc1684c108e3e28f2b569\\"", "size": 1192454, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-01-29T01:17:47.000Z", "contentLength": 1192454, "httpStatusCode": 200}	54da1a78-06d0-4901-af43-df117f131fef	\N	{}	2
\.


ALTER TABLE storage.objects ENABLE TRIGGER ALL;

--
-- Data for Name: prefixes; Type: TABLE DATA; Schema: storage; Owner: -
--

ALTER TABLE storage.prefixes DISABLE TRIGGER ALL;

COPY storage.prefixes (bucket_id, name, created_at, updated_at) FROM stdin;
avatars	cmklvsaj500007eretnfiygzi	2026-01-20 00:54:06.736173+00	2026-01-20 00:54:06.736173+00
contracts	cmklvudy300027ere2kq6grsp	2026-01-20 00:55:42.230107+00	2026-01-20 00:55:42.230107+00
documents	cmkoadc360000eiy1z9k0sn8u	2026-01-21 21:07:25.940347+00	2026-01-21 21:07:25.940347+00
documents	cmkoadc360000eiy1z9k0sn8u/DRIVERS_LICENSE_BACK	2026-01-21 21:07:25.940347+00	2026-01-21 21:07:25.940347+00
avatars	cmkoadc360000eiy1z9k0sn8u	2026-01-29 01:17:46.625345+00	2026-01-29 01:17:46.625345+00
\.


ALTER TABLE storage.prefixes ENABLE TRIGGER ALL;

--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads DISABLE TRIGGER ALL;

COPY storage.s3_multipart_uploads (id, in_progress_size, upload_signature, bucket_id, key, version, owner_id, created_at, user_metadata) FROM stdin;
\.


ALTER TABLE storage.s3_multipart_uploads ENABLE TRIGGER ALL;

--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads_parts DISABLE TRIGGER ALL;

COPY storage.s3_multipart_uploads_parts (id, upload_id, size, part_number, bucket_id, key, etag, owner_id, version, created_at) FROM stdin;
\.


ALTER TABLE storage.s3_multipart_uploads_parts ENABLE TRIGGER ALL;

--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: -
--

ALTER TABLE storage.vector_indexes DISABLE TRIGGER ALL;

COPY storage.vector_indexes (id, name, bucket_id, data_type, dimension, distance_metric, metadata_configuration, created_at, updated_at) FROM stdin;
\.


ALTER TABLE storage.vector_indexes ENABLE TRIGGER ALL;

--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: supabase_migrations; Owner: -
--

ALTER TABLE supabase_migrations.schema_migrations DISABLE TRIGGER ALL;

COPY supabase_migrations.schema_migrations (version, statements, name) FROM stdin;
001	{"-- =============================================\n-- USERS TABLE (extends Supabase Auth)\n-- =============================================\nCREATE TABLE IF NOT EXISTS public.users (\n  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,\n  email TEXT UNIQUE NOT NULL,\n  first_name TEXT NOT NULL,\n  last_name TEXT NOT NULL,\n  phone TEXT,\n  role TEXT DEFAULT 'CUSTOMER' CHECK (role IN ('CUSTOMER', 'SUPPORT', 'MANAGER', 'ADMIN')),\n  email_verified BOOLEAN DEFAULT false,\n  avatar_url TEXT,\n  date_of_birth DATE,\n  address TEXT,\n  city TEXT,\n  state TEXT,\n  zip_code TEXT,\n  country TEXT,\n  created_at TIMESTAMPTZ DEFAULT NOW(),\n  updated_at TIMESTAMPTZ DEFAULT NOW()\n)","-- Trigger to auto-create user profile on signup\nCREATE OR REPLACE FUNCTION public.handle_new_user()\nRETURNS TRIGGER AS $$\nBEGIN\n  INSERT INTO public.users (id, email, first_name, last_name)\n  VALUES (\n    NEW.id,\n    NEW.email,\n    COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),\n    COALESCE(NEW.raw_user_meta_data->>'last_name', '')\n  );\n  RETURN NEW;\nEND;\n$$ LANGUAGE plpgsql SECURITY DEFINER","DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users","CREATE TRIGGER on_auth_user_created\n  AFTER INSERT ON auth.users\n  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user()","-- =============================================\n-- VEHICLES TABLE\n-- =============================================\nCREATE TABLE IF NOT EXISTS public.vehicles (\n  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,\n  make TEXT NOT NULL,\n  model TEXT NOT NULL,\n  year INTEGER NOT NULL CHECK (year >= 1900 AND year <= 2100),\n  category TEXT NOT NULL CHECK (category IN ('ECONOMY', 'STANDARD', 'PREMIUM', 'LUXURY', 'SUV', 'VAN')),\n  daily_rate DECIMAL(10,2) NOT NULL CHECK (daily_rate > 0),\n  status TEXT DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'RENTED', 'MAINTENANCE', 'RETIRED')),\n  images TEXT[] DEFAULT '{}',\n  features TEXT[] DEFAULT '{}',\n  description TEXT,\n  seats INTEGER NOT NULL CHECK (seats > 0),\n  doors INTEGER DEFAULT 4 CHECK (doors > 0),\n  transmission TEXT NOT NULL CHECK (transmission IN ('AUTOMATIC', 'MANUAL')),\n  fuel_type TEXT NOT NULL CHECK (fuel_type IN ('GASOLINE', 'DIESEL', 'ELECTRIC', 'HYBRID')),\n  mileage INTEGER NOT NULL DEFAULT 0 CHECK (mileage >= 0),\n  color TEXT,\n  license_plate TEXT UNIQUE NOT NULL,\n  vin TEXT UNIQUE NOT NULL,\n  location TEXT,\n  created_at TIMESTAMPTZ DEFAULT NOW(),\n  updated_at TIMESTAMPTZ DEFAULT NOW()\n)","-- =============================================\n-- BOOKINGS TABLE\n-- =============================================\nCREATE TABLE IF NOT EXISTS public.bookings (\n  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,\n  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,\n  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE RESTRICT NOT NULL,\n  start_date TIMESTAMPTZ NOT NULL,\n  end_date TIMESTAMPTZ NOT NULL,\n  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED')),\n  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),\n  daily_rate DECIMAL(10,2) NOT NULL CHECK (daily_rate > 0),\n  extras JSONB DEFAULT '{}',\n  pickup_location TEXT NOT NULL,\n  dropoff_location TEXT NOT NULL,\n  notes TEXT,\n  contract_signed BOOLEAN DEFAULT false,\n  contract_url TEXT,\n  created_at TIMESTAMPTZ DEFAULT NOW(),\n  updated_at TIMESTAMPTZ DEFAULT NOW(),\n\n  CONSTRAINT valid_dates CHECK (end_date > start_date)\n)","-- =============================================\n-- PAYMENTS TABLE\n-- =============================================\nCREATE TABLE IF NOT EXISTS public.payments (\n  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,\n  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE UNIQUE NOT NULL,\n  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),\n  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED')),\n  stripe_payment_intent_id TEXT,\n  stripe_charge_id TEXT,\n  method TEXT CHECK (method IN ('CARD', 'BANK_TRANSFER')),\n  refund_amount DECIMAL(10,2) CHECK (refund_amount >= 0),\n  refund_reason TEXT,\n  created_at TIMESTAMPTZ DEFAULT NOW(),\n  updated_at TIMESTAMPTZ DEFAULT NOW()\n)","-- =============================================\n-- DOCUMENTS TABLE\n-- =============================================\nCREATE TABLE IF NOT EXISTS public.documents (\n  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,\n  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,\n  type TEXT NOT NULL CHECK (type IN ('DRIVERS_LICENSE', 'ID_CARD', 'PASSPORT', 'PROOF_OF_ADDRESS', 'INSURANCE')),\n  url TEXT NOT NULL,\n  filename TEXT NOT NULL,\n  verified BOOLEAN DEFAULT false,\n  verified_at TIMESTAMPTZ,\n  verified_by UUID REFERENCES public.users(id),\n  expires_at TIMESTAMPTZ,\n  created_at TIMESTAMPTZ DEFAULT NOW(),\n  updated_at TIMESTAMPTZ DEFAULT NOW()\n)","-- =============================================\n-- REVIEWS TABLE\n-- =============================================\nCREATE TABLE IF NOT EXISTS public.reviews (\n  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,\n  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,\n  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,\n  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),\n  comment TEXT,\n  created_at TIMESTAMPTZ DEFAULT NOW(),\n  updated_at TIMESTAMPTZ DEFAULT NOW(),\n\n  UNIQUE(user_id, vehicle_id)\n)","-- =============================================\n-- MAINTENANCE RECORDS TABLE\n-- =============================================\nCREATE TABLE IF NOT EXISTS public.maintenance_records (\n  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,\n  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,\n  type TEXT NOT NULL,\n  description TEXT,\n  cost DECIMAL(10,2) CHECK (cost >= 0),\n  performed_at TIMESTAMPTZ NOT NULL,\n  next_due_at TIMESTAMPTZ,\n  mileage_at INTEGER CHECK (mileage_at >= 0),\n  created_at TIMESTAMPTZ DEFAULT NOW(),\n  updated_at TIMESTAMPTZ DEFAULT NOW()\n)","-- =============================================\n-- INDEXES FOR PERFORMANCE\n-- =============================================\nCREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email)","CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role)","CREATE INDEX IF NOT EXISTS idx_vehicles_status ON public.vehicles(status)","CREATE INDEX IF NOT EXISTS idx_vehicles_category ON public.vehicles(category)","CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id)","CREATE INDEX IF NOT EXISTS idx_bookings_vehicle_id ON public.bookings(vehicle_id)","CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status)","CREATE INDEX IF NOT EXISTS idx_bookings_dates ON public.bookings(start_date, end_date)","CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id)","CREATE INDEX IF NOT EXISTS idx_reviews_vehicle_id ON public.reviews(vehicle_id)","CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle_id ON public.maintenance_records(vehicle_id)","-- =============================================\n-- UPDATED_AT TRIGGER FUNCTION\n-- =============================================\nCREATE OR REPLACE FUNCTION update_updated_at_column()\nRETURNS TRIGGER AS $$\nBEGIN\n  NEW.updated_at = NOW();\n  RETURN NEW;\nEND;\n$$ LANGUAGE plpgsql","-- Apply to all tables\nDROP TRIGGER IF EXISTS update_users_updated_at ON public.users","CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()","DROP TRIGGER IF EXISTS update_vehicles_updated_at ON public.vehicles","CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()","DROP TRIGGER IF EXISTS update_bookings_updated_at ON public.bookings","CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()","DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments","CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()","DROP TRIGGER IF EXISTS update_documents_updated_at ON public.documents","CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()","DROP TRIGGER IF EXISTS update_reviews_updated_at ON public.reviews","CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()","DROP TRIGGER IF EXISTS update_maintenance_updated_at ON public.maintenance_records","CREATE TRIGGER update_maintenance_updated_at BEFORE UPDATE ON public.maintenance_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()"}	create_tables
002	{"-- =============================================\n-- ENABLE RLS ON ALL TABLES\n-- =============================================\nALTER TABLE public.users ENABLE ROW LEVEL SECURITY","ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY","ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY","ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY","ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY","ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY","ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY","-- =============================================\n-- HELPER FUNCTION: Check if user is admin/manager\n-- =============================================\nCREATE OR REPLACE FUNCTION is_admin_or_manager()\nRETURNS BOOLEAN AS $$\nBEGIN\n  RETURN EXISTS (\n    SELECT 1 FROM public.users\n    WHERE id = auth.uid()\n    AND role IN ('ADMIN', 'MANAGER')\n  );\nEND;\n$$ LANGUAGE plpgsql SECURITY DEFINER","-- =============================================\n-- USERS POLICIES\n-- =============================================\n-- Drop existing policies first\nDROP POLICY IF EXISTS \\"Users can view own profile\\" ON public.users","DROP POLICY IF EXISTS \\"Users can update own profile\\" ON public.users","DROP POLICY IF EXISTS \\"Admins can view all users\\" ON public.users","DROP POLICY IF EXISTS \\"Admins can update all users\\" ON public.users","-- Users can read their own profile\nCREATE POLICY \\"Users can view own profile\\" ON public.users\n  FOR SELECT USING (auth.uid() = id)","-- Users can update their own profile\nCREATE POLICY \\"Users can update own profile\\" ON public.users\n  FOR UPDATE USING (auth.uid() = id)","-- Admins can view all users\nCREATE POLICY \\"Admins can view all users\\" ON public.users\n  FOR SELECT USING (is_admin_or_manager())","-- Admins can update all users\nCREATE POLICY \\"Admins can update all users\\" ON public.users\n  FOR UPDATE USING (is_admin_or_manager())","-- =============================================\n-- VEHICLES POLICIES\n-- =============================================\nDROP POLICY IF EXISTS \\"Vehicles are publicly viewable\\" ON public.vehicles","DROP POLICY IF EXISTS \\"Admins can insert vehicles\\" ON public.vehicles","DROP POLICY IF EXISTS \\"Admins can update vehicles\\" ON public.vehicles","DROP POLICY IF EXISTS \\"Admins can delete vehicles\\" ON public.vehicles","-- Anyone can view vehicles (public catalog)\nCREATE POLICY \\"Vehicles are publicly viewable\\" ON public.vehicles\n  FOR SELECT USING (true)","-- Only admins can insert vehicles\nCREATE POLICY \\"Admins can insert vehicles\\" ON public.vehicles\n  FOR INSERT WITH CHECK (is_admin_or_manager())","-- Only admins can update vehicles\nCREATE POLICY \\"Admins can update vehicles\\" ON public.vehicles\n  FOR UPDATE USING (is_admin_or_manager())","-- Only admins can delete vehicles\nCREATE POLICY \\"Admins can delete vehicles\\" ON public.vehicles\n  FOR DELETE USING (is_admin_or_manager())","-- =============================================\n-- BOOKINGS POLICIES\n-- =============================================\nDROP POLICY IF EXISTS \\"Users can view own bookings\\" ON public.bookings","DROP POLICY IF EXISTS \\"Admins can view all bookings\\" ON public.bookings","DROP POLICY IF EXISTS \\"Users can create bookings\\" ON public.bookings","DROP POLICY IF EXISTS \\"Users can update own pending bookings\\" ON public.bookings","DROP POLICY IF EXISTS \\"Admins can update any booking\\" ON public.bookings","-- Users can view their own bookings\nCREATE POLICY \\"Users can view own bookings\\" ON public.bookings\n  FOR SELECT USING (auth.uid() = user_id)","-- Admins can view all bookings\nCREATE POLICY \\"Admins can view all bookings\\" ON public.bookings\n  FOR SELECT USING (is_admin_or_manager())","-- Authenticated users can create bookings\nCREATE POLICY \\"Users can create bookings\\" ON public.bookings\n  FOR INSERT WITH CHECK (auth.uid() = user_id)","-- Users can update their pending bookings (cancel)\nCREATE POLICY \\"Users can update own pending bookings\\" ON public.bookings\n  FOR UPDATE USING (auth.uid() = user_id AND status = 'PENDING')","-- Admins can update any booking\nCREATE POLICY \\"Admins can update any booking\\" ON public.bookings\n  FOR UPDATE USING (is_admin_or_manager())","-- =============================================\n-- PAYMENTS POLICIES\n-- =============================================\nDROP POLICY IF EXISTS \\"Users can view own payments\\" ON public.payments","DROP POLICY IF EXISTS \\"Admins can view all payments\\" ON public.payments","DROP POLICY IF EXISTS \\"Admins can manage payments\\" ON public.payments","-- Users can view payments for their bookings\nCREATE POLICY \\"Users can view own payments\\" ON public.payments\n  FOR SELECT USING (\n    EXISTS (\n      SELECT 1 FROM public.bookings\n      WHERE bookings.id = payments.booking_id\n      AND bookings.user_id = auth.uid()\n    )\n  )","-- Admins can view all payments\nCREATE POLICY \\"Admins can view all payments\\" ON public.payments\n  FOR SELECT USING (is_admin_or_manager())","-- Admins can manage payments\nCREATE POLICY \\"Admins can manage payments\\" ON public.payments\n  FOR ALL USING (is_admin_or_manager())","-- =============================================\n-- DOCUMENTS POLICIES\n-- =============================================\nDROP POLICY IF EXISTS \\"Users can view own documents\\" ON public.documents","DROP POLICY IF EXISTS \\"Users can upload own documents\\" ON public.documents","DROP POLICY IF EXISTS \\"Admins can view all documents\\" ON public.documents","DROP POLICY IF EXISTS \\"Admins can update documents\\" ON public.documents","-- Users can view their own documents\nCREATE POLICY \\"Users can view own documents\\" ON public.documents\n  FOR SELECT USING (auth.uid() = user_id)","-- Users can upload their own documents\nCREATE POLICY \\"Users can upload own documents\\" ON public.documents\n  FOR INSERT WITH CHECK (auth.uid() = user_id)","-- Admins can view all documents\nCREATE POLICY \\"Admins can view all documents\\" ON public.documents\n  FOR SELECT USING (is_admin_or_manager())","-- Admins can verify documents\nCREATE POLICY \\"Admins can update documents\\" ON public.documents\n  FOR UPDATE USING (is_admin_or_manager())","-- =============================================\n-- REVIEWS POLICIES\n-- =============================================\nDROP POLICY IF EXISTS \\"Reviews are publicly viewable\\" ON public.reviews","DROP POLICY IF EXISTS \\"Users can create reviews\\" ON public.reviews","DROP POLICY IF EXISTS \\"Users can update own reviews\\" ON public.reviews","DROP POLICY IF EXISTS \\"Users can delete own reviews\\" ON public.reviews","-- Anyone can view reviews\nCREATE POLICY \\"Reviews are publicly viewable\\" ON public.reviews\n  FOR SELECT USING (true)","-- Users can create reviews\nCREATE POLICY \\"Users can create reviews\\" ON public.reviews\n  FOR INSERT WITH CHECK (auth.uid() = user_id)","-- Users can update their own reviews\nCREATE POLICY \\"Users can update own reviews\\" ON public.reviews\n  FOR UPDATE USING (auth.uid() = user_id)","-- Users can delete their own reviews\nCREATE POLICY \\"Users can delete own reviews\\" ON public.reviews\n  FOR DELETE USING (auth.uid() = user_id)","-- =============================================\n-- MAINTENANCE RECORDS POLICIES\n-- =============================================\nDROP POLICY IF EXISTS \\"Admins can manage maintenance\\" ON public.maintenance_records","-- Admins only for maintenance records\nCREATE POLICY \\"Admins can manage maintenance\\" ON public.maintenance_records\n  FOR ALL USING (is_admin_or_manager())"}	rls_policies
003	{"-- =============================================\n-- SEED SAMPLE VEHICLES\n-- =============================================\nINSERT INTO public.vehicles (make, model, year, category, daily_rate, status, images, features, seats, transmission, fuel_type, mileage, color, license_plate, vin, location) VALUES\n('Toyota', 'Camry', 2024, 'STANDARD', 65.00, 'AVAILABLE',\n  ARRAY['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800'],\n  ARRAY['Bluetooth', 'Backup Camera', 'Apple CarPlay', 'Lane Assist'],\n  5, 'AUTOMATIC', 'GASOLINE', 12500, 'Silver', 'GEM-1001', '1HGBH41JXMN109186', 'Los Angeles'),\n\n('Honda', 'Civic', 2024, 'ECONOMY', 55.00, 'AVAILABLE',\n  ARRAY['https://images.unsplash.com/photo-1606611013016-969c19ba27bb?w=800'],\n  ARRAY['Bluetooth', 'Fuel Efficient', 'USB Ports'],\n  5, 'AUTOMATIC', 'GASOLINE', 8200, 'Blue', 'GEM-1002', '2HGFC2F59MH123456', 'Los Angeles'),\n\n('BMW', '3 Series', 2024, 'PREMIUM', 120.00, 'AVAILABLE',\n  ARRAY['https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800'],\n  ARRAY['Leather Seats', 'Navigation', 'Sunroof', 'Premium Sound'],\n  5, 'AUTOMATIC', 'GASOLINE', 5800, 'Black', 'GEM-1003', '3MW5R1J04M8B12345', 'Beverly Hills'),\n\n('Mercedes-Benz', 'E-Class', 2024, 'LUXURY', 175.00, 'AVAILABLE',\n  ARRAY['https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800'],\n  ARRAY['Massage Seats', 'Ambient Lighting', 'Burmester Sound', 'Driver Assist'],\n  5, 'AUTOMATIC', 'GASOLINE', 3200, 'White', 'GEM-1004', 'W1KZF8DB4MA123456', 'Beverly Hills'),\n\n('Ford', 'Explorer', 2024, 'SUV', 95.00, 'AVAILABLE',\n  ARRAY['https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800'],\n  ARRAY['Third Row Seating', '4WD', 'Towing Package', 'Roof Rails'],\n  7, 'AUTOMATIC', 'GASOLINE', 15600, 'Red', 'GEM-1005', '1FM5K8GC2MGA12345', 'Santa Monica'),\n\n('Tesla', 'Model 3', 2024, 'PREMIUM', 110.00, 'AVAILABLE',\n  ARRAY['https://images.unsplash.com/photo-1536700503339-1e4b06520771?w=800'],\n  ARRAY['Autopilot', 'Premium Interior', 'Glass Roof', 'Supercharging'],\n  5, 'AUTOMATIC', 'ELECTRIC', 9800, 'Red', 'GEM-1006', '5YJ3E1EA5MF123456', 'Hollywood'),\n\n('Chevrolet', 'Suburban', 2024, 'VAN', 135.00, 'AVAILABLE',\n  ARRAY['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800'],\n  ARRAY['8 Passenger', 'Entertainment System', 'Cargo Space', 'Wi-Fi'],\n  8, 'AUTOMATIC', 'GASOLINE', 22000, 'Black', 'GEM-1007', '1GNSKJKC4MR123456', 'LAX Airport'),\n\n('Porsche', '911', 2024, 'LUXURY', 350.00, 'AVAILABLE',\n  ARRAY['https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800'],\n  ARRAY['Sport Chrono', 'PASM', 'Sport Exhaust', 'Carbon Fiber'],\n  2, 'AUTOMATIC', 'GASOLINE', 2100, 'Yellow', 'GEM-1008', 'WP0AB2A94MS123456', 'Beverly Hills'),\n\n('Toyota', 'RAV4', 2024, 'SUV', 85.00, 'AVAILABLE',\n  ARRAY['https://images.unsplash.com/photo-1568844293986-8c8a0e4d3b29?w=800'],\n  ARRAY['AWD', 'Safety Sense', 'Apple CarPlay', 'Android Auto'],\n  5, 'AUTOMATIC', 'HYBRID', 11200, 'Gray', 'GEM-1009', '2T3W1RFV5MW123456', 'Pasadena'),\n\n('Nissan', 'Altima', 2024, 'STANDARD', 60.00, 'AVAILABLE',\n  ARRAY['https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800'],\n  ARRAY['ProPILOT Assist', 'Bluetooth', 'Remote Start'],\n  5, 'AUTOMATIC', 'GASOLINE', 14300, 'White', 'GEM-1010', '1N4BL4BV5MN123456', 'Los Angeles'),\n\n('Audi', 'A4', 2024, 'PREMIUM', 115.00, 'AVAILABLE',\n  ARRAY['https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800'],\n  ARRAY['Quattro AWD', 'Virtual Cockpit', 'Bang & Olufsen Sound'],\n  5, 'AUTOMATIC', 'GASOLINE', 7600, 'Blue', 'GEM-1011', 'WAUENAF47MN123456', 'Santa Monica'),\n\n('Jeep', 'Wrangler', 2024, 'SUV', 105.00, 'AVAILABLE',\n  ARRAY['https://images.unsplash.com/photo-1519245659620-e859806a8d3b?w=800'],\n  ARRAY['4x4', 'Removable Top', 'Off-Road Package', 'Trail Rated'],\n  5, 'AUTOMATIC', 'GASOLINE', 18500, 'Green', 'GEM-1012', '1C4HJXDG5MW123456', 'Malibu')\n\nON CONFLICT (license_plate) DO NOTHING"}	seed_data
004	{"-- =============================================\n-- PROMOTE USER TO ADMIN\n-- =============================================\n-- Run this after creating a user in Supabase Dashboard > Authentication > Users\n-- Replace 'admin@gemautorentals.com' with the email you created\n\nUPDATE public.users\nSET role = 'ADMIN'\nWHERE email = 'admin@gemautorentals.com'","-- Verify the update\nSELECT id, email, first_name, last_name, role\nFROM public.users\nWHERE email = 'admin@gemautorentals.com'"}	promote_admin
005	{"-- Create storage bucket for documents\nINSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)\nVALUES (\n  'documents',\n  'documents',\n  false,\n  10485760, -- 10MB limit\n  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']\n)\nON CONFLICT (id) DO UPDATE SET\n  file_size_limit = EXCLUDED.file_size_limit,\n  allowed_mime_types = EXCLUDED.allowed_mime_types","-- Storage policies for documents bucket\n\n-- Allow authenticated users to upload their own documents\nCREATE POLICY \\"Users can upload their own documents\\"\nON storage.objects FOR INSERT\nTO authenticated\nWITH CHECK (\n  bucket_id = 'documents' AND\n  (storage.foldername(name))[1] = auth.uid()::text\n)","-- Allow users to view their own documents\nCREATE POLICY \\"Users can view their own documents\\"\nON storage.objects FOR SELECT\nTO authenticated\nUSING (\n  bucket_id = 'documents' AND\n  (storage.foldername(name))[1] = auth.uid()::text\n)","-- Allow users to delete their own documents\nCREATE POLICY \\"Users can delete their own documents\\"\nON storage.objects FOR DELETE\nTO authenticated\nUSING (\n  bucket_id = 'documents' AND\n  (storage.foldername(name))[1] = auth.uid()::text\n)","-- Allow staff to view all documents\nCREATE POLICY \\"Staff can view all documents\\"\nON storage.objects FOR SELECT\nTO authenticated\nUSING (\n  bucket_id = 'documents' AND\n  EXISTS (\n    SELECT 1 FROM public.\\"User\\"\n    WHERE id = auth.uid()::text\n    AND role IN ('ADMIN', 'MANAGER', 'SUPPORT')\n  )\n)"}	storage_buckets
006	{"-- Create additional storage buckets for vehicles, avatars, and contracts\n\n-- Vehicles bucket (public - vehicle images can be viewed by anyone)\nINSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)\nVALUES (\n  'vehicles',\n  'vehicles',\n  true,  -- Public bucket for vehicle images\n  5242880, -- 5MB limit\n  ARRAY['image/jpeg', 'image/png', 'image/webp']\n)\nON CONFLICT (id) DO UPDATE SET\n  public = EXCLUDED.public,\n  file_size_limit = EXCLUDED.file_size_limit,\n  allowed_mime_types = EXCLUDED.allowed_mime_types","-- Avatars bucket (public - profile pictures can be viewed by anyone)\nINSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)\nVALUES (\n  'avatars',\n  'avatars',\n  true,  -- Public bucket for avatars\n  2097152, -- 2MB limit\n  ARRAY['image/jpeg', 'image/png', 'image/webp']\n)\nON CONFLICT (id) DO UPDATE SET\n  public = EXCLUDED.public,\n  file_size_limit = EXCLUDED.file_size_limit,\n  allowed_mime_types = EXCLUDED.allowed_mime_types","-- Contracts bucket (private - rental agreements are confidential)\nINSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)\nVALUES (\n  'contracts',\n  'contracts',\n  false,  -- Private bucket for contracts\n  10485760, -- 10MB limit\n  ARRAY['application/pdf', 'image/jpeg', 'image/png']\n)\nON CONFLICT (id) DO UPDATE SET\n  public = EXCLUDED.public,\n  file_size_limit = EXCLUDED.file_size_limit,\n  allowed_mime_types = EXCLUDED.allowed_mime_types"}	additional_storage_buckets
007	{"-- Gem Auto Rentals - CRM Features Migration\n-- This migration adds the new CRM features for the admin dashboard\n-- Run this in Supabase SQL Editor if tables don't exist\n\n-- ============================================\n-- NEW ENUMS FOR CRM FEATURES\n-- ============================================\n\n-- Only create enums if they don't exist\nDO $$ BEGIN\n    CREATE TYPE \\"ConversationStatus\\" AS ENUM ('OPEN', 'PENDING', 'RESOLVED', 'CLOSED');\nEXCEPTION\n    WHEN duplicate_object THEN null;\nEND $$","DO $$ BEGIN\n    CREATE TYPE \\"Priority\\" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');\nEXCEPTION\n    WHEN duplicate_object THEN null;\nEND $$","DO $$ BEGIN\n    CREATE TYPE \\"SenderType\\" AS ENUM ('CUSTOMER', 'STAFF', 'SYSTEM');\nEXCEPTION\n    WHEN duplicate_object THEN null;\nEND $$","DO $$ BEGIN\n    CREATE TYPE \\"MessageContentType\\" AS ENUM ('TEXT', 'HTML', 'TEMPLATE');\nEXCEPTION\n    WHEN duplicate_object THEN null;\nEND $$","DO $$ BEGIN\n    CREATE TYPE \\"ActivityAction\\" AS ENUM (\n        'LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'PASSWORD_CHANGE', 'PASSWORD_RESET',\n        'TWO_FACTOR_ENABLED', 'TWO_FACTOR_DISABLED',\n        'USER_CREATE', 'USER_UPDATE', 'USER_DELETE', 'ROLE_CHANGE',\n        'VEHICLE_CREATE', 'VEHICLE_UPDATE', 'VEHICLE_DELETE', 'VEHICLE_STATUS_CHANGE',\n        'BOOKING_CREATE', 'BOOKING_UPDATE', 'BOOKING_CANCEL', 'BOOKING_STATUS_CHANGE', 'CONTRACT_UPLOAD',\n        'PAYMENT_PROCESS', 'PAYMENT_REFUND',\n        'DOCUMENT_UPLOAD', 'DOCUMENT_VERIFY', 'DOCUMENT_REJECT',\n        'CONVERSATION_CREATE', 'MESSAGE_SEND',\n        'SETTINGS_UPDATE'\n    );\nEXCEPTION\n    WHEN duplicate_object THEN null;\nEND $$","DO $$ BEGIN\n    CREATE TYPE \\"ActivityStatus\\" AS ENUM ('SUCCESS', 'FAILURE', 'PENDING');\nEXCEPTION\n    WHEN duplicate_object THEN null;\nEND $$","DO $$ BEGIN\n    CREATE TYPE \\"InvoiceStatus\\" AS ENUM ('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED');\nEXCEPTION\n    WHEN duplicate_object THEN null;\nEND $$","DO $$ BEGIN\n    CREATE TYPE \\"NotificationType\\" AS ENUM (\n        'BOOKING_CONFIRMED', 'BOOKING_REMINDER', 'BOOKING_STARTED', 'BOOKING_ENDING_SOON',\n        'BOOKING_COMPLETED', 'BOOKING_CANCELLED',\n        'PAYMENT_RECEIVED', 'PAYMENT_FAILED', 'PAYMENT_REFUNDED',\n        'INVOICE_SENT', 'INVOICE_OVERDUE',\n        'DOCUMENT_VERIFIED', 'DOCUMENT_REJECTED', 'DOCUMENT_EXPIRING',\n        'NEW_MESSAGE', 'CONVERSATION_ASSIGNED',\n        'SYSTEM_ANNOUNCEMENT', 'MAINTENANCE_ALERT'\n    );\nEXCEPTION\n    WHEN duplicate_object THEN null;\nEND $$","DO $$ BEGIN\n    CREATE TYPE \\"NotificationChannel\\" AS ENUM ('IN_APP', 'EMAIL', 'SMS', 'PUSH');\nEXCEPTION\n    WHEN duplicate_object THEN null;\nEND $$","DO $$ BEGIN\n    CREATE TYPE \\"IntegrationProvider\\" AS ENUM (\n        'STRIPE', 'PAYPAL', 'MAILCHIMP', 'TWILIO', 'GOOGLE_CALENDAR', 'QUICKBOOKS', 'ZAPIER'\n    );\nEXCEPTION\n    WHEN duplicate_object THEN null;\nEND $$","DO $$ BEGIN\n    CREATE TYPE \\"WebhookStatus\\" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');\nEXCEPTION\n    WHEN duplicate_object THEN null;\nEND $$","-- ============================================\n-- PHASE 1: MESSAGES & COMMUNICATIONS\n-- ============================================\n\n-- Conversation Table\nCREATE TABLE IF NOT EXISTS \\"Conversation\\" (\n    \\"id\\" TEXT NOT NULL,\n    \\"customerId\\" TEXT NOT NULL,\n    \\"subject\\" TEXT,\n    \\"status\\" \\"ConversationStatus\\" NOT NULL DEFAULT 'OPEN',\n    \\"priority\\" \\"Priority\\" NOT NULL DEFAULT 'NORMAL',\n    \\"assignedToId\\" TEXT,\n    \\"bookingId\\" TEXT,\n    \\"lastMessageAt\\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n    \\"createdAt\\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n    \\"updatedAt\\" TIMESTAMP(3) NOT NULL,\n\n    CONSTRAINT \\"Conversation_pkey\\" PRIMARY KEY (\\"id\\")\n)","-- Message Table\nCREATE TABLE IF NOT EXISTS \\"Message\\" (\n    \\"id\\" TEXT NOT NULL,\n    \\"conversationId\\" TEXT NOT NULL,\n    \\"senderId\\" TEXT NOT NULL,\n    \\"senderType\\" \\"SenderType\\" NOT NULL,\n    \\"content\\" TEXT NOT NULL,\n    \\"contentType\\" \\"MessageContentType\\" NOT NULL DEFAULT 'TEXT',\n    \\"readAt\\" TIMESTAMP(3),\n    \\"emailMessageId\\" TEXT,\n    \\"createdAt\\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n\n    CONSTRAINT \\"Message_pkey\\" PRIMARY KEY (\\"id\\")\n)","-- MessageAttachment Table\nCREATE TABLE IF NOT EXISTS \\"MessageAttachment\\" (\n    \\"id\\" TEXT NOT NULL,\n    \\"messageId\\" TEXT NOT NULL,\n    \\"fileName\\" TEXT NOT NULL,\n    \\"fileUrl\\" TEXT NOT NULL,\n    \\"fileSize\\" INTEGER NOT NULL,\n    \\"mimeType\\" TEXT NOT NULL,\n    \\"createdAt\\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n\n    CONSTRAINT \\"MessageAttachment_pkey\\" PRIMARY KEY (\\"id\\")\n)","-- ============================================\n-- PHASE 2: SECURITY & SESSION MANAGEMENT\n-- ============================================\n\n-- Session Table\nCREATE TABLE IF NOT EXISTS \\"Session\\" (\n    \\"id\\" TEXT NOT NULL,\n    \\"userId\\" TEXT NOT NULL,\n    \\"token\\" TEXT NOT NULL,\n    \\"userAgent\\" TEXT,\n    \\"ipAddress\\" TEXT,\n    \\"device\\" TEXT,\n    \\"browser\\" TEXT,\n    \\"os\\" TEXT,\n    \\"location\\" TEXT,\n    \\"isActive\\" BOOLEAN NOT NULL DEFAULT true,\n    \\"lastActiveAt\\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n    \\"expiresAt\\" TIMESTAMP(3) NOT NULL,\n    \\"revokedAt\\" TIMESTAMP(3),\n    \\"revokedReason\\" TEXT,\n    \\"createdAt\\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n\n    CONSTRAINT \\"Session_pkey\\" PRIMARY KEY (\\"id\\")\n)","-- ActivityLog Table\nCREATE TABLE IF NOT EXISTS \\"ActivityLog\\" (\n    \\"id\\" TEXT NOT NULL,\n    \\"userId\\" TEXT,\n    \\"action\\" \\"ActivityAction\\" NOT NULL,\n    \\"entityType\\" TEXT,\n    \\"entityId\\" TEXT,\n    \\"description\\" TEXT NOT NULL,\n    \\"metadata\\" JSONB,\n    \\"ipAddress\\" TEXT,\n    \\"userAgent\\" TEXT,\n    \\"status\\" \\"ActivityStatus\\" NOT NULL DEFAULT 'SUCCESS',\n    \\"errorMessage\\" TEXT,\n    \\"createdAt\\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n\n    CONSTRAINT \\"ActivityLog_pkey\\" PRIMARY KEY (\\"id\\")\n)","-- ============================================\n-- PHASE 3: SETTINGS\n-- ============================================\n\n-- UserPreferences Table\nCREATE TABLE IF NOT EXISTS \\"UserPreferences\\" (\n    \\"id\\" TEXT NOT NULL,\n    \\"userId\\" TEXT NOT NULL,\n    \\"emailBookingConfirm\\" BOOLEAN NOT NULL DEFAULT true,\n    \\"emailBookingReminder\\" BOOLEAN NOT NULL DEFAULT true,\n    \\"emailPaymentReceipt\\" BOOLEAN NOT NULL DEFAULT true,\n    \\"emailPromotions\\" BOOLEAN NOT NULL DEFAULT false,\n    \\"emailNewsletter\\" BOOLEAN NOT NULL DEFAULT false,\n    \\"pushEnabled\\" BOOLEAN NOT NULL DEFAULT false,\n    \\"smsBookingReminder\\" BOOLEAN NOT NULL DEFAULT false,\n    \\"smsPaymentAlert\\" BOOLEAN NOT NULL DEFAULT false,\n    \\"language\\" TEXT NOT NULL DEFAULT 'en',\n    \\"timezone\\" TEXT NOT NULL DEFAULT 'America/New_York',\n    \\"dateFormat\\" TEXT NOT NULL DEFAULT 'MM/DD/YYYY',\n    \\"currency\\" TEXT NOT NULL DEFAULT 'USD',\n    \\"createdAt\\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n    \\"updatedAt\\" TIMESTAMP(3) NOT NULL,\n\n    CONSTRAINT \\"UserPreferences_pkey\\" PRIMARY KEY (\\"id\\")\n)","-- CompanySettings Table\nCREATE TABLE IF NOT EXISTS \\"CompanySettings\\" (\n    \\"id\\" TEXT NOT NULL,\n    \\"companyName\\" TEXT NOT NULL DEFAULT 'Gem Auto Rentals',\n    \\"companyEmail\\" TEXT,\n    \\"companyPhone\\" TEXT,\n    \\"companyAddress\\" TEXT,\n    \\"companyLogo\\" TEXT,\n    \\"defaultCurrency\\" TEXT NOT NULL DEFAULT 'USD',\n    \\"defaultTimezone\\" TEXT NOT NULL DEFAULT 'America/New_York',\n    \\"taxRate\\" DECIMAL(5,4) NOT NULL DEFAULT 0,\n    \\"minBookingHours\\" INTEGER NOT NULL DEFAULT 24,\n    \\"maxBookingDays\\" INTEGER NOT NULL DEFAULT 30,\n    \\"cancellationHours\\" INTEGER NOT NULL DEFAULT 24,\n    \\"depositPercentage\\" DECIMAL(3,2) NOT NULL DEFAULT 0.20,\n    \\"operatingHours\\" JSONB,\n    \\"termsOfService\\" TEXT,\n    \\"privacyPolicy\\" TEXT,\n    \\"cancellationPolicy\\" TEXT,\n    \\"createdAt\\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n    \\"updatedAt\\" TIMESTAMP(3) NOT NULL,\n\n    CONSTRAINT \\"CompanySettings_pkey\\" PRIMARY KEY (\\"id\\")\n)","-- Invoice Table\nCREATE TABLE IF NOT EXISTS \\"Invoice\\" (\n    \\"id\\" TEXT NOT NULL,\n    \\"bookingId\\" TEXT,\n    \\"customerId\\" TEXT NOT NULL,\n    \\"invoiceNumber\\" TEXT NOT NULL,\n    \\"status\\" \\"InvoiceStatus\\" NOT NULL DEFAULT 'DRAFT',\n    \\"subtotal\\" DECIMAL(10,2) NOT NULL,\n    \\"taxAmount\\" DECIMAL(10,2) NOT NULL,\n    \\"discountAmount\\" DECIMAL(10,2) NOT NULL DEFAULT 0,\n    \\"totalAmount\\" DECIMAL(10,2) NOT NULL,\n    \\"lineItems\\" JSONB NOT NULL,\n    \\"issueDate\\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n    \\"dueDate\\" TIMESTAMP(3) NOT NULL,\n    \\"paidAt\\" TIMESTAMP(3),\n    \\"paymentId\\" TEXT,\n    \\"pdfUrl\\" TEXT,\n    \\"notes\\" TEXT,\n    \\"createdAt\\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n    \\"updatedAt\\" TIMESTAMP(3) NOT NULL,\n\n    CONSTRAINT \\"Invoice_pkey\\" PRIMARY KEY (\\"id\\")\n)","-- ============================================\n-- PHASE 4: NOTIFICATIONS\n-- ============================================\n\n-- Notification Table\nCREATE TABLE IF NOT EXISTS \\"Notification\\" (\n    \\"id\\" TEXT NOT NULL,\n    \\"userId\\" TEXT NOT NULL,\n    \\"type\\" \\"NotificationType\\" NOT NULL,\n    \\"title\\" TEXT NOT NULL,\n    \\"message\\" TEXT NOT NULL,\n    \\"entityType\\" TEXT,\n    \\"entityId\\" TEXT,\n    \\"actionUrl\\" TEXT,\n    \\"channels\\" \\"NotificationChannel\\"[],\n    \\"emailSent\\" BOOLEAN NOT NULL DEFAULT false,\n    \\"emailSentAt\\" TIMESTAMP(3),\n    \\"smsSent\\" BOOLEAN NOT NULL DEFAULT false,\n    \\"smsSentAt\\" TIMESTAMP(3),\n    \\"readAt\\" TIMESTAMP(3),\n    \\"createdAt\\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n\n    CONSTRAINT \\"Notification_pkey\\" PRIMARY KEY (\\"id\\")\n)","-- ============================================\n-- PHASE 5: INTEGRATIONS\n-- ============================================\n\n-- Integration Table\nCREATE TABLE IF NOT EXISTS \\"Integration\\" (\n    \\"id\\" TEXT NOT NULL,\n    \\"provider\\" \\"IntegrationProvider\\" NOT NULL,\n    \\"isEnabled\\" BOOLEAN NOT NULL DEFAULT false,\n    \\"isConnected\\" BOOLEAN NOT NULL DEFAULT false,\n    \\"accessToken\\" TEXT,\n    \\"refreshToken\\" TEXT,\n    \\"tokenExpiresAt\\" TIMESTAMP(3),\n    \\"config\\" JSONB,\n    \\"connectedAt\\" TIMESTAMP(3),\n    \\"lastSyncAt\\" TIMESTAMP(3),\n    \\"lastError\\" TEXT,\n    \\"createdAt\\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n    \\"updatedAt\\" TIMESTAMP(3) NOT NULL,\n\n    CONSTRAINT \\"Integration_pkey\\" PRIMARY KEY (\\"id\\")\n)","-- WebhookLog Table\nCREATE TABLE IF NOT EXISTS \\"WebhookLog\\" (\n    \\"id\\" TEXT NOT NULL,\n    \\"provider\\" \\"IntegrationProvider\\" NOT NULL,\n    \\"eventType\\" TEXT NOT NULL,\n    \\"payload\\" JSONB NOT NULL,\n    \\"status\\" \\"WebhookStatus\\" NOT NULL DEFAULT 'PENDING',\n    \\"processedAt\\" TIMESTAMP(3),\n    \\"errorMessage\\" TEXT,\n    \\"retryCount\\" INTEGER NOT NULL DEFAULT 0,\n    \\"createdAt\\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n\n    CONSTRAINT \\"WebhookLog_pkey\\" PRIMARY KEY (\\"id\\")\n)","-- ============================================\n-- UNIQUE CONSTRAINTS\n-- ============================================\n\nCREATE UNIQUE INDEX IF NOT EXISTS \\"Session_token_key\\" ON \\"Session\\"(\\"token\\")","CREATE UNIQUE INDEX IF NOT EXISTS \\"UserPreferences_userId_key\\" ON \\"UserPreferences\\"(\\"userId\\")","CREATE UNIQUE INDEX IF NOT EXISTS \\"Invoice_invoiceNumber_key\\" ON \\"Invoice\\"(\\"invoiceNumber\\")","CREATE UNIQUE INDEX IF NOT EXISTS \\"Integration_provider_key\\" ON \\"Integration\\"(\\"provider\\")","-- ============================================\n-- INDEXES FOR PERFORMANCE\n-- ============================================\n\n-- Conversation indexes\nCREATE INDEX IF NOT EXISTS \\"Conversation_customerId_idx\\" ON \\"Conversation\\"(\\"customerId\\")","CREATE INDEX IF NOT EXISTS \\"Conversation_assignedToId_idx\\" ON \\"Conversation\\"(\\"assignedToId\\")","CREATE INDEX IF NOT EXISTS \\"Conversation_status_idx\\" ON \\"Conversation\\"(\\"status\\")","CREATE INDEX IF NOT EXISTS \\"Conversation_lastMessageAt_idx\\" ON \\"Conversation\\"(\\"lastMessageAt\\")","-- Message indexes\nCREATE INDEX IF NOT EXISTS \\"Message_conversationId_idx\\" ON \\"Message\\"(\\"conversationId\\")","CREATE INDEX IF NOT EXISTS \\"Message_senderId_idx\\" ON \\"Message\\"(\\"senderId\\")","CREATE INDEX IF NOT EXISTS \\"Message_createdAt_idx\\" ON \\"Message\\"(\\"createdAt\\")","-- MessageAttachment indexes\nCREATE INDEX IF NOT EXISTS \\"MessageAttachment_messageId_idx\\" ON \\"MessageAttachment\\"(\\"messageId\\")","-- Session indexes\nCREATE INDEX IF NOT EXISTS \\"Session_userId_idx\\" ON \\"Session\\"(\\"userId\\")","CREATE INDEX IF NOT EXISTS \\"Session_token_idx\\" ON \\"Session\\"(\\"token\\")","CREATE INDEX IF NOT EXISTS \\"Session_isActive_idx\\" ON \\"Session\\"(\\"isActive\\")","CREATE INDEX IF NOT EXISTS \\"Session_lastActiveAt_idx\\" ON \\"Session\\"(\\"lastActiveAt\\")","-- ActivityLog indexes\nCREATE INDEX IF NOT EXISTS \\"ActivityLog_userId_idx\\" ON \\"ActivityLog\\"(\\"userId\\")","CREATE INDEX IF NOT EXISTS \\"ActivityLog_action_idx\\" ON \\"ActivityLog\\"(\\"action\\")","CREATE INDEX IF NOT EXISTS \\"ActivityLog_entityType_entityId_idx\\" ON \\"ActivityLog\\"(\\"entityType\\", \\"entityId\\")","CREATE INDEX IF NOT EXISTS \\"ActivityLog_createdAt_idx\\" ON \\"ActivityLog\\"(\\"createdAt\\")","-- Invoice indexes\nCREATE INDEX IF NOT EXISTS \\"Invoice_customerId_idx\\" ON \\"Invoice\\"(\\"customerId\\")","CREATE INDEX IF NOT EXISTS \\"Invoice_bookingId_idx\\" ON \\"Invoice\\"(\\"bookingId\\")","CREATE INDEX IF NOT EXISTS \\"Invoice_status_idx\\" ON \\"Invoice\\"(\\"status\\")","CREATE INDEX IF NOT EXISTS \\"Invoice_invoiceNumber_idx\\" ON \\"Invoice\\"(\\"invoiceNumber\\")","-- Notification indexes\nCREATE INDEX IF NOT EXISTS \\"Notification_userId_idx\\" ON \\"Notification\\"(\\"userId\\")","CREATE INDEX IF NOT EXISTS \\"Notification_type_idx\\" ON \\"Notification\\"(\\"type\\")","CREATE INDEX IF NOT EXISTS \\"Notification_readAt_idx\\" ON \\"Notification\\"(\\"readAt\\")","CREATE INDEX IF NOT EXISTS \\"Notification_createdAt_idx\\" ON \\"Notification\\"(\\"createdAt\\")","-- WebhookLog indexes\nCREATE INDEX IF NOT EXISTS \\"WebhookLog_provider_idx\\" ON \\"WebhookLog\\"(\\"provider\\")","CREATE INDEX IF NOT EXISTS \\"WebhookLog_status_idx\\" ON \\"WebhookLog\\"(\\"status\\")","CREATE INDEX IF NOT EXISTS \\"WebhookLog_createdAt_idx\\" ON \\"WebhookLog\\"(\\"createdAt\\")","-- ============================================\n-- FOREIGN KEYS (only for new tables)\n-- ============================================\n\n-- Conversation foreign keys\nALTER TABLE \\"Conversation\\" DROP CONSTRAINT IF EXISTS \\"Conversation_customerId_fkey\\"","ALTER TABLE \\"Conversation\\" ADD CONSTRAINT \\"Conversation_customerId_fkey\\"\n    FOREIGN KEY (\\"customerId\\") REFERENCES \\"User\\"(\\"id\\") ON DELETE RESTRICT ON UPDATE CASCADE","ALTER TABLE \\"Conversation\\" DROP CONSTRAINT IF EXISTS \\"Conversation_assignedToId_fkey\\"","ALTER TABLE \\"Conversation\\" ADD CONSTRAINT \\"Conversation_assignedToId_fkey\\"\n    FOREIGN KEY (\\"assignedToId\\") REFERENCES \\"User\\"(\\"id\\") ON DELETE SET NULL ON UPDATE CASCADE","ALTER TABLE \\"Conversation\\" DROP CONSTRAINT IF EXISTS \\"Conversation_bookingId_fkey\\"","ALTER TABLE \\"Conversation\\" ADD CONSTRAINT \\"Conversation_bookingId_fkey\\"\n    FOREIGN KEY (\\"bookingId\\") REFERENCES \\"Booking\\"(\\"id\\") ON DELETE SET NULL ON UPDATE CASCADE","-- Message foreign keys\nALTER TABLE \\"Message\\" DROP CONSTRAINT IF EXISTS \\"Message_conversationId_fkey\\"","ALTER TABLE \\"Message\\" ADD CONSTRAINT \\"Message_conversationId_fkey\\"\n    FOREIGN KEY (\\"conversationId\\") REFERENCES \\"Conversation\\"(\\"id\\") ON DELETE CASCADE ON UPDATE CASCADE","ALTER TABLE \\"Message\\" DROP CONSTRAINT IF EXISTS \\"Message_senderId_fkey\\"","ALTER TABLE \\"Message\\" ADD CONSTRAINT \\"Message_senderId_fkey\\"\n    FOREIGN KEY (\\"senderId\\") REFERENCES \\"User\\"(\\"id\\") ON DELETE RESTRICT ON UPDATE CASCADE","-- MessageAttachment foreign keys\nALTER TABLE \\"MessageAttachment\\" DROP CONSTRAINT IF EXISTS \\"MessageAttachment_messageId_fkey\\"","ALTER TABLE \\"MessageAttachment\\" ADD CONSTRAINT \\"MessageAttachment_messageId_fkey\\"\n    FOREIGN KEY (\\"messageId\\") REFERENCES \\"Message\\"(\\"id\\") ON DELETE CASCADE ON UPDATE CASCADE","-- Session foreign keys\nALTER TABLE \\"Session\\" DROP CONSTRAINT IF EXISTS \\"Session_userId_fkey\\"","ALTER TABLE \\"Session\\" ADD CONSTRAINT \\"Session_userId_fkey\\"\n    FOREIGN KEY (\\"userId\\") REFERENCES \\"User\\"(\\"id\\") ON DELETE CASCADE ON UPDATE CASCADE","-- ActivityLog foreign keys\nALTER TABLE \\"ActivityLog\\" DROP CONSTRAINT IF EXISTS \\"ActivityLog_userId_fkey\\"","ALTER TABLE \\"ActivityLog\\" ADD CONSTRAINT \\"ActivityLog_userId_fkey\\"\n    FOREIGN KEY (\\"userId\\") REFERENCES \\"User\\"(\\"id\\") ON DELETE SET NULL ON UPDATE CASCADE","-- UserPreferences foreign keys\nALTER TABLE \\"UserPreferences\\" DROP CONSTRAINT IF EXISTS \\"UserPreferences_userId_fkey\\"","ALTER TABLE \\"UserPreferences\\" ADD CONSTRAINT \\"UserPreferences_userId_fkey\\"\n    FOREIGN KEY (\\"userId\\") REFERENCES \\"User\\"(\\"id\\") ON DELETE CASCADE ON UPDATE CASCADE","-- Invoice foreign keys\nALTER TABLE \\"Invoice\\" DROP CONSTRAINT IF EXISTS \\"Invoice_bookingId_fkey\\"","ALTER TABLE \\"Invoice\\" ADD CONSTRAINT \\"Invoice_bookingId_fkey\\"\n    FOREIGN KEY (\\"bookingId\\") REFERENCES \\"Booking\\"(\\"id\\") ON DELETE SET NULL ON UPDATE CASCADE","ALTER TABLE \\"Invoice\\" DROP CONSTRAINT IF EXISTS \\"Invoice_customerId_fkey\\"","ALTER TABLE \\"Invoice\\" ADD CONSTRAINT \\"Invoice_customerId_fkey\\"\n    FOREIGN KEY (\\"customerId\\") REFERENCES \\"User\\"(\\"id\\") ON DELETE RESTRICT ON UPDATE CASCADE","-- Notification foreign keys\nALTER TABLE \\"Notification\\" DROP CONSTRAINT IF EXISTS \\"Notification_userId_fkey\\"","ALTER TABLE \\"Notification\\" ADD CONSTRAINT \\"Notification_userId_fkey\\"\n    FOREIGN KEY (\\"userId\\") REFERENCES \\"User\\"(\\"id\\") ON DELETE CASCADE ON UPDATE CASCADE","-- ============================================\n-- INSERT DEFAULT COMPANY SETTINGS\n-- ============================================\n\nINSERT INTO \\"CompanySettings\\" (\\"id\\", \\"companyName\\", \\"updatedAt\\")\nSELECT 'default', 'Gem Auto Rentals', CURRENT_TIMESTAMP\nWHERE NOT EXISTS (SELECT 1 FROM \\"CompanySettings\\" WHERE \\"id\\" = 'default')","-- ============================================\n-- DONE\n-- ============================================"}	crm_features
008	{"-- Migration: Add soft delete fields to core tables\n-- This migration adds deletedAt and deletedBy columns for soft delete functionality\n\n-- Add soft delete fields to User table\nALTER TABLE \\"User\\" ADD COLUMN IF NOT EXISTS \\"deletedAt\\" TIMESTAMP(3)","ALTER TABLE \\"User\\" ADD COLUMN IF NOT EXISTS \\"deletedBy\\" TEXT","-- Add soft delete fields to Vehicle table\nALTER TABLE \\"Vehicle\\" ADD COLUMN IF NOT EXISTS \\"deletedAt\\" TIMESTAMP(3)","ALTER TABLE \\"Vehicle\\" ADD COLUMN IF NOT EXISTS \\"deletedBy\\" TEXT","-- Add soft delete fields to Booking table\nALTER TABLE \\"Booking\\" ADD COLUMN IF NOT EXISTS \\"deletedAt\\" TIMESTAMP(3)","ALTER TABLE \\"Booking\\" ADD COLUMN IF NOT EXISTS \\"deletedBy\\" TEXT","-- Add soft delete fields to Document table\nALTER TABLE \\"Document\\" ADD COLUMN IF NOT EXISTS \\"deletedAt\\" TIMESTAMP(3)","ALTER TABLE \\"Document\\" ADD COLUMN IF NOT EXISTS \\"deletedBy\\" TEXT","-- Create indexes for soft delete fields\nCREATE INDEX IF NOT EXISTS \\"User_deletedAt_idx\\" ON \\"User\\"(\\"deletedAt\\")","CREATE INDEX IF NOT EXISTS \\"Vehicle_deletedAt_idx\\" ON \\"Vehicle\\"(\\"deletedAt\\")","CREATE INDEX IF NOT EXISTS \\"Booking_deletedAt_idx\\" ON \\"Booking\\"(\\"deletedAt\\")","CREATE INDEX IF NOT EXISTS \\"Document_deletedAt_idx\\" ON \\"Document\\"(\\"deletedAt\\")"}	soft_delete_fields
\.


ALTER TABLE supabase_migrations.schema_migrations ENABLE TRIGGER ALL;

--
-- Data for Name: secrets; Type: TABLE DATA; Schema: vault; Owner: -
--

ALTER TABLE vault.secrets DISABLE TRIGGER ALL;

COPY vault.secrets (id, name, description, secret, key_id, nonce, created_at, updated_at) FROM stdin;
\.


ALTER TABLE vault.secrets ENABLE TRIGGER ALL;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: -
--

SELECT pg_catalog.setval('auth.refresh_tokens_id_seq', 1, false);


--
-- Name: subscription_id_seq; Type: SEQUENCE SET; Schema: realtime; Owner: -
--

SELECT pg_catalog.setval('realtime.subscription_id_seq', 1, false);


--
-- PostgreSQL database dump complete
--

\unrestrict VGFUyAHtZm51EhBLffNg3Ab4ja8GxQXQbmgFJLEtxpVXeDrClr2AcRMfYVAb6e6

