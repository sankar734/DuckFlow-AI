import dns from 'dns';
import { promisify } from 'util';

const resolveMx = promisify(dns.resolveMx);
const resolveA = promisify(dns.resolve4);

// Comprehensive list of known disposable, temporary, and fake email domains
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'tempmail.com',
  'temp-mail.org',
  '10minutemail.com',
  '10minutemail.net',
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'sharklasers.com',
  'grr.la',
  'guerrillamail.biz',
  'guerrillamailblock.com',
  'pokemail.net',
  'spam4.me',
  'yopmail.com',
  'yopmail.fr',
  'yopmail.net',
  'cool.fr.nf',
  'jetable.fr.nf',
  'courriel.fr.nf',
  'moncourrier.fr.nf',
  'monemail.fr.nf',
  'monmail.fr.nf',
  'trashmail.com',
  'trashmail.me',
  'trashmail.net',
  'throwawaymail.com',
  'getairmail.com',
  'fakeinbox.com',
  'dispostable.com',
  'mailnesia.com',
  'emailondeck.com',
  'mytrashmail.com',
  'maildrop.cc',
  'inboxkitten.com',
  'mohmal.com',
  'crazymailing.com',
  'generator.email',
  'burnermail.io',
  'tempail.com',
  'fakemailgenerator.com',
  'dropmail.me',
  'mytemp.email',
  'tempinbox.com',
  'discard.email',
  'discardmail.com',
  'spambog.com',
  'nada.ltd',
  'getnada.com',
  'inboxbear.com',
  'harakirimail.com',
  'tempr.email',
  'trash-mail.at',
  'wegwerfmail.de',
  'wegwerfmail.net',
  'wegwerfmail.org',
  'instantemailaddress.com',
  'emailfake.com',
  'emkei.cz',
  'anonymouse.org',
  'mintemail.com',
  'mailcatch.com',
  'tmailor.com',
  'internxt.com/temporary-email',
  'minuteinbox.com',
  'privatemail.com',
  'temp-mail.io',
  'guerrillamail.de',
  'binkmail.com',
  'safetymail.info',
  'filzmail.com',
  'trashymail.com',
  'fakemail.net',
  'mailsac.com',
  'armyspy.com',
  'cuvox.de',
  'dayrep.com',
  'fleckens.hu',
  'gustr.com',
  'jourrapide.com',
  'rhyta.com',
  'superrito.com',
  'teleworm.us',
  'tinypaste.com',
  'mailforspam.com',
]);

export interface EmailValidationResult {
  isValidFormat: boolean;
  isDisposable: boolean;
  hasValidMx: boolean;
  domain: string;
  error?: string;
}

/**
 * Validate email format using RFC 5322 compliant regex
 */
export function validateEmailFormat(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length > 254) return false;

  // Strict email syntax regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(trimmed)) return false;

  const parts = trimmed.split('@');
  if (parts.length !== 2) return false;

  const [localPart, domain] = parts;
  if (localPart.length > 64 || domain.length > 255) return false;
  if (domain.indexOf('.') === -1) return false;

  const tld = domain.split('.').pop();
  if (!tld || tld.length < 2) return false;

  return true;
}

/**
 * Check if the domain belongs to a known disposable / fake email provider
 */
export function isDisposableEmail(email: string): boolean {
  if (!email || !email.includes('@')) return false;
  const domain = email.split('@')[1].toLowerCase().trim();
  
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return true;
  }

  // Check subdomains
  const domainParts = domain.split('.');
  if (domainParts.length > 2) {
    const rootDomain = domainParts.slice(-2).join('.');
    if (DISPOSABLE_DOMAINS.has(rootDomain)) {
      return true;
    }
  }

  // Catch typical disposable keywords in domain
  const disposableKeywords = ['tempmail', 'trashmail', 'disposable', 'guerrillamail', 'fakeemail', '10minmail', 'throwaway', 'fakemail'];
  for (const keyword of disposableKeywords) {
    if (domain.includes(keyword)) {
      return true;
    }
  }

  return false;
}

/**
 * Check whether the domain has valid DNS MX or A records to receive email
 */
export async function verifyDomainMx(domain: string, timeoutMs: number = 3000): Promise<boolean> {
  const cleanDomain = domain.toLowerCase().trim();

  // Quick check for popular verified email domains to speed up verification
  const popularDomains = new Set([
    'gmail.com',
    'googlemail.com',
    'yahoo.com',
    'yahoo.co.in',
    'yahoo.co.uk',
    'outlook.com',
    'hotmail.com',
    'live.com',
    'msn.com',
    'icloud.com',
    'me.com',
    'mac.com',
    'aol.com',
    'zoho.com',
    'proton.me',
    'protonmail.com',
    'mail.com',
    'gmx.com',
    'yandex.com',
  ]);

  if (popularDomains.has(cleanDomain)) {
    return true;
  }

  const dnsPromise = async () => {
    try {
      const mxRecords = await resolveMx(cleanDomain);
      if (mxRecords && mxRecords.length > 0) {
        return true;
      }
    } catch {
      // If MX lookup fails, check A record fallback
      try {
        const aRecords = await resolveA(cleanDomain);
        if (aRecords && aRecords.length > 0) {
          return true;
        }
      } catch {
        return false;
      }
    }
    return false;
  };

  // Timeout guard so slow DNS doesn't hang
  const timeoutPromise = new Promise<boolean>((resolve) => {
    setTimeout(() => resolve(true), timeoutMs); // fallback to true on network timeout
  });

  try {
    return await Promise.race([dnsPromise(), timeoutPromise]);
  } catch {
    return true;
  }
}

/**
 * Complete email check (Format + Disposable Check + DNS MX Verification)
 */
export async function validateEmailComprehensively(email: string): Promise<EmailValidationResult> {
  const trimmed = (email || '').trim().toLowerCase();

  if (!validateEmailFormat(trimmed)) {
    return {
      isValidFormat: false,
      isDisposable: false,
      hasValidMx: false,
      domain: '',
      error: 'Please enter a valid email format (e.g. name@domain.com).',
    };
  }

  const domain = trimmed.split('@')[1];

  if (isDisposableEmail(trimmed)) {
    return {
      isValidFormat: true,
      isDisposable: true,
      hasValidMx: false,
      domain,
      error: 'Temporary and disposable email addresses are not allowed. Please use your genuine email.',
    };
  }

  const hasValidMx = await verifyDomainMx(domain);
  if (!hasValidMx) {
    return {
      isValidFormat: true,
      isDisposable: false,
      hasValidMx: false,
      domain,
      error: `The domain "@${domain}" does not exist or has no active mail server. Please check spelling.`,
    };
  }

  return {
    isValidFormat: true,
    isDisposable: false,
    hasValidMx: true,
    domain,
  };
}
