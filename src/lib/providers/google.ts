import { Google } from 'arctic';

const google = new Google(
  process.env.GITHUB_CLIENT_ID as string,
  process.env.GITHUB_CLIENT_SECRET as string,
  process.env.REDIRECT_URI as string
);

export default google;
