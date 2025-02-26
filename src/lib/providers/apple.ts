import { Apple } from 'arctic';
import * as encoding from '@oslojs/encoding';

const pemCertificate = `-----BEGIN PRIVATE KEY-----
TmV2ZXIgZ29ubmEgZ2l2ZSB5b3UgdXANCk5ldmVyIGdvbm5hIGxldCB5b3UgZG93bg0KTmV2ZXIgZ29ubmEgcnVuIGFyb3VuZCBhbmQgZGVzZXJ0IHlvdQ0KTmV2ZXIgZ29ubmEgbWFrZSB5b3UgY3J5DQpOZXZlciBnb25uYSBzYXkgZ29vZGJ5ZQ0KTmV2ZXIgZ29ubmEgdGVsbCBhIGxpZSBhbmQgaHVydCB5b3U
-----END PRIVATE KEY-----`;
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
