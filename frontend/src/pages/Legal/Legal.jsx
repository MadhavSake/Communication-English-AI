import React from 'react';
import { Link } from 'react-router-dom';
import { BUSINESS as B, isPlaceholder } from '../../legal/business';
import './Legal.css';

const V = ({ v }) => <span className={isPlaceholder(v) ? 'legal-todo' : undefined}>{v}</span>;

function Terms() {
  return (
    <>
      <h1>Terms and Conditions</h1>
      <p className="legal-date">Effective from {B.effectiveDate}</p>
      <p>
        These terms apply to your use of {B.brand} (the “Service”), operated by <V v={B.legalName} />
        {' '}(“we”, “us”). By creating an account or using the Service you agree to these terms.
      </p>
      <h2>1. The Service</h2>
      <p>
        {B.brand} is an online English-learning service with lessons, practice exercises and AI-based
        feedback on writing, speaking and conversation. AI feedback is generated automatically and may
        sometimes be inaccurate; it is meant for practice, not as a certified assessment.
      </p>
      <h2>2. Your account</h2>
      <ul>
        <li>You must give a valid email address and keep your password secure.</li>
        <li>You are responsible for activity on your account. One account is for one person.</li>
        <li>If you are under 18, use the Service with the consent of a parent or guardian.</li>
      </ul>
      <h2>3. Subscriptions and payments</h2>
      <ul>
        <li>Some features need a paid plan. The price and billing period are shown before you pay.</li>
        <li>Payments are processed securely by Razorpay. We do not see or store your card or UPI details.</li>
        <li>Paid plans renew automatically at the end of each period until you cancel.</li>
        <li>You can cancel any time; you keep access until the end of the period already paid for.</li>
        <li>Prices include or exclude applicable taxes (such as GST) as shown at checkout.</li>
        <li>Refunds follow our <Link to="/refund">Refund Policy</Link>.</li>
      </ul>
      <h2>4. Fair use</h2>
      <p>
        To keep the Service fast and affordable for everyone, AI features have daily usage limits. You
        agree not to misuse the Service — for example by automated requests, sharing accounts, trying to
        break security, or uploading unlawful or abusive content.
      </p>
      <h2>5. Content</h2>
      <p>
        Lessons and materials on {B.brand} belong to us or our licensors and are for your personal
        learning only. You keep ownership of what you write or record; you allow us to process it to
        give you feedback, as described in our <Link to="/privacy">Privacy Policy</Link>.
      </p>
      <h2>6. Availability and changes</h2>
      <p>
        We work to keep the Service available but cannot promise it will always be uninterrupted or
        error-free. We may update features or these terms; important changes will be shown in the app or
        sent by email.
      </p>
      <h2>7. Limitation of liability</h2>
      <p>
        To the extent allowed by law, our total liability for any claim relating to the Service is limited
        to the amount you paid us in the three months before the claim.
      </p>
      <h2>8. Termination</h2>
      <p>
        We may suspend or close accounts that break these terms. You can stop using the Service and ask us
        to delete your account at any time.
      </p>
      <h2>9. Governing law</h2>
      <p>
        These terms are governed by the laws of India. Courts at <V v={B.city} />, <V v={B.state} /> have
        jurisdiction over any dispute.
      </p>
      <h2>10. Contact</h2>
      <p>Questions? See our <Link to="/contact">Contact page</Link>.</p>
    </>
  );
}

