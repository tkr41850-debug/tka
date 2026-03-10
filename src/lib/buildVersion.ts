import packageJson from '../../package.json';

type BuildEnv = ImportMetaEnv & {
  readonly VITE_GIT_COMMIT_SHA?: string;
  readonly VITE_GITHUB_RUN_NUMBER?: string;
};

const env = import.meta.env as BuildEnv;
const shortCommitSha = env.VITE_GIT_COMMIT_SHA?.slice(0, 7);
const runNumber = env.VITE_GITHUB_RUN_NUMBER;
const version = packageJson.version;

const label = shortCommitSha ? `v${version} ${shortCommitSha}` : `v${version} local`;
const detail = shortCommitSha
  ? runNumber
    ? `Build ${runNumber} from ${shortCommitSha}`
    : `Commit ${shortCommitSha}`
  : 'Local preview build';

export const buildVersion = {
  detail,
  label,
  version,
};
