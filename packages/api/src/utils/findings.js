import { PrismaClient } from '@prisma/client';
import { Octokit } from 'octokit';
import { decrypt } from './crypto.js';

const prisma = new PrismaClient();

/**
 * Parses a GitHub repository URL to extract the owner and repo name.
 * @param {string} url - The full URL of the repository.
 * @returns {{owner: string, repo: string}|null}
 */
const parseRepoUrl = (url) => {
  if (!url) return null;
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.hostname !== 'github.com') return null;
    const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
    if (pathParts.length < 2) return null;
    const [owner, repo] = pathParts;
    return { owner, repo: repo.replace('.git', '') };
  } catch (error) {
    console.error('Invalid repository URL:', url, error);
    return null;
  }
};

/**
 * Fetches Dependabot alerts from a GitHub repository and upserts them into the database.
 * @param {string} integrationId - The ID of the SCMIntegration.
 * @param {string[]} projectIds - An array of project IDs to sync.
 */
export const syncGitHubFindings = async (integrationId, projectIds) => {
  const integration = await prisma.sCMIntegration.findUnique({
    where: { id: integrationId },
  });

  if (!integration || integration.provider !== 'GITHUB') {
    throw new Error('Valid GitHub integration not found.');
  }

  const accessToken = decrypt(integration.encryptedAccessToken);
  const octokit = new Octokit({ auth: accessToken });

  for (const projectId of projectIds) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { repositoryUrl: true },
    });

    if (!project || !project.repositoryUrl) {
      console.warn(`Project ${projectId} has no repositoryUrl, skipping sync.`);
      continue;
    }

    const repoInfo = parseRepoUrl(project.repositoryUrl);
    if (!repoInfo) {
      console.warn(`Could not parse repository URL for project ${projectId}, skipping.`);
      continue;
    }

    const { owner, repo } = repoInfo;

    try {
      const { data: alerts } = await octokit.request('GET /repos/{owner}/{repo}/dependabot/alerts', {
        owner,
        repo,
        state: 'open',
        per_page: 100,
      });

      for (const alert of alerts) {
        const { security_vulnerability, html_url, state, dependency, created_at, fixed_at } = alert;

        // 1. Upsert the Vulnerability
        const vulnerability = await prisma.vulnerability.upsert({
          where: {
            vulnerabilityId_source: {
              vulnerabilityId: security_vulnerability.advisory.ghsa_id,
              source: 'GITHUB',
            },
          },
          update: {
            title: security_vulnerability.advisory.summary,
            description: security_vulnerability.advisory.description,
            severity: security_vulnerability.severity.toUpperCase(),
            references: { urls: [html_url, ...security_vulnerability.advisory.references.map(ref => ref.url)] },
          },
          create: {
            vulnerabilityId: security_vulnerability.advisory.ghsa_id,
            source: 'GITHUB',
            title: security_vulnerability.advisory.summary,
            description: security_vulnerability.advisory.description,
            severity: security_vulnerability.severity.toUpperCase(),
            references: { urls: [html_url, ...security_vulnerability.advisory.references.map(ref => ref.url)] },
          },
        });

        // 2. Upsert the Finding
        await prisma.finding.upsert({
          where: {
            projectId_vulnerabilityId_source: {
                projectId: projectId,
                vulnerabilityId: vulnerability.vulnerabilityId,
                source: 'GITHUB'
            }
          },
          update: {
            lastSeenAt: new Date(),
            resolvedAt: state === 'fixed' ? fixed_at : null,
            status: state === 'fixed' ? 'RESOLVED' : 'NEW',
            metadata: {
              dependencyName: dependency.package.name,
              ecosystem: dependency.package.ecosystem,
              scope: dependency.scope,
              manifestPath: dependency.manifest_path,
            },
          },
          create: {
            project: { connect: { id: projectId } },
            vulnerability: { connect: { vulnerabilityId_source: { vulnerabilityId: vulnerability.vulnerabilityId, source: 'GITHUB' } } },
            source: 'GITHUB',
            status: state === 'fixed' ? 'RESOLVED' : 'NEW',
            firstSeenAt: created_at,
            resolvedAt: state === 'fixed' ? fixed_at : null,
            metadata: {
              dependencyName: dependency.package.name,
              ecosystem: dependency.package.ecosystem,
              scope: dependency.scope,
              manifestPath: dependency.manifest_path,
            },
          },
        });
      }
    } catch (error) {
      console.error(`Failed to sync findings for ${owner}/${repo}:`, error);
      // Continue to the next project
    }
  }
}; 