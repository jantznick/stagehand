const express = require('express');
const { exec } = require('child_process');
const fs = require('fs/promises');
const path = require('path');
const axios = require('axios');

const app = express();
const port = 8080;

// Configuration from environment variables
const STAGEHAND_API_URL = process.env.STAGEHAND_API_URL;
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET;

app.use(express.json());

// A map to store the status and data of running scans
const scanJobs = new Map();

// --- Helper Functions ---

/**
 * Executes a shell command and returns a promise.
 * @param {string} command The command to execute.
 * @param {object} options The options for exec.
 * @returns {Promise<{stdout: string, stderr: string}>}
 */
const execPromise = (command, options) => {
  return new Promise((resolve, reject) => {
    exec(command, options, (error, stdout, stderr) => {
      if (error) {
        return reject(error);
      }
      resolve({ stdout, stderr });
    });
  });
};

/**
 * The main function to run the entire scan process.
 * @param {string} repositoryUrl The URL of the git repository to scan.
 * @param {string} scanId The unique ID for this scan execution.
 */
const runScan = async (repositoryUrl, scanId) => {
  const tempDir = path.join(__dirname, 'scans', scanId);
  const resultsFile = path.join(tempDir, 'results.json');
  const repoDir = path.join(tempDir, 'repo');

  try {
    // 1. Update job status
    scanJobs.set(scanId, { status: 'RUNNING', repositoryUrl, startTime: new Date() });
    console.log(`[${scanId}]: Status RUNNING. Creating temp directory: ${tempDir}`);
    await fs.mkdir(tempDir, { recursive: true });

    // 2. Clone the repository
    console.log(`[${scanId}]: Cloning ${repositoryUrl}...`);
    await execPromise(`git clone ${repositoryUrl} ${repoDir}`, {});
    console.log(`[${scanId}]: Clone successful.`);

    // 3. Run Semgrep scan
    console.log(`[${scanId}]: Running Semgrep...`);
    // This uses a recommended configuration for general-purpose scanning.
    // The output is piped to a JSON file.
    await execPromise(
      `semgrep --config "p/default" --json -o ${resultsFile}`,
      { cwd: repoDir }
    );
    console.log(`[${scanId}]: Semgrep scan completed.`);

    // 4. Read the results
    const results = JSON.parse(await fs.readFile(resultsFile, 'utf-8'));
    console.log(`[${scanId}]: Found ${results.results.length} findings.`);

    // 5. Send results back to the main API (callback)
    console.log(`[${scanId}]: Sending results to main API...`);
    await axios.post(`${STAGEHAND_API_URL}/api/v1/internal/scans/${scanId}/report`,
      {
        provider: 'Semgrep',
        results: results.results,
      },
      {
        headers: { 'X-Internal-Secret': INTERNAL_API_SECRET },
      }
    );
    console.log(`[${scanId}]: Callback successful.`);

    // 6. Update final job status
    scanJobs.set(scanId, { ...scanJobs.get(scanId), status: 'COMPLETED', endTime: new Date(), findingCount: results.results.length });

  } catch (error) {
    console.error(`[${scanId}]: ERROR - ${error.message}`);
    scanJobs.set(scanId, { ...scanJobs.get(scanId), status: 'FAILED', endTime: new Date(), error: error.message });
    
    // Attempt to notify the main API of the failure
    try {
        await axios.post(`${STAGEHAND_API_URL}/api/v1/internal/scans/${scanId}/report`,
            { provider: 'Semgrep', error: error.message },
            { headers: { 'X-Internal-Secret': INTERNAL_API_SECRET } }
        );
    } catch (callbackError) {
        console.error(`[${scanId}]: ERROR - Failed to send failure report to main API. ${callbackError.message}`);
    }

  } finally {
    // 7. Cleanup
    console.log(`[${scanId}]: Cleaning up directory ${tempDir}...`);
    await fs.rm(tempDir, { recursive: true, force: true });
    console.log(`[${scanId}]: Cleanup complete.`);
  }
};


// --- API Endpoints ---

app.post('/scan', (req, res) => {
  const { repositoryUrl, scanId } = req.body;

  if (!repositoryUrl || !scanId) {
    return res.status(400).json({ error: 'repositoryUrl and scanId are required' });
  }

  // Basic validation to prevent duplicate jobs
  if (scanJobs.has(scanId) && scanJobs.get(scanId).status !== 'FAILED') {
      return res.status(409).json({ message: 'Scan with this ID is already in progress.', scanId });
  }

  console.log(`[${scanId}]: Scan request received for ${repositoryUrl}`);
  scanJobs.set(scanId, { status: 'QUEUED', repositoryUrl });

  // Don't await this call. This is the "fire and forget" part.
  runScan(repositoryUrl, scanId);

  res.status(202).json({ message: 'Scan queued successfully', scanId });
});

app.get('/scan/:scanId', (req, res) => {
    const { scanId } = req.params;
    const job = scanJobs.get(scanId);

    if (!job) {
        return res.status(404).json({ error: 'Scan job not found' });
    }

    res.status(200).json(job);
});


app.listen(port, () => {
  console.log(`Semgrep scanner service listening on port ${port}`);
  if (!STAGEHAND_API_URL || !INTERNAL_API_SECRET) {
      console.error("FATAL: STAGEHAND_API_URL and INTERNAL_API_SECRET environment variables are required.");
      process.exit(1);
  }
});