function Privacy() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p className="legal-date">Effective from {B.effectiveDate}</p>
      <p>
        This policy explains what personal data {B.brand}, operated by <V v={B.legalName} />, collects and
        how we use it, in line with India's Digital Personal Data Protection Act, 2023 and the IT Act, 2000.
      </p>
      <h2>1. Data we collect</h2>
      <ul>
        <li><strong>Account:</strong> your email address and an encrypted password (handled by Firebase Authentication).</li>
        <li><strong>Learning data:</strong> your stage, lessons completed, quiz and practice scores, and activity dates.</li>
        <li><strong>Practice content:</strong> text you write, and audio you record, sent for AI feedback.</li>
        <li><strong>Payments:</strong> plan, payment status and dates from Razorpay. We never receive your full card or UPI details.</li>
        <li><strong>Technical:</strong> basic logs such as IP address and browser type, used for security and fair-use limits.</li>
      </ul>
      <h2>2. How we use it</h2>
      <ul>
        <li>To run your account, show your progress and personalise lessons to your stage.</li>
        <li>To generate AI feedback on your writing, speaking and conversation.</li>
        <li>To process subscriptions and send service emails (e.g. receipts, password reset).</li>
        <li>To keep the Service secure and prevent misuse.</li>
      </ul>
      <p>We do not sell your personal data and we do not use it for third-party advertising.</p>
      <h2>3. Service providers</h2>
      <p>
        We use trusted providers who process data on our behalf: Google Cloud and Firebase (hosting,
        login, database and AI feedback) and Razorpay (payments). Audio recordings are processed to
        create feedback and are not kept in your account history.
      </p>
      <h2>4. How long we keep data</h2>
      <p>
        We keep account and learning data while your account is active. When you delete your account we
        delete or anonymise your data within 30 days, except records we must keep by law (for example,
        payment records for tax purposes).
      </p>
      <h2>5. Your rights</h2>
      <p>
        You can ask to access, correct or delete your personal data, withdraw consent, or raise a
        grievance by writing to the Grievance Officer below. We respond within 30 days.
      </p>
      <h2>6. Security</h2>
      <p>
        Data is encrypted in transit (HTTPS) and stored with Google Cloud's security controls. Access is
        limited to what is needed to run the Service.
      </p>
      <h2>7. Children</h2>
      <p>
        If you are under 18, please use {B.brand} with the consent of a parent or guardian.
      </p>
      <h2>8. Grievance Officer</h2>
      <p>
        <V v={B.grievanceOfficer} /><br />
        Email: <V v={B.grievanceEmail} /><br />
        Address: <V v={B.address} />
      </p>
      <h2>9. Changes</h2>
      <p>We will post any changes to this policy here and update the effective date.</p>
    </>
  );
}

function Refund() {
  return (
    <>
      <h1>Cancellation and Refund Policy</h1>
      <p className="legal-date">Effective from {B.effectiveDate}</p>
      <h2>Cancellation</h2>
      <ul>
        <li>You can cancel your subscription at any time from your account or by emailing us.</li>
        <li>After cancelling, you keep access until the end of the period you already paid for. You will not be charged again.</li>
      </ul>
      <h2>Refunds</h2>
      <ul>
        <li>
          If you are not satisfied with your <strong>first</strong> paid subscription, you can ask for a full
          refund within <strong>{B.refundWindowDays} days</strong> of payment.
        </li>
        <li>Renewal payments are not refundable, but you can cancel to stop future renewals.</li>
        <li>If you were charged twice or charged by mistake, we refund the extra amount in full.</li>
        <li>Refunds are not given for accounts closed for misuse under our <Link to="/terms">Terms</Link>.</li>
      </ul>
      <h2>How refunds are paid</h2>
      <p>
        Approved refunds go back to the original payment method through Razorpay within
        {' '}{B.refundProcessingDays}. Your bank may take a few extra days to show it.
      </p>
      <h2>How to ask</h2>
      <p>
        Email <V v={B.email} /> from your registered email address with the payment date and the
        Razorpay payment ID from your receipt.
      </p>
    </>
  );
}

function Contact() {
  return (
    <>
      <h1>Contact Us</h1>
      <p>We are happy to help with your account, payments or learning.</p>
      <div className="legal-card">
        <div><strong>Business name:</strong> <V v={B.legalName} /></div>
        <div><strong>Email:</strong> <V v={B.email} /></div>
        <div><strong>Phone:</strong> <V v={B.phone} /></div>
        <div><strong>Address:</strong> <V v={B.address} /></div>
      </div>
      <p>We usually reply within 2 working days.</p>
      <h2>Grievance Officer</h2>
      <p>
        <V v={B.grievanceOfficer} /> — <V v={B.grievanceEmail} />
      </p>
    </>
  );
}

const PAGES = { terms: Terms, privacy: Privacy, refund: Refund, contact: Contact };

export function LegalLinks() {
  return (
    <nav className="legal-links" aria-label="Policies">
      <Link to="/terms">Terms</Link>
      <Link to="/privacy">Privacy</Link>
      <Link to="/refund">Refund</Link>
      <Link to="/contact">Contact</Link>
    </nav>
  );
}

export default function Legal({ page }) {
  const Page = PAGES[page] || Terms;
  return (
    <div className="legal-page">
      <header className="legal-header">
        <Link to="/" className="legal-brand">🗣️ {B.brand}</Link>
        <LegalLinks />
      </header>
      <article className="legal-body">
        <Page />
      </article>
      <footer className="legal-footer">© {new Date().getFullYear()} <V v={B.legalName} /></footer>
    </div>
  );
}
