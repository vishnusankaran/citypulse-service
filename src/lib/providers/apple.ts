import { Apple } from 'arctic';
import * as encoding from '@oslojs/encoding';

const pemCertificate = '';
const pkcs8PrivateKey = encoding.decodeBase64IgnorePadding(
  pemCertificate
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replaceAll('\r', '')
    .replaceAll('\n', '')
    .trim()
);

const apple = new Apple(
  process.env.APPLE_CLIENT_ID as string,
  process.env.APPLE_TEAM_ID as string,
  process.env.APPLE_KEY_ID as string,
  pkcs8PrivateKey,
  process.env.APPLE_REDIRECT_URI as string
);

export default apple;
