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
  console.log(`[GitHub Sync] Starting sync for integration ID: ${integrationId}`);
  let syncLog;
  let findingsAdded = 0;
  let findingsUpdated = 0;
  const syncedProjectNames = [];

  try {
    syncLog = await prisma.integrationSyncLog.create({
      data: {
        scmIntegrationId: integrationId,
        status: 'IN_PROGRESS',
        startTime: new Date(),
      }
    });

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
      console.log(`[GitHub Sync] Processing repository: ${owner}/${repo}`);
      syncedProjectNames.push(project.name);

      try {
        const { data: alerts } = await octokit.request('GET /repos/{owner}/{repo}/dependabot/alerts', {
          owner,
          repo,
          state: 'open',
          per_page: 100,
        });
        console.log(`[GitHub Sync] Found ${alerts.length} open alerts for ${owner}/${repo}.`);

        for (const alert of alerts) {
          const { security_advisory, html_url, state, dependency, created_at, fixed_at } = alert;
          
          if (!security_advisory) {
            console.warn(`Skipping alert with no security_advisory. URL: ${html_url}`);
            continue;
          }
        
          // 1. Upsert the Vulnerability
          const vulnerability = await prisma.vulnerability.upsert({
            where: {
              vulnerabilityId_source: {
                vulnerabilityId: security_advisory.ghsa_id,
                source: 'GitHub Dependabot',
              },
            },
            update: {
              title: security_advisory.summary,
              description: security_advisory.description,
              severity: security_advisory.severity.toUpperCase(),
              references: { urls: [html_url, ...security_advisory.references.map(ref => ref.url)] },
              type: 'SCA',
            },
            create: {
              vulnerabilityId: security_advisory.ghsa_id,
              source: 'GitHub Dependabot',
              type: 'SCA',
              title: security_advisory.summary,
              description: security_advisory.description,
              severity: security_advisory.severity.toUpperCase(),
              references: { urls: [html_url, ...security_advisory.references.map(ref => ref.url)] },
            },
          });
        
          // 2. Find or Create the Finding in a robust way
          const existingFinding = await prisma.finding.findUnique({
            where: {
              projectId_vulnerabilityId_source: {
                projectId: projectId,
                vulnerabilityId: vulnerability.vulnerabilityId,
                source: vulnerability.source
              }
            }
          });
        
          if (existingFinding) {
            // Update existing finding
            await prisma.finding.update({
              where: { id: existingFinding.id },
              data: {
                lastSeenAt: new Date(),
                resolvedAt: state === 'fixed' ? fixed_at : null,
                status: state === 'fixed' ? 'RESOLVED' : 'NEW',
                metadata: {
                  dependencyName: dependency?.package?.name,
                  ecosystem: dependency?.package?.ecosystem,
                  scope: dependency?.scope,
                  manifestPath: dependency?.manifest_path,
                },
              }
            });
            findingsUpdated++;
            console.log(`[GitHub Sync] Updated finding for vulnerability: ${vulnerability.vulnerabilityId}`);
          } else {
            // Create new finding
            await prisma.finding.create({
              data: {
                project: { connect: { id: projectId } },
                vulnerability: { connect: { vulnerabilityId_source: { vulnerabilityId: vulnerability.vulnerabilityId, source: 'GitHub Dependabot' } } },
                status: state === 'fixed' ? 'RESOLVED' : 'NEW',
                firstSeenAt: created_at,
                lastSeenAt: new Date(),
                resolvedAt: state === 'fixed' ? fixed_at : null,
                metadata: {
                  dependencyName: dependency?.package?.name,
                  ecosystem: dependency?.package?.ecosystem,
                  scope: dependency?.scope,
                  manifestPath: dependency?.manifest_path,
                },
              }
            });
            findingsAdded++;
            console.log(`[GitHub Sync] Created new finding for vulnerability: ${vulnerability.vulnerabilityId}`);
          }
        }
      } catch (error) {
        console.error(`Failed to sync findings for ${owner}/${repo}:`, error);
        // Continue to the next project
      }
    }

    await prisma.integrationSyncLog.update({
      where: { id: syncLog.id },
      data: {
        status: 'SUCCESS',
        endTime: new Date(),
        findingsAdded,
        findingsUpdated,
        syncedProjectsJson: syncedProjectNames,
      }
    });
    console.log(`[GitHub Sync] Successfully completed sync for integration ID: ${integrationId}. Added: ${findingsAdded}, Updated: ${findingsUpdated}.`);

  } catch (error) {
    console.error(`[GitHub Sync] Error during sync process for integration ${integrationId}:`, error);
    if (syncLog) {
      await prisma.integrationSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'FAILURE',
          endTime: new Date(),
          errorMessage: error.message,
        }
      });
    }
  }
};

/**
 * Fetches Snyk issues for linked projects and upserts them into the database.
 * @param {string} integrationId - The ID of the SecurityToolIntegration.
 * @param {string[]} projectIds - An array of project IDs to sync.
 */
