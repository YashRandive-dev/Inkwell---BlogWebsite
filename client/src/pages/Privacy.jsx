import LegalLayout from '../components/common/LegalLayout';

const sections = [
  { id: 'collect', title: 'Information we collect', body: ['When you create an account we collect your name, email address and a securely hashed password. If you add a bio, avatar or social links, we store those too.', 'We also store the content you publish, your comments, likes and saved posts, and basic technical data such as page views so authors can see how their posts perform.'] },
  { id: 'use', title: 'How we use your information', body: ['We use your information to run Inkwell: to sign you in, verify your email with a one-time code, show your public author profile, send password reset and contact emails, and keep the service secure.', 'We do not sell your personal information.'] },
  { id: 'cookies', title: 'Cookies and sessions', body: ['We use a single httpOnly cookie to keep you signed in. It cannot be read by scripts on the page. Your theme preference is saved in your browser so the site remembers light or dark mode.'] },
  { id: 'sharing', title: 'Sharing and service providers', body: ['Images are stored with Cloudinary and the database is hosted with MongoDB Atlas. Emails are sent through an SMTP provider. These providers process data only to deliver the service.', 'Content you publish, and your public profile, is visible to anyone who visits the site.'] },
  { id: 'security', title: 'Data security', body: ['Passwords are hashed, verification codes expire after ten minutes, and login attempts are rate limited. No system is perfectly secure, so please use a strong, unique password.'] },
  { id: 'rights', title: 'Your choices', body: ['You can edit your profile at any time from your dashboard. To delete your account and associated content, contact us and we will process the request.'] },
  { id: 'changes', title: 'Changes to this policy', body: ['If we make important changes we will update the date above and, where appropriate, notify you by email or on the site.'] },
];

export default function Privacy() {
  return (
    <LegalLayout
      title="Privacy policy"
      crumb="Privacy"
      updated="October 2026"
      intro="Your privacy matters to us. This page explains what information Inkwell collects, how it is used and the choices you have. It is a general template and should be reviewed by a legal professional before you launch publicly."
      sections={sections}
    />
  );
}
