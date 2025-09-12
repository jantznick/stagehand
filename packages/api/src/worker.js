// Background worker for processing asynchronous jobs

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import * as fastcsv from 'fast-csv';
import { lookupVulnerability, validateVulnerabilityId } from './utils/vulnerabilityLookup.js';

const prisma = new PrismaClient();

async function processJob(job) {
  console.log(`Processing job ${job.id}...`);
  await prisma.bulkUploadJob.update({
    where: { id: job.id },
    data: { status: 'PROCESSING' },
  });

  const results = [];
  const errors = [];
  const errorReportPath = `uploads/error-report-${job.id}.csv`;

  fs.createReadStream(job.storedFilepath)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      let processedRows = 0;
      let failedRows = 0;

      try {
        for (const row of results) {
          try {
            const { vulnerabilityId, source = 'Bulk Upload', status = 'NEW', metadata = {} } = row;
            let vulnerability;

            if (validateVulnerabilityId(vulnerabilityId)) {
              vulnerability = await prisma.vulnerability.findUnique({ where: { vulnerabilityId } });
              if (!vulnerability) {
                const vulnData = await lookupVulnerability(vulnerabilityId);
                vulnerability = await prisma.vulnerability.create({ data: vulnData });
              }
            } else {
              vulnerability = await prisma.vulnerability.findUnique({ where: { vulnerabilityId } });
            }

            if (!vulnerability) {
              throw new Error(`Vulnerability with ID '${vulnerabilityId}' not found.`);
            }

            await prisma.finding.create({
              data: {
                projectId: job.projectId,
                source,
                status,
                vulnerabilityId: vulnerability.vulnerabilityId,
                metadata: {
                  ...metadata,
                  importedBy: job.initiatedById,
                  importDate: new Date().toISOString()
                }
              },
            });
            processedRows++;
          } catch (error) {
            failedRows++;
            errors.push({ ...row, error: error.message });
            console.error(`Failed to process row for vulnerability ${row.vulnerabilityId}:`, error.message);
          }
        }

        const updateData = {
          status: failedRows > 0 ? 'COMPLETED_WITH_ERRORS' : 'COMPLETED',
          processedRows,
          failedRows,
          completedAt: new Date(),
        };

        if (failedRows > 0) {
          const ws = fs.createWriteStream(errorReportPath);
          fastcsv.write(errors, { headers: true }).pipe(ws);
          updateData.errorReportPath = errorReportPath;
        }

        await prisma.bulkUploadJob.update({
          where: { id: job.id },
          data: updateData,
        });

        console.log(`Job ${job.id} completed. Processed: ${processedRows}, Failed: ${failedRows}`);

      } catch (error) {
        console.error(`Error processing job ${job.id}:`, error);
        await prisma.bulkUploadJob.update({
          where: { id: job.id },
          data: {
            status: 'FAILED',
            errorMessage: error.message,
          },
        });
      }
    });
}

async function pollForJobs() {
  console.log('Worker polling for new jobs...');
  try {
    const pendingJobs = await prisma.bulkUploadJob.findMany({
      where: { status: 'PENDING' },
    });

    if (pendingJobs.length > 0) {
      console.log(`Found ${pendingJobs.length} pending jobs.`);
      for (const job of pendingJobs) {
        await processJob(job);
      }
    }
  } catch (error) {
    console.error('Error polling for jobs:', error);
  }
}

function main() {
  console.log('Starting background worker...');
  // Run the job poller every 10 seconds
  setInterval(pollForJobs, 10000);
}

main();