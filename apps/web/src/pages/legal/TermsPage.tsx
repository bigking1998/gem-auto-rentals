import LegalLayout, { LegalSection } from '@/components/layout/LegalLayout';
import { BUSINESS_NAME, CONTACT_EMAIL, PRIMARY_PHONE } from '@/lib/contact';

export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms of Service"
      description="The plain-language terms that apply when you rent a vehicle from Gem Auto Rentals."
      path="/terms"
      lastUpdated="2 August 2026"
    >
      <LegalSection heading="Who we are">
        <p>
          {BUSINESS_NAME} rents vehicles to customers in and around Mulberry, Florida. When this
          page says &ldquo;we&rdquo; or &ldquo;us&rdquo; it means {BUSINESS_NAME}. When it says
          &ldquo;you&rdquo; it means the person making the booking and, where relevant, anyone you
          have listed as an additional driver.
        </p>
      </LegalSection>

      <LegalSection heading="Who can rent">
        <p>To rent from us you need to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>be old enough to hold a valid licence in the state where you will be driving,</li>
          <li>hold a driver&rsquo;s licence that is current and not suspended,</li>
          <li>provide a payment method in your own name, and</li>
          <li>give us accurate information when you book.</li>
        </ul>
        <p>
          We may decline or cancel a booking if we cannot verify these things. If we decline before
          your rental starts, you do not pay.
        </p>
      </LegalSection>

      <LegalSection heading="Booking, prices and payment">
        <p>
          The price shown at checkout is the price we intend to charge for the dates and extras you
          selected. Taxes and fees are shown before you confirm. Nothing is charged until you
          confirm a booking.
        </p>
        <p>
          If something goes wrong on our side — the vehicle is not available, or a price was
          displayed incorrectly — we will tell you and refund you in full rather than quietly
          substituting something else.
        </p>
      </LegalSection>

      <LegalSection heading="Changes and cancellations">
        <p>
          Plans change. Contact us as early as you can and we will do what we reasonably can to move
          or cancel your booking. The specific cancellation window and any fee are shown with your
          booking and confirmed by email.
        </p>
        <p>
          We are still working out the exact published cancellation schedule. Until it is on this
          page in writing, we will not charge you a cancellation fee that was not disclosed to you
          at the time you booked.
        </p>
      </LegalSection>

      <LegalSection heading="Using the vehicle">
        <p>While the vehicle is with you, please:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>drive it legally, and let only approved drivers drive it,</li>
          <li>do not use it for racing, towing beyond its rating, or any unlawful purpose,</li>
          <li>do not smoke in it,</li>
          <li>keep it locked and secure, and</li>
          <li>return it at the agreed time and place, with the agreed fuel level.</li>
        </ul>
        <p>
          Tickets, tolls and parking fines incurred while the vehicle is in your care are yours to
          settle.
        </p>
      </LegalSection>

      <LegalSection heading="Damage, breakdowns and insurance">
        <p>
          Tell us as soon as possible if the vehicle is damaged, stolen, or stops working. Do not
          arrange your own repairs without talking to us first.
        </p>
        <p>
          Insurance and damage-waiver options, and what each one actually covers, are explained
          during booking and in your rental agreement. Your rental agreement is the document that
          governs coverage — this page only summarises it.
        </p>
      </LegalSection>

      <LegalSection heading="Your account">
        <p>
          You are responsible for keeping your login details private. Tell us straight away if you
          think someone else has access to your account.
        </p>
      </LegalSection>

      <LegalSection heading="What this page is not">
        <p>
          This is a plain-language summary written so that the consent checkbox at signup points at
          something real and readable. It is not a substitute for the rental agreement you sign when
          you collect a vehicle, and it has not yet been reviewed by a lawyer.
        </p>
        <p>
          Where this page and your signed rental agreement disagree, the signed rental agreement
          wins.
        </p>
      </LegalSection>

      <LegalSection heading="Changes to these terms">
        <p>
          When we update this page we will change the &ldquo;last updated&rdquo; date at the top. If
          a change materially affects a booking you have already made, we will contact you about it
          rather than relying on you to re-read this page.
        </p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>
          Questions, disputes, or anything that reads unfairly here: email {CONTACT_EMAIL} or call{' '}
          {PRIMARY_PHONE}. We would rather fix the wording than argue about it.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
