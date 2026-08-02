import LegalLayout, { LegalSection } from '@/components/layout/LegalLayout';
import { BUSINESS_NAME, CONTACT_EMAIL, PRIMARY_PHONE } from '@/lib/contact';

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      description="What personal information Gem Car Rentals collects, why we collect it, and what we do with it."
      path="/privacy"
      lastUpdated="2 August 2026"
    >
      <LegalSection heading="The short version">
        <p>
          We collect the information we need to rent you a vehicle and to get paid for it. We do not
          sell your personal information. We do not share it with anyone except the companies that
          help us actually run the rental — payment processing, for example.
        </p>
      </LegalSection>

      <LegalSection heading="What we collect">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Account details</strong> — your name, email address and phone number, so we can
            identify you and contact you about a booking.
          </li>
          <li>
            <strong>Booking details</strong> — the vehicle, dates, pickup and drop-off locations,
            and any extras you chose.
          </li>
          <li>
            <strong>Driver verification</strong> — driver&rsquo;s licence details, because we are
            not allowed to hand over a vehicle without checking them.
          </li>
          <li>
            <strong>Payment details</strong> — handled by our payment processor. Full card numbers
            are entered directly into the processor&rsquo;s form and are never stored on our
            servers.
          </li>
          <li>
            <strong>Basic technical data</strong> — the kind of thing every web server records, such
            as which pages were requested and when, used to keep the site working and secure.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="Why we collect it">
        <p>
          To take and fulfil your booking, to verify that you are legally able to drive the vehicle,
          to take payment, to contact you about your rental, and to meet our legal and insurance
          obligations. That is the whole list.
        </p>
      </LegalSection>

      <LegalSection heading="Who we share it with">
        <p>
          Only the service providers we need in order to operate: our payment processor, and the
          hosting and email providers that run this website. Each of them sees only what they need
          for their part of the job.
        </p>
        <p>
          We may also disclose information where the law requires it — for example a valid court
          order, or an insurance or accident investigation involving one of our vehicles.
        </p>
        <p>
          <strong>We do not sell your personal information, and we do not rent or trade it.</strong>
        </p>
      </LegalSection>

      <LegalSection heading="How long we keep it">
        <p>
          Booking and payment records are kept for as long as tax, accounting and insurance rules
          require. Account information is kept while your account is open. Ask us to close your
          account and we will remove what we are not legally required to retain.
        </p>
      </LegalSection>

      <LegalSection heading="Your choices">
        <ul className="list-disc space-y-1 pl-5">
          <li>Ask us what we hold about you.</li>
          <li>Ask us to correct anything that is wrong.</li>
          <li>Ask us to delete your account and the data we are not required to keep.</li>
          <li>Ask us to stop sending you marketing email — that one is always immediate.</li>
        </ul>
        <p>Email {CONTACT_EMAIL} and a person will handle it.</p>
      </LegalSection>

      <LegalSection heading="Cookies and similar technology">
        <p>
          This site stores a small amount of data in your browser so that you stay signed in and so
          that a half-finished booking is still there when you come back. That is functional, not
          advertising.
        </p>
      </LegalSection>

      <LegalSection heading="Security">
        <p>
          Traffic to this site is encrypted, passwords are stored hashed rather than in plain text,
          and card details go straight to our payment processor. No system is perfect; if we ever
          discover a breach that affects you, we will tell you rather than hope you do not notice.
        </p>
      </LegalSection>

      <LegalSection heading="Children">
        <p>
          This service is for adults who can legally rent a vehicle. We do not knowingly collect
          information from children.
        </p>
      </LegalSection>

      <LegalSection heading="What this page is not">
        <p>
          This is a plain-language description of {BUSINESS_NAME}&rsquo;s actual practice, written
          so that the consent checkbox at signup points at something real. It has not yet been
          reviewed by a lawyer and does not attempt to enumerate every statutory right you may have
          under Florida or federal law.
        </p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>
          Privacy questions or requests: email {CONTACT_EMAIL} or call {PRIMARY_PHONE}.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
