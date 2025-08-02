const { decrypt } = require('./crypto');
const { addTechnologyToProject } = require('./technologies');

/**
 * Fetches the content of a file from a GitHub repository.
 *
 * @param {string} owner - The owner of the repository.
 * @param {string} repo - The name of the repository.
 * @param {string} path - The path to the file in the repository.
 * @param {string} accessToken - The GitHub access token.
 * @returns {Promise<string|null>} The content of the file, or null if not found.
 */
async function getFileContent(owner, repo, path, accessToken) {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `token ${accessToken}`,
                'Accept': 'application/vnd.github.v3.raw', // Request raw content
            },
        });

        if (response.status === 404) {
            console.log(`File not found: ${path} in ${owner}/${repo}`);
            return null; // File not found is a valid case
        }

        if (!response.ok) {
            const errorData = await response.text();
            console.error(`GitHub API error fetching file content for ${owner}/${repo}/${path}:`, response.status, errorData);
            throw new Error(`Failed to fetch file content from GitHub: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Error fetching file content from ${url}:`, error);
        // Re-throw to be handled by the caller
        throw error;
    }
}


/**
 * Parses package.json content and adds dependencies as technologies to the project.
 *
 * @param {string} projectId - The ID of the project.
 * @param {string} content - The string content of package.json.
 */
async function processPackageJson(projectId, content) {
    if (!content) return;

    try {
        const packageJson = JSON.parse(content);
        const dependencies = packageJson.dependencies || {};
        const devDependencies = packageJson.devDependencies || {};

        const allDependencies = { ...dependencies, ...devDependencies };
        
        for (const [name, version] of Object.entries(allDependencies)) {
            try {
                await addTechnologyToProject(projectId, {
                    name,
                    version,
                    type: 'library', // Assuming 'library' type for NPM packages
                    source: 'github-package.json',
                });
            } catch (error) {
                // Log and continue if a single technology fails to be added
                console.error(`Failed to add technology ${name}@${version} to project ${projectId}:`, error.message);
            }
        }
    } catch (error) {
        console.error('Error parsing package.json or adding technologies:', error);
    }
}


/**
 * Scans a repository for technology files (e.g., package.json) and adds
 * them to the project.
 *
 * @param {string} projectId - The ID of the project.
 * @param {string} repositoryUrl - The URL of the GitHub repository.
 * @param {object} integration - The SCM integration object.
 */
async function scanRepositoryForTechnologies(projectId, repositoryUrl, integration) {
    if (!repositoryUrl || !integration) {
        console.warn(`Skipping technology scan for project ${projectId} due to missing repository URL or integration.`);
        return;
    }

    try {
        const accessToken = decrypt(integration.encryptedAccessToken);

        // Extract owner/repo from URL
        const url = new URL(repositoryUrl);
        const [_, owner, repoName] = url.pathname.split('/');
        const repo = repoName.replace('.git', '');

        if (url.hostname !== 'github.com' || !owner || !repo) {
            console.error('Invalid GitHub URL:', repositoryUrl);
            return;
        }

        // Add more scanners here in the future, e.g., for requirements.txt
        const fileScanners = {
            'package.json': processPackageJson,
        };

        for (const [filePath, processor] of Object.entries(fileScanners)) {
            const content = await getFileContent(owner, repo, filePath, accessToken);
            if (content) {
                await processor(projectId, content);
            }
        }
    } catch (error) {
        console.error(`Error scanning repository for project ${projectId}:`, error);
        // We don't want to fail the entire link-repo request if scanning fails
    }
}

module.exports = { scanRepositoryForTechnologies, getFileContent, processPackageJson };
