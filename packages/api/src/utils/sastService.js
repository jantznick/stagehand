const SEMGREP_SCANNER_URL = process.env.SEMGREP_SCANNER_URL; // e.g., 'http://semgrep-scanner:8080'

export const triggerSastScan = async (scanId, repositoryUrl) => {
    if (!SEMGREP_SCANNER_URL) {
        console.error('FATAL: SEMGREP_SCANNER_URL is not configured. Cannot trigger SAST scan.');
        // In a real scenario, we would update the scan status to FAILED here.
        return;
    }

    console.log(`[${scanId}]: Triggering semgrep-scanner for repository ${repositoryUrl}`);

    try {
        // We do not await this fetch call. The scanner will report back on its own.
        fetch(`${SEMGREP_SCANNER_URL}/scan`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                scanId,
                repositoryUrl,
            }),
        });
    } catch (error) {
        // This catch block will only handle errors in initiating the fetch call itself,
        // not errors in the response (since we are not awaiting it).
        console.error(`[${scanId}]: Failed to trigger semgrep-scanner. Error: ${error.message}`);
        // Here, we should update the ScanExecution status to 'FAILED'.
    }
};
