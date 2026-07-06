const twilio = require('twilio');

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_API_KEY_SID,
  TWILIO_API_KEY_SECRET,
  TWILIO_VERIFY_SERVICE_SID,
  PHONE_COUNTRY_CODE = '+91',
  OTP_EXPIRY_SECONDS = '300',
} = process.env;

// ── Build Twilio client ──────────────────────────────────────────
// Uses API Key + Secret (safer than Auth Token — can be revoked individually)
function buildClient() {
  if (!TWILIO_ACCOUNT_SID || TWILIO_ACCOUNT_SID.startsWith('FILL_IN')) return null;
  if (!TWILIO_API_KEY_SID || !TWILIO_API_KEY_SECRET)                    return null;
  return twilio(TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET, {
    accountSid: TWILIO_ACCOUNT_SID,
  });
}

const twilioClient = buildClient();
const DEV_MODE = !twilioClient || !TWILIO_VERIFY_SERVICE_SID ||
                  TWILIO_VERIFY_SERVICE_SID.startsWith('FILL_IN');

if (DEV_MODE) {
  console.warn('⚠️  Twilio running in DEV MODE — OTPs logged to console, not sent via SMS.');
  console.warn('   Add TWILIO_ACCOUNT_SID + TWILIO_VERIFY_SERVICE_SID to .env to go live.');
}

// ── In-memory OTP store (dev mode only) ─────────────────────────
// In production, Twilio Verify handles storage — we don't store OTPs ourselves.
const devOtpStore = new Map(); // phone → { otp, expiresAt }

// ── Send OTP ────────────────────────────────────────────────────
async function sendOtp(phone) {
  const e164 = phone.startsWith('+') ? phone : `${PHONE_COUNTRY_CODE}${phone}`;

  if (DEV_MODE) {
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + parseInt(OTP_EXPIRY_SECONDS) * 1000;
    devOtpStore.set(e164, { otp, expiresAt });
    console.log(`\n📱 [DEV OTP] Phone: ${e164}  →  OTP: ${otp}  (expires in ${OTP_EXPIRY_SECONDS}s)\n`);
    return { success: true, devMode: true, message: 'OTP logged to server console (DEV MODE)' };
  }

  // Production: Twilio Verify
  const verification = await twilioClient.verify.v2
    .services(TWILIO_VERIFY_SERVICE_SID)
    .verifications.create({ to: e164, channel: 'sms' });

  return { success: true, devMode: false, sid: verification.sid, status: verification.status };
}

// ── Verify OTP ──────────────────────────────────────────────────
async function verifyOtp(phone, code) {
  const e164 = phone.startsWith('+') ? phone : `${PHONE_COUNTRY_CODE}${phone}`;

  if (DEV_MODE) {
    const record = devOtpStore.get(e164);
    if (!record)                        return { success: false, error: 'OTP not found or expired' };
    if (Date.now() > record.expiresAt)  { devOtpStore.delete(e164); return { success: false, error: 'OTP expired' }; }
    if (record.otp !== String(code))    return { success: false, error: 'Invalid OTP' };
    devOtpStore.delete(e164);
    return { success: true };
  }

  // Production: Twilio Verify Check
  const check = await twilioClient.verify.v2
    .services(TWILIO_VERIFY_SERVICE_SID)
    .verificationChecks.create({ to: e164, code: String(code) });

  if (check.status === 'approved') return { success: true };
  return { success: false, error: 'Invalid or expired OTP' };
}

module.exports = { sendOtp, verifyOtp, DEV_MODE };
