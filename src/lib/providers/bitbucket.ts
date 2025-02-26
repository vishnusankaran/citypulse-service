import { Bitbucket } from 'arctic';

const bitbucket = new Bitbucket(
  process.env.BITBUCKET_CLIENT_ID as string,
  process.env.BITBUCKET_CLIENT_SECRET as string,
  process.env.BITBUCKET_REDIRECT_URI as string
);

export default bitbucket;
