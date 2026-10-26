import LegalLayout from '../components/common/LegalLayout';

const sections = [
  { id: 'accept', title: 'Accepting these terms', body: ['By creating an account or using Inkwell you agree to these terms. If you do not agree, please do not use the service.'] },
  { id: 'accounts', title: 'Your account', body: ['You must provide a valid email address and verify it with the code we send. You are responsible for keeping your password safe and for all activity on your account.'] },
  { id: 'content', title: 'Your content', body: ['You keep ownership of what you write. By publishing on Inkwell you give us a licence to display and distribute your content on the platform.', 'Only publish content you have the right to share. Do not post spam, hate speech, harassment, malware or anything illegal. We may remove content or suspend accounts that break these rules.'] },
  { id: 'conduct', title: 'Community conduct', body: ['Be respectful in comments. Do not impersonate others, attempt to access other accounts, or interfere with how the service works.'] },
  { id: 'availability', title: 'Service availability', body: ['We work hard to keep Inkwell running but we cannot guarantee uninterrupted access. Features may change over time.'] },
  { id: 'liability', title: 'Limitation of liability', body: ['Inkwell is provided as is, without warranties. To the extent permitted by law we are not liable for indirect or consequential losses arising from your use of the service.'] },
  { id: 'contact', title: 'Contact', body: ['If you have questions about these terms, use the contact page and we will respond as soon as we can. This text is a general template and should be reviewed by a legal professional before public launch.'] },
];

export default function Terms() {
  return (
    <LegalLayout
      title="Terms of service"
      crumb="Terms"
      updated="October 2026"
      intro="These terms describe the rules for using Inkwell. Please read them carefully; they are written in plain language."
      sections={sections}
    />
  );
}
