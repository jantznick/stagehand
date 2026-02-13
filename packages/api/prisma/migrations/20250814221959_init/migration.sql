-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'EDITOR', 'READER');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED');

-- CreateEnum
CREATE TYPE "DeploymentStatus" AS ENUM ('PLANNING', 'IN_DEVELOPMENT', 'TESTING', 'RELEASED', 'MAINTENANCE', 'DISCONTINUED');

-- CreateEnum
CREATE TYPE "TechnologyType" AS ENUM ('LANGUAGE', 'FRAMEWORK', 'LIBRARY', 'TOOL', 'PLATFORM', 'SERVICE');

-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('SERVICE', 'LIBRARY', 'FRONTEND_APP', 'BACKEND_APP', 'MOBILE_APP', 'OWNED_HARDWARE', 'CLOUD_HARDWARE', 'EXTERNAL_BOUGHT_SOFTWARE', 'CLI_TOOL', 'OTHER');

-- CreateEnum
CREATE TYPE "DataClassification" AS ENUM ('PUBLIC', 'INTERNAL', 'SENSITIVE', 'RESTRICTED');

-- CreateEnum
CREATE TYPE "ApplicationCriticality" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "SCMProvider" AS ENUM ('GITHUB', 'BITBUCKET', 'AZURE_DEVOPS');

-- CreateEnum
CREATE TYPE "SecurityToolType" AS ENUM ('SAST', 'DAST', 'SCA', 'APISEC');

-- CreateEnum
CREATE TYPE "DastScanType" AS ENUM ('ACTIVE', 'PASSIVE', 'BASELINE', 'FULL', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ScanStatus" AS ENUM ('PENDING', 'QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED', 'IMPORTED');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "FindingStatus" AS ENUM ('NEW', 'TRIAGED', 'IN_PROGRESS', 'RESOLVED', 'IGNORED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "verificationTokenExpiresAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sid" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "oIDCConfigurationId" TEXT,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "accountType" TEXT NOT NULL DEFAULT 'STANDARD',
    "hierarchyDisplayNames" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "defaultCompanyId" TEXT,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "teamId" TEXT NOT NULL,
    "applicationUrl" TEXT,
    "version" TEXT,
    "deploymentStatus" "DeploymentStatus" NOT NULL DEFAULT 'IN_DEVELOPMENT',
    "dastScanEnabled" BOOLEAN DEFAULT false,
    "lastDastScanDate" TIMESTAMP(3),
    "dastScanSettings" JSONB,
    "repositoryUrl" TEXT,
    "ciCdPipelineUrl" TEXT,
    "lastScanDate" TIMESTAMP(3),
    "projectType" "ProjectType",
    "dataClassification" "DataClassification",
    "applicationCriticality" "ApplicationCriticality",
    "isExternallyExposed" BOOLEAN DEFAULT false,
    "communicationChannel" TEXT,
    "documentationUrl" TEXT,
    "apiReferenceUrl" TEXT,
    "runbookUrl" TEXT,
    "threatModelUrl" TEXT,
    "lastSecurityReview" TIMESTAMP(3),
    "scmIntegrationId" TEXT,
    "securityToolIntegrationId" TEXT,
    "toolSpecificIds" JSONB DEFAULT '{}',

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectRelationship" (
    "id" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "sourceProjectId" TEXT NOT NULL,
    "targetProjectId" TEXT NOT NULL,

    CONSTRAINT "ProjectRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT,
    "companyId" TEXT,
    "teamId" TEXT,
    "projectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT,
    "userId" TEXT,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectContact" (
    "projectId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "contactType" TEXT NOT NULL,

    CONSTRAINT "ProjectContact_pkey" PRIMARY KEY ("projectId","contactId","contactType")
);

