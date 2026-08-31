import { authService } from '../services/authService';

async function testOtpRegistrationFlow() {
  console.log('\n=== Testing Real-Time Email OTP Registration Flow ===');

  const testEmail = `verified_user_${Date.now()}@gmail.com`;
  const testName = 'Verified Alex';
  const testPassword = 'SecurePassword123!';

  // Step 1: Send Registration OTP
  console.log('\n--- 1. Sending Registration OTP ---');
  try {
    const sendOtpRes = await authService.sendRegisterOTP({
      name: testName,
      email: testEmail,
      password: testPassword,
    });
    console.log('✅ sendRegisterOTP result:', sendOtpRes);
  } catch (err: any) {
    console.error('❌ sendRegisterOTP failed:', err);
  }

  // Step 2: Attempt registration with incorrect OTP
  console.log('\n--- 2. Attempting Registration with Wrong OTP ---');
  try {
    await authService.registerWithOTP({
      name: testName,
      email: testEmail,
      password: testPassword,
      otp: '000000',
    });
    console.log('❌ Wrong OTP registration unexpectedly succeeded!');
  } catch (err: any) {
    console.log('✅ Wrong OTP correctly rejected:', err.message);
  }

  // Step 3: Complete registration with valid test OTP
  console.log('\n--- 3. Completing Registration with Valid OTP ---');
  try {
    const regRes = await authService.registerWithOTP({
      name: testName,
      email: testEmail,
      password: testPassword,
      otp: '123456',
    });
    console.log('✅ Registration with OTP SUCCESS:', {
      user: regRes.user.name,
      email: regRes.user.email,
      emailVerified: regRes.user.emailVerified,
      hasAccessToken: Boolean(regRes.accessToken),
    });
  } catch (err: any) {
    console.error('❌ Registration with valid OTP failed:', err);
  }

  // Step 4: Login with newly registered user
  console.log('\n--- 4. Logging in with Verified Credentials ---');
  try {
    const loginRes = await authService.login({
      email: testEmail,
      password: testPassword,
    });
    console.log('✅ Login SUCCESS:', {
      user: loginRes.user.name,
      email: loginRes.user.email,
      hasAccessToken: Boolean(loginRes.accessToken),
    });
  } catch (err: any) {
    console.error('❌ Login failed:', err);
  }
}

testOtpRegistrationFlow();
