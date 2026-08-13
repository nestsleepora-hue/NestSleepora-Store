import { sendOtpEmail } from '../lib/mailHelper.js';

console.log('Using EMAIL_USER:', process.env.EMAIL_USER);
console.log('Using EMAIL_PASS:', process.env.EMAIL_PASS ? '********' : 'undefined');

const test = async () => {
  console.log('Attempting to send test OTP email...');
  const success = await sendOtpEmail('mateen@itdepartment.com', '123456');
  console.log('Result:', success ? 'SUCCESS' : 'FAILED');
  process.exit(0);
};

test();
