import { authService } from '../services/authService';
import { validateEmailComprehensively } from '../utils/emailValidator';

async function testEmailValidationAndAuth() {
  console.log('\n--- 1. Testing Fake / Disposable Email Rejection ---');
  try {
    const check1 = await validateEmailComprehensively('testing_fake@mailinator.com');
    console.log('Disposable check result for mailinator.com:', {
      isDisposable: check1.isDisposable,
      error: check1.error,
    });

    const checkTemp = await validateEmailComprehensively('user@temp-mail.org');
    console.log('Disposable check result for temp-mail.org:', {
      isDisposable: checkTemp.isDisposable,
      error: checkTemp.error,
    });
  } catch (err: any) {
    console.error('Error in disposable test:', err);
  }

  console.log('\n--- 2. Testing Non-Existent Email Domain Rejection ---');
  try {
    const check2 = await validateEmailComprehensively('invalid@fake-random-domain-xyz-999999.org');
    console.log('Non-existent domain check result:', {
      hasValidMx: check2.hasValidMx,
      error: check2.error,
    });
  } catch (err: any) {
    console.error('Error in non-existent domain test:', err);
  }

  console.log('\n--- 3. Testing Valid Real Domain ---');
  try {
    const check3 = await validateEmailComprehensively('realuser@gmail.com');
    console.log('Valid email check result for gmail.com:', {
      isValidFormat: check3.isValidFormat,
      isDisposable: check3.isDisposable,
      hasValidMx: check3.hasValidMx,
    });
  } catch (err: any) {
    console.error('Error in valid email test:', err);
  }

  console.log('\n--- 4. Testing authService.checkEmail ---');
  try {
    const res1 = await authService.checkEmail('disposable@sharklasers.com', 'register');
    console.log('authService.checkEmail (disposable):', res1);

    const res2 = await authService.checkEmail('newuser@gmail.com', 'register');
    console.log('authService.checkEmail (valid new user):', res2);
  } catch (err: any) {
    console.error('Error in authService.checkEmail test:', err);
  }

  console.log('\n--- 5. Testing authService.register and login ---');
  try {
    const validEmail = `docuflow_test_${Date.now()}@gmail.com`;
    const regResult = await authService.register({
      name: 'Verified DocuFlow User',
      email: validEmail,
      password: 'StrongPassword123!',
    });
    console.log('✅ Registration SUCCESS:', {
      user: regResult.user.name,
      email: regResult.user.email,
      hasAccessToken: Boolean(regResult.accessToken),
    });

    const loginResult = await authService.login({
      email: validEmail,
      password: 'StrongPassword123!',
    });
    console.log('✅ Login SUCCESS:', {
      user: loginResult.user.name,
      email: loginResult.user.email,
      hasAccessToken: Boolean(loginResult.accessToken),
    });
  } catch (err: any) {
    console.error('Error in register/login test:', err);
  }
}

testEmailValidationAndAuth();