export const syncSnykFindings = async (integrationId, projectIds) => {
  console.log(`[Snyk Sync] Starting sync for integration ID: ${integrationId}`);
  let syncLog;
  let findingsAdded = 0;
  let findingsUpdated = 0;
  const syncedProjectNames = [];

  try {
    syncLog = await prisma.integrationSyncLog.create({
      data: {
        securityToolIntegrationId: integrationId,
        status: 'IN_PROGRESS',
        startTime: new Date(),
      }
    });

    const integration = await prisma.securityToolIntegration.findUnique({ where: { id: integrationId } });
    if (!integration) throw new Error('SecurityToolIntegration not found.');

    const credentials = JSON.parse(decrypt(integration.encryptedCredentials));
    const { apiToken, orgId } = credentials;
    if (!apiToken || !orgId) throw new Error('Integration is missing API token or Organization ID.');

    for (const projectId of projectIds) {
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      const snykProjectId = project?.toolSpecificIds?.snyk;

      if (!project || !snykProjectId) {
        console.warn(`[Snyk Sync] Project ${projectId} is not linked to a Snyk project, skipping.`);
        continue;
      }
      console.log(`[Snyk Sync] Processing Snyk project ID: ${snykProjectId} for Stagehand project: ${project.name}`);
      syncedProjectNames.push(project.name);

      const snykIssuesUrl = `https://api.snyk.io/v1/org/${orgId}/project/${snykProjectId}/issues`;
      const snykResponse = await fetch(snykIssuesUrl, {
        method: 'POST', // Snyk API requires POST for filtering issues
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `token ${apiToken}`,
        },
        body: JSON.stringify({
            filters: {
                severities: ['critical', 'high', 'medium', 'low'],
                types: ['vuln'],
                ignored: false,
            }
        })
      });

      if (!snykResponse.ok) {
        const errorData = await snykResponse.json();
        throw new Error(`Snyk API error for project ${snykProjectId}: ${errorData.message || snykResponse.statusText}`);
      }

      const { issues } = await snykResponse.json();
      console.log(`[Snyk Sync] Found ${issues.length} issues for Snyk project ${snykProjectId}.`);

      for (const issue of issues) {
        const { id: snykIssueId, issueData, pkgName, version, isFixed, introducedDate } = issue;

        // 1. Upsert Vulnerability
        const vulnerability = await prisma.vulnerability.upsert({
            where: { vulnerabilityId_source: { vulnerabilityId: snykIssueId, source: 'Snyk' } },
            update: {
                title: issueData.title,
                description: issueData.description,
                severity: issueData.severity.toUpperCase(),
                remediation: issueData.remediation,
                references: { urls: (issueData.references || []).map(ref => ref.url) },
                type: 'SCA',
            },
            create: {
                vulnerabilityId: snykIssueId,
                source: 'Snyk',
                type: 'SCA',
                title: issueData.title,
                description: issueData.description,
                severity: issueData.severity.toUpperCase(),
                remediation: issueData.remediation,
                references: { urls: (issueData.references || []).map(ref => ref.url) },
            },
        });

        // 2. Find or Create the Finding
        const existingFinding = await prisma.finding.findUnique({
          where: {
            projectId_vulnerabilityId_source: {
              projectId: projectId,
              vulnerabilityId: vulnerability.vulnerabilityId,
              source: vulnerability.source
            }
          }
        });

        if (existingFinding) {
          await prisma.finding.update({
            where: { id: existingFinding.id },
            data: {
              lastSeenAt: new Date(),
              status: isFixed ? 'RESOLVED' : 'NEW',
              metadata: {
                dependencyName: pkgName,
                version: version,
              },
            }
          });
          findingsUpdated++;
          console.log(`[Snyk Sync] Updated finding for vulnerability: ${vulnerability.vulnerabilityId}`);
        } else {
          await prisma.finding.create({
            data: {
              project: { connect: { id: projectId } },
              vulnerability: { connect: { vulnerabilityId_source: { vulnerabilityId: vulnerability.vulnerabilityId, source: 'Snyk' } } },
              status: isFixed ? 'RESOLVED' : 'NEW',
              firstSeenAt: introducedDate,
              lastSeenAt: new Date(),
              metadata: {
                dependencyName: pkgName,
                version: version,
              },
            }
          });
          findingsAdded++;
          console.log(`[Snyk Sync] Created new finding for vulnerability: ${vulnerability.vulnerabilityId}`);
        }
      }
    }

    await prisma.integrationSyncLog.update({
      where: { id: syncLog.id },
      data: {
        status: 'SUCCESS',
        endTime: new Date(),
        findingsAdded,
        findingsUpdated,
        syncedProjectsJson: syncedProjectNames,
      }
    });
    console.log(`[Snyk Sync] Successfully completed sync for integration ID: ${integrationId}. Added: ${findingsAdded}, Updated: ${findingsUpdated}.`);

  } catch (error) {
    console.error(`[Snyk Sync] Error during sync process for integration ${integrationId}:`, error);
    if (syncLog) {
      await prisma.integrationSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'FAILURE',
          endTime: new Date(),
          errorMessage: error.message,
        }
      });
    }
  }
}; 