import { GitLab } from 'arctic';

const gitlab = new GitLab(
  process.env.GITLAB_BASE_URL as string,
  process.env.GITLAB_CLIENT_ID as string,
  process.env.GITLAB_CLIENT_SECRET as string,
  process.env.GITLAB_REDIRECT_URI as string
);

export default gitlab;
