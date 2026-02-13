import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

const verifyInternalSecret = (req, res, next) => {
    const secret = req.get('X-Internal-Secret');
    if (!secret || secret !== process.env.INTERNAL_API_SECRET) {
        return res.status(403).json({ error: 'Forbidden: Invalid or missing internal secret.' });
    }
    next();
};

router.use(verifyInternalSecret);

router.post('/scans/:scanId/report', async (req, res) => {
    const { scanId } = req.params;
    const { provider, results, error } = req.body;

    console.log(`[${scanId}]: Received report from ${provider} scanner.`);

    try {
        if (error) {
            console.error(`[${scanId}]: The scanner reported an error: ${error}`);
            await prisma.scanExecution.update({
                where: { id: scanId },
                data: {
                    status: 'FAILED',
                    completedAt: new Date(),
                    errorMessage: error,
                },
            });
        } else {
            const scan = await prisma.scanExecution.findUnique({ where: { id: scanId } });
            if (!scan) {
                console.error(`[${scanId}]: Received a report for a non-existent scan.`);
                return res.status(404).json({ message: 'Scan ID not found.' });
            }

            for (const finding of results) {
                const vulnerabilityId = finding.check_id;
                await prisma.vulnerability.upsert({
                    where: { vulnerabilityId: vulnerabilityId },
                    update: {
                        title: finding.extra.message,
                        description: finding.extra.metadata.description || finding.extra.message,
                        severity: finding.extra.severity,
                        remediation: finding.extra.metadata.remediation,
                    },
                    create: {
                        vulnerabilityId: vulnerabilityId,
                        source: 'Semgrep',
                        title: finding.extra.message,
                        description: finding.extra.metadata.description || finding.extra.message,
                        severity: finding.extra.severity,
                        remediation: finding.extra.metadata.remediation,
                        references: { "semgrep-rule": finding.extra.metadata.source },
                    },
                });

                await prisma.finding.create({
                    data: {
                        projectId: scan.projectId,
                        vulnerabilityId: vulnerabilityId,
                        source: 'Semgrep',
                        status: 'NEW',
                        metadata: {
                            filePath: finding.path,
                            startLine: finding.start.line,
                            endLine: finding.end.line,
                            codeSnippet: finding.extra.lines,
                        },
                    }
                });
            }

            await prisma.scanExecution.update({
                where: { id: scanId },
                data: {
                    status: 'COMPLETED',
                    completedAt: new Date(),
                    findingsCount: results.length,
                },
            });

            console.log(`[${scanId}]: Successfully processed ${results.length} findings.`);
        }
        res.status(200).json({ message: 'Report received.' });
    } catch (dbError) {
        console.error(`[${scanId}]: Database error while processing report: ${dbError.message}`);
        res.status(500).json({ message: 'Internal server error while processing report.' });
    }
});

export default router;
