import { PrismaClient } from '@prisma/client';
import { Octokit } from 'octokit';
import { decrypt } from './crypto.js';
import { getTraceableVulnerabilities } from './traceable.js';
import { lookupExternalVulnerability } from './vulnerabilityLookup.js';

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
 * Synchronizes security findings from a Traceable integration for specified projects.
 * @param {string} integrationId - The ID of the SecurityToolIntegration for Traceable.
 * @param {string[]} projectIds - An array of project IDs to sync.
 */
export async function syncTraceableFindings(integrationId, projectIds) {
    console.log(`Starting Traceable sync for integration ${integrationId} and projects: ${projectIds.join(', ')}`);

    const integration = await prisma.securityToolIntegration.findUnique({
        where: { id: integrationId },
    });

    if (!integration || integration.provider !== 'Traceable') {
        console.error(`Traceable integration with ID ${integrationId} not found.`);
        return;
    }

    const credentials = JSON.parse(decrypt(integration.encryptedCredentials));

    for (const projectId of projectIds) {
        try {
            const project = await prisma.project.findUnique({ where: { id: projectId } });
            if (!project) {
                console.warn(`[Traceable Sync] Project with ID ${projectId} not found. Skipping.`);
                continue;
            }

            const traceableServiceId = project.toolSpecificIds?.traceableServiceId;
            if (!traceableServiceId) {
                console.warn(`[Traceable Sync] Project ${project.name} (${projectId}) is not linked to a Traceable service. Skipping.`);
                continue;
            }

            const findings = await getTraceableVulnerabilities(credentials, traceableServiceId);
            console.log(`[Traceable Sync] Found ${findings.length} findings for project ${project.name} (service ${traceableServiceId}).`);

            for (const finding of findings) {
                let vulnerabilityRecord;
                const source = 'TRACEABLE';

                if (finding.cve) {
                    // Enriched vulnerability via CVE
                    const enrichedData = await lookupExternalVulnerability(finding.cve);
                    if (enrichedData) {
                        vulnerabilityRecord = await prisma.vulnerability.upsert({
                            where: { vulnerabilityId_source: { vulnerabilityId: finding.cve, source } },
                            update: {
                                title: enrichedData.title,
                                description: enrichedData.description,
                                severity: enrichedData.severity,
                                cvssScore: enrichedData.cvssScore,
                                remediation: enrichedData.remediation,
                                references: enrichedData.references,
                                type: 'CVE',
                            },
                            create: {
                                vulnerabilityId: finding.cve,
                                source,
                                title: enrichedData.title,
                                description: enrichedData.description,
                                severity: enrichedData.severity,
                                cvssScore: enrichedData.cvssScore,
                                remediation: enrichedData.remediation,
                                references: enrichedData.references,
                                type: 'CVE',
                            },
                        });
                    }
                } 
                
                if (!vulnerabilityRecord) {
                    // Vulnerability from Traceable data (if no CVE or lookup failed)
                    const vulnerabilityId = finding.title.replace(/\s+/g, '-').toUpperCase(); // Create a stable ID
                    vulnerabilityRecord = await prisma.vulnerability.upsert({
                        where: { vulnerabilityId_source: { vulnerabilityId, source } },
                        update: {
                            title: finding.title,
                            description: finding.description || 'No description provided.',
                            severity: finding.severity.toUpperCase(),
                            remediation: finding.remediation,
                        },
                        create: {
                            vulnerabilityId,
                            source,
                            title: finding.title,
                            description: finding.description || 'No description provided.',
                            severity: finding.severity.toUpperCase(),
                            remediation: finding.remediation,
                            type: 'CUSTOM',
                        },
                    });
                }

                // Upsert the Finding record
                await prisma.finding.upsert({
                    where: {
                        projectId_vulnerabilityId_source: {
                            projectId,
                            vulnerabilityId: vulnerabilityRecord.vulnerabilityId,
                            source,
                        },
                    },
                    update: {
                        lastSeenAt: new Date(),
                        status: 'NEW', // Or logic to preserve status
                        metadata: {
                            traceableFindingId: finding.id,
                            threatCategory: finding.threat_category,
                            apiEndpointPath: finding.api_endpoint_path,
                            httpMethod: finding.http_method,
                        },
                    },
                    create: {
                        projectId,
                        vulnerabilityId: vulnerabilityRecord.vulnerabilityId,
                        source,
                        type: 'APISEC',
                        status: 'NEW',
                        metadata: {
                            traceableFindingId: finding.id,
                            threatCategory: finding.threat_category,
                            apiEndpointPath: finding.api_endpoint_path,
                            httpMethod: finding.http_method,
                        },
                    },
                });
            }
        } catch (error) {
            console.error(`[Traceable Sync] Failed to process project ${projectId}:`, error);
        }
    }
    console.log(`Finished Traceable sync for integration ${integrationId}.`);
}