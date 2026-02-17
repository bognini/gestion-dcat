import crypto from 'crypto';

const CAPTCHA_SECRET = process.env.CAPTCHA_SECRET || crypto.randomBytes(32).toString('hex');
const CAPTCHA_TTL = 5 * 60 * 1000; // 5 minutes

interface CaptchaChallenge {
  question: string;
  token: string;
}

export function generateCaptcha(): CaptchaChallenge {
  const ops = [
    () => {
      const a = Math.floor(Math.random() * 20) + 1;
      const b = Math.floor(Math.random() * 20) + 1;
      return { question: `${a} + ${b}`, answer: a + b };
    },
    () => {
      const a = Math.floor(Math.random() * 20) + 10;
      const b = Math.floor(Math.random() * 10) + 1;
      return { question: `${a} - ${b}`, answer: a - b };
    },
    () => {
      const a = Math.floor(Math.random() * 10) + 2;
      const b = Math.floor(Math.random() * 10) + 2;
      return { question: `${a} × ${b}`, answer: a * b };
    },
  ];

  const op = ops[Math.floor(Math.random() * ops.length)]();
  const expires = Date.now() + CAPTCHA_TTL;
  const payload = `${op.answer}:${expires}`;
  const signature = crypto.createHmac('sha256', CAPTCHA_SECRET).update(payload).digest('hex');
  const token = Buffer.from(JSON.stringify({ payload, signature })).toString('base64');

  return { question: `${op.question} = ?`, token };
}

export function verifyCaptcha(token: string, answer: string): { valid: boolean; error?: string } {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    const { payload, signature } = decoded;

    const expectedSig = crypto.createHmac('sha256', CAPTCHA_SECRET).update(payload).digest('hex');
    if (signature !== expectedSig) {
      return { valid: false, error: 'Captcha invalide' };
    }

    const [correctAnswer, expiresStr] = payload.split(':');
    if (Date.now() > parseInt(expiresStr)) {
      return { valid: false, error: 'Captcha expiré, veuillez réessayer' };
    }

    if (answer.trim() !== correctAnswer) {
      return { valid: false, error: 'Réponse incorrecte au captcha' };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Captcha invalide' };
  }
}