-- CreateTable
CREATE TABLE "Technology" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TechnologyType" NOT NULL,

    CONSTRAINT "Technology_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectTechnology" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "technologyId" TEXT NOT NULL,
    "version" TEXT,
    "source" TEXT NOT NULL,

    CONSTRAINT "ProjectTechnology_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectDependency" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "technologyId" TEXT,

    CONSTRAINT "ProjectDependency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutoJoinDomain" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verificationCode" TEXT NOT NULL,
    "organizationId" TEXT,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT,

    CONSTRAINT "AutoJoinDomain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OIDCConfiguration" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "issuer" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "clientSecret" TEXT NOT NULL,
    "authorizationUrl" TEXT NOT NULL,
    "tokenUrl" TEXT NOT NULL,
    "userInfoUrl" TEXT NOT NULL,
    "defaultRole" "Role" NOT NULL DEFAULT 'READER',
    "buttonText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OIDCConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "selector" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "LoginToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SCMIntegration" (
    "id" TEXT NOT NULL,
    "provider" "SCMProvider" NOT NULL,
    "displayName" TEXT,
    "installationId" TEXT,
    "encryptedAccessToken" TEXT NOT NULL,
    "encryptedRefreshToken" TEXT,
    "createdById" TEXT NOT NULL,
    "organizationId" TEXT,
    "companyId" TEXT,
    "teamId" TEXT,
    "projectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sessionId" TEXT,

    CONSTRAINT "SCMIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityToolIntegration" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "type" "SecurityToolType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "encryptedCredentials" JSONB NOT NULL,
    "createdById" TEXT NOT NULL,
    "organizationId" TEXT,
    "companyId" TEXT,
    "teamId" TEXT,
    "sessionId" TEXT,

    CONSTRAINT "SecurityToolIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationSyncLog" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "errorMessage" TEXT,
    "findingsAdded" INTEGER NOT NULL DEFAULT 0,
    "findingsUpdated" INTEGER NOT NULL DEFAULT 0,
    "syncedProjectsJson" JSONB,
    "scmIntegrationId" TEXT,
    "securityToolIntegrationId" TEXT,

    CONSTRAINT "IntegrationSyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vulnerability" (
    "id" TEXT NOT NULL,
    "vulnerabilityId" TEXT NOT NULL,
    "type" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "cvssScore" DOUBLE PRECISION,
    "remediation" TEXT,
    "references" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vulnerability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Finding" (
    "id" TEXT NOT NULL,
    "status" "FindingStatus" NOT NULL DEFAULT 'NEW',
    "projectId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "type" "SecurityToolType",
    "vulnerabilityId" TEXT NOT NULL,
    "url" TEXT,
    "metadata" JSONB,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Finding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScanExecution" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "toolVersion" TEXT,
    "targetUrl" TEXT NOT NULL,
    "scanType" "DastScanType" NOT NULL DEFAULT 'ACTIVE',
    "status" "ScanStatus" NOT NULL,
    "queuedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "errorMessage" TEXT,
    "errorCode" TEXT,
    "findingsCount" INTEGER NOT NULL DEFAULT 0,
    "criticalCount" INTEGER NOT NULL DEFAULT 0,
    "highCount" INTEGER NOT NULL DEFAULT 0,
    "mediumCount" INTEGER NOT NULL DEFAULT 0,
    "lowCount" INTEGER NOT NULL DEFAULT 0,
    "infoCount" INTEGER NOT NULL DEFAULT 0,
    "toolConfig" JSONB,
    "toolMetadata" JSONB,
    "externalScanId" TEXT,
    "externalReportUrl" TEXT,
    "isExternalScan" BOOLEAN NOT NULL DEFAULT false,
    "securityToolIntegrationId" TEXT,
    "syncLogId" TEXT,
    "initiatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScanExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BulkUploadJob" (
    "id" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "originalFilename" TEXT NOT NULL,
    "storedFilepath" TEXT NOT NULL,
    "errorReportPath" TEXT,
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "processedRows" INTEGER NOT NULL DEFAULT 0,
    "failedRows" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "projectId" TEXT NOT NULL,
    "initiatedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "BulkUploadJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DirectProjectSecurityToolIntegrations" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DirectProjectSecurityToolIntegrations_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sid_key" ON "Session"("sid");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectRelationship_sourceProjectId_targetProjectId_type_key" ON "ProjectRelationship"("sourceProjectId", "targetProjectId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_email_key" ON "Invitation"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_token_key" ON "Invitation"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_userId_key" ON "Invitation"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_userId_organizationId_key" ON "Membership"("userId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_userId_companyId_key" ON "Membership"("userId", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_userId_teamId_key" ON "Membership"("userId", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_userId_projectId_key" ON "Membership"("userId", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Contact_email_key" ON "Contact"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Contact_userId_key" ON "Contact"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Technology_name_type_key" ON "Technology"("name", "type");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectTechnology_projectId_technologyId_version_key" ON "ProjectTechnology"("projectId", "technologyId", "version");

-- CreateIndex
CREATE INDEX "ProjectDependency_name_idx" ON "ProjectDependency"("name");

-- CreateIndex
CREATE INDEX "ProjectDependency_name_version_idx" ON "ProjectDependency"("name", "version");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectDependency_projectId_name_version_key" ON "ProjectDependency"("projectId", "name", "version");

-- CreateIndex
CREATE UNIQUE INDEX "AutoJoinDomain_verificationCode_key" ON "AutoJoinDomain"("verificationCode");

-- CreateIndex
CREATE UNIQUE INDEX "AutoJoinDomain_domain_organizationId_key" ON "AutoJoinDomain"("domain", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "AutoJoinDomain_domain_companyId_key" ON "AutoJoinDomain"("domain", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "OIDCConfiguration_organizationId_key" ON "OIDCConfiguration"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "OIDCConfiguration_issuer_key" ON "OIDCConfiguration"("issuer");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_selector_key" ON "PasswordResetToken"("selector");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_userId_key" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LoginToken_token_key" ON "LoginToken"("token");

-- CreateIndex
CREATE INDEX "IntegrationSyncLog_scmIntegrationId_idx" ON "IntegrationSyncLog"("scmIntegrationId");

-- CreateIndex
CREATE INDEX "IntegrationSyncLog_securityToolIntegrationId_idx" ON "IntegrationSyncLog"("securityToolIntegrationId");

-- CreateIndex
CREATE UNIQUE INDEX "Vulnerability_vulnerabilityId_key" ON "Vulnerability"("vulnerabilityId");

-- CreateIndex
CREATE INDEX "Finding_projectId_idx" ON "Finding"("projectId");

-- CreateIndex
CREATE INDEX "Finding_url_idx" ON "Finding"("url");

-- CreateIndex
CREATE UNIQUE INDEX "Finding_projectId_vulnerabilityId_source_key" ON "Finding"("projectId", "vulnerabilityId", "source");

-- CreateIndex
CREATE INDEX "ScanExecution_projectId_idx" ON "ScanExecution"("projectId");

-- CreateIndex
CREATE INDEX "ScanExecution_status_idx" ON "ScanExecution"("status");

-- CreateIndex
CREATE INDEX "ScanExecution_provider_idx" ON "ScanExecution"("provider");

-- CreateIndex
CREATE INDEX "ScanExecution_targetUrl_idx" ON "ScanExecution"("targetUrl");

-- CreateIndex
CREATE INDEX "BulkUploadJob_projectId_idx" ON "BulkUploadJob"("projectId");

-- CreateIndex
CREATE INDEX "BulkUploadJob_status_idx" ON "BulkUploadJob"("status");

-- CreateIndex
CREATE INDEX "_DirectProjectSecurityToolIntegrations_B_index" ON "_DirectProjectSecurityToolIntegrations"("B");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_oIDCConfigurationId_fkey" FOREIGN KEY ("oIDCConfigurationId") REFERENCES "OIDCConfiguration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_scmIntegrationId_fkey" FOREIGN KEY ("scmIntegrationId") REFERENCES "SCMIntegration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_securityToolIntegrationId_fkey" FOREIGN KEY ("securityToolIntegrationId") REFERENCES "SecurityToolIntegration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectRelationship" ADD CONSTRAINT "ProjectRelationship_sourceProjectId_fkey" FOREIGN KEY ("sourceProjectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectRelationship" ADD CONSTRAINT "ProjectRelationship_targetProjectId_fkey" FOREIGN KEY ("targetProjectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectContact" ADD CONSTRAINT "ProjectContact_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectContact" ADD CONSTRAINT "ProjectContact_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTechnology" ADD CONSTRAINT "ProjectTechnology_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTechnology" ADD CONSTRAINT "ProjectTechnology_technologyId_fkey" FOREIGN KEY ("technologyId") REFERENCES "Technology"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectDependency" ADD CONSTRAINT "ProjectDependency_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectDependency" ADD CONSTRAINT "ProjectDependency_technologyId_fkey" FOREIGN KEY ("technologyId") REFERENCES "Technology"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoJoinDomain" ADD CONSTRAINT "AutoJoinDomain_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoJoinDomain" ADD CONSTRAINT "AutoJoinDomain_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoJoinDomain" ADD CONSTRAINT "AutoJoinDomain_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OIDCConfiguration" ADD CONSTRAINT "OIDCConfiguration_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginToken" ADD CONSTRAINT "LoginToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SCMIntegration" ADD CONSTRAINT "SCMIntegration_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SCMIntegration" ADD CONSTRAINT "SCMIntegration_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SCMIntegration" ADD CONSTRAINT "SCMIntegration_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SCMIntegration" ADD CONSTRAINT "SCMIntegration_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SCMIntegration" ADD CONSTRAINT "SCMIntegration_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SCMIntegration" ADD CONSTRAINT "SCMIntegration_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityToolIntegration" ADD CONSTRAINT "SecurityToolIntegration_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityToolIntegration" ADD CONSTRAINT "SecurityToolIntegration_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityToolIntegration" ADD CONSTRAINT "SecurityToolIntegration_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityToolIntegration" ADD CONSTRAINT "SecurityToolIntegration_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityToolIntegration" ADD CONSTRAINT "SecurityToolIntegration_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationSyncLog" ADD CONSTRAINT "IntegrationSyncLog_scmIntegrationId_fkey" FOREIGN KEY ("scmIntegrationId") REFERENCES "SCMIntegration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationSyncLog" ADD CONSTRAINT "IntegrationSyncLog_securityToolIntegrationId_fkey" FOREIGN KEY ("securityToolIntegrationId") REFERENCES "SecurityToolIntegration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Finding" ADD CONSTRAINT "Finding_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Finding" ADD CONSTRAINT "Finding_vulnerabilityId_fkey" FOREIGN KEY ("vulnerabilityId") REFERENCES "Vulnerability"("vulnerabilityId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanExecution" ADD CONSTRAINT "ScanExecution_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanExecution" ADD CONSTRAINT "ScanExecution_securityToolIntegrationId_fkey" FOREIGN KEY ("securityToolIntegrationId") REFERENCES "SecurityToolIntegration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanExecution" ADD CONSTRAINT "ScanExecution_syncLogId_fkey" FOREIGN KEY ("syncLogId") REFERENCES "IntegrationSyncLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanExecution" ADD CONSTRAINT "ScanExecution_initiatedById_fkey" FOREIGN KEY ("initiatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BulkUploadJob" ADD CONSTRAINT "BulkUploadJob_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BulkUploadJob" ADD CONSTRAINT "BulkUploadJob_initiatedById_fkey" FOREIGN KEY ("initiatedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DirectProjectSecurityToolIntegrations" ADD CONSTRAINT "_DirectProjectSecurityToolIntegrations_A_fkey" FOREIGN KEY ("A") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DirectProjectSecurityToolIntegrations" ADD CONSTRAINT "_DirectProjectSecurityToolIntegrations_B_fkey" FOREIGN KEY ("B") REFERENCES "SecurityToolIntegration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
