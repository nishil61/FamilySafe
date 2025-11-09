export function getFirebaseErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
      return 'Invalid email or password. If you don\'t have an account, please sign up first.';
    case 'auth/wrong-password':
      return 'Invalid password. Please try again.';
    case 'auth/email-already-in-use':
      return 'This email address is already in use by another account.';
    case 'auth/weak-password':
      return 'The password is too weak. Please use a stronger password.';
    case 'auth/requires-recent-login':
        return 'This operation is sensitive and requires recent authentication. Please log in again before retrying.'
    case 'auth/invalid-otp':
        return 'The OTP is invalid or expired. Please check the code and try again.'
    case 'auth/otp-expired':
        return 'The OTP has expired. Please request a new one.'
    case 'auth/user-not-verified':
        return 'User email not verified.'
    case 'auth/operation-not-allowed':
        return 'Email/Password sign-in is not enabled. Please enable it in your Firebase console under Authentication > Sign-in method.'
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}
