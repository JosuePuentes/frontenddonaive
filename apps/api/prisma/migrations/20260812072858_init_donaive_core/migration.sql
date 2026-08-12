-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "donaive_core";

-- CreateEnum
CREATE TYPE "donaive_core"."OrganizationStatus" AS ENUM ('active', 'inactive', 'suspended', 'archived');

-- CreateEnum
CREATE TYPE "donaive_core"."ProjectCategory" AS ENUM ('pharmacy', 'drugstore', 'hardware', 'liquor_store', 'liquor_and_grocery', 'grocery', 'restaurant', 'retail', 'services', 'custom');

-- CreateEnum
CREATE TYPE "donaive_core"."ProjectStatus" AS ENUM ('draft', 'provisioning', 'active', 'paused', 'suspended', 'archived');

-- CreateEnum
CREATE TYPE "donaive_core"."TemplateStatus" AS ENUM ('draft', 'active', 'deprecated', 'archived');

-- CreateEnum
CREATE TYPE "donaive_core"."TemplateVersionStatus" AS ENUM ('draft', 'published', 'deprecated', 'yanked');

-- CreateEnum
CREATE TYPE "donaive_core"."ProjectInstanceStatus" AS ENUM ('provisioning', 'active', 'paused', 'suspended', 'decommissioned');

-- CreateEnum
CREATE TYPE "donaive_core"."InstanceVersionStatus" AS ENUM ('active', 'superseded', 'rolled_back');

-- CreateEnum
CREATE TYPE "donaive_core"."CustomizationType" AS ENUM ('branding', 'logo', 'colors', 'display_name', 'module_toggle', 'configuration', 'behavior', 'custom_field', 'other');

-- CreateEnum
CREATE TYPE "donaive_core"."CustomizationSource" AS ENUM ('client_request', 'donaive_dev', 'import', 'migration', 'system_default');

-- CreateEnum
CREATE TYPE "donaive_core"."ModuleKey" AS ENUM ('pos', 'inventory', 'purchases', 'expenses', 'customers', 'suppliers', 'reports', 'finance', 'accounts_receivable', 'accounts_payable', 'offline', 'ai');

-- CreateEnum
CREATE TYPE "donaive_core"."ModuleStatus" AS ENUM ('draft', 'active', 'deprecated', 'archived');

-- CreateEnum
CREATE TYPE "donaive_core"."UpdateStatus" AS ENUM ('draft', 'published', 'deprecated', 'yanked');

-- CreateEnum
CREATE TYPE "donaive_core"."UpdateTargetMode" AS ENUM ('project', 'projects', 'category', 'compatible', 'none');

-- CreateEnum
CREATE TYPE "donaive_core"."ProjectUpdateStatus" AS ENUM ('assigned', 'approved', 'installing', 'installed', 'failed', 'rolled_back', 'skipped');

-- CreateEnum
CREATE TYPE "donaive_core"."PlanTier" AS ENUM ('basic', 'professional', 'enterprise', 'custom');

-- CreateEnum
CREATE TYPE "donaive_core"."PlanStatus" AS ENUM ('draft', 'active', 'deprecated', 'archived');

-- CreateEnum
CREATE TYPE "donaive_core"."LicenseStatus" AS ENUM ('active', 'trial', 'grace', 'past_due', 'expired', 'suspended', 'revoked');

-- CreateEnum
CREATE TYPE "donaive_core"."EntitlementSource" AS ENUM ('plan', 'addon', 'trial', 'custom', 'promotion');

-- CreateEnum
CREATE TYPE "donaive_core"."SubscriptionStatus" AS ENUM ('active', 'trial', 'past_due', 'expired', 'suspended', 'cancelled');

-- CreateEnum
CREATE TYPE "donaive_core"."CommercialLifecycleStatus" AS ENUM ('active', 'trial', 'past_due', 'expired', 'suspended', 'cancelled');

-- CreateEnum
CREATE TYPE "donaive_core"."ProjectDomainType" AS ENUM ('subdomain', 'custom_domain');

-- CreateEnum
CREATE TYPE "donaive_core"."ProjectDomainStatus" AS ENUM ('pending', 'active', 'error', 'disabled');

-- CreateEnum
CREATE TYPE "donaive_core"."ProjectUserRole" AS ENUM ('project_admin', 'manager', 'user', 'viewer');

-- CreateEnum
CREATE TYPE "donaive_core"."ProjectUserStatus" AS ENUM ('active', 'invited', 'suspended', 'removed');

-- CreateEnum
CREATE TYPE "donaive_core"."PlatformRole" AS ENUM ('donaive_admin', 'donaive_operator', 'project_admin', 'project_manager', 'project_user', 'project_viewer', 'donaive_intelligence', 'ai_agent');

-- CreateEnum
CREATE TYPE "donaive_core"."UserStatus" AS ENUM ('active', 'invited', 'suspended', 'deactivated');

-- CreateEnum
CREATE TYPE "donaive_core"."AuditActorType" AS ENUM ('user', 'system', 'agent', 'service', 'scheduler');

-- CreateEnum
CREATE TYPE "donaive_core"."AnalyticsSensitivity" AS ENUM ('aggregate', 'detailed');

-- CreateEnum
CREATE TYPE "donaive_core"."AgentAccessMode" AS ENUM ('read', 'analyze', 'suggest', 'generate', 'prepare');

-- CreateTable
CREATE TABLE "donaive_core"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT,
    "status" "donaive_core"."UserStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donaive_core"."Capability" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "sensitive" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Capability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donaive_core"."RoleCapability" (
    "id" TEXT NOT NULL,
    "role" "donaive_core"."PlatformRole" NOT NULL,
    "capabilityId" TEXT NOT NULL,

    CONSTRAINT "RoleCapability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donaive_core"."UserRoleAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "donaive_core"."PlatformRole" NOT NULL,
    "organizationId" TEXT,
    "projectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRoleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donaive_core"."Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "status" "donaive_core"."OrganizationStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donaive_core"."Project" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "commercialName" TEXT NOT NULL,
    "technicalSlug" TEXT NOT NULL,
    "category" "donaive_core"."ProjectCategory" NOT NULL,
    "status" "donaive_core"."ProjectStatus" NOT NULL DEFAULT 'draft',
    "templateId" TEXT,
    "currentVersionId" TEXT,
    "primaryDomain" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donaive_core"."Template" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" "donaive_core"."ProjectCategory" NOT NULL,
    "description" TEXT,
    "status" "donaive_core"."TemplateStatus" NOT NULL DEFAULT 'draft',
    "currentVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donaive_core"."TemplateVersion" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "status" "donaive_core"."TemplateVersionStatus" NOT NULL DEFAULT 'draft',
    "releaseNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemplateVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donaive_core"."ProjectInstance" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "templateVersionId" TEXT NOT NULL,
    "status" "donaive_core"."ProjectInstanceStatus" NOT NULL DEFAULT 'provisioning',
    "currentInstanceVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donaive_core"."InstanceVersion" (
    "id" TEXT NOT NULL,
    "projectInstanceId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "status" "donaive_core"."InstanceVersionStatus" NOT NULL DEFAULT 'active',
    "templateVersionId" TEXT,
    "adoptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstanceVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donaive_core"."ProjectCustomization" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" "donaive_core"."CustomizationType" NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "source" "donaive_core"."CustomizationSource" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectCustomization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donaive_core"."Module" (
    "id" TEXT NOT NULL,
    "key" "donaive_core"."ModuleKey" NOT NULL,
    "name" TEXT NOT NULL,
    "category" "donaive_core"."ProjectCategory",
    "version" TEXT,
    "status" "donaive_core"."ModuleStatus" NOT NULL DEFAULT 'active',

    CONSTRAINT "Module_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donaive_core"."ProjectModule" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "version" TEXT,

    CONSTRAINT "ProjectModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donaive_core"."Update" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "moduleKey" "donaive_core"."ModuleKey" NOT NULL,
    "fromVersion" TEXT,
    "toVersion" TEXT NOT NULL,
    "compatibleCategories" "donaive_core"."ProjectCategory"[],
    "compatibleModules" "donaive_core"."ModuleKey"[],
    "status" "donaive_core"."UpdateStatus" NOT NULL DEFAULT 'draft',
    "releaseNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "Update_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donaive_core"."UpdateRelease" (
    "id" TEXT NOT NULL,
    "updateId" TEXT NOT NULL,
    "releasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedBy" TEXT,

    CONSTRAINT "UpdateRelease_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donaive_core"."UpdateTarget" (
    "id" TEXT NOT NULL,
    "updateId" TEXT NOT NULL,
    "mode" "donaive_core"."UpdateTargetMode" NOT NULL,
    "projectIds" TEXT[],
    "category" "donaive_core"."ProjectCategory",

    CONSTRAINT "UpdateTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donaive_core"."ProjectUpdate" (
    "id" TEXT NOT NULL,
    "updateId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "status" "donaive_core"."ProjectUpdateStatus" NOT NULL DEFAULT 'assigned',
    "assignedBy" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "installedAt" TIMESTAMP(3),
    "fromVersion" TEXT,
    "toVersion" TEXT,
    "failureReason" TEXT,
    "rollbackOfId" TEXT,

    CONSTRAINT "ProjectUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donaive_core"."Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tier" "donaive_core"."PlanTier" NOT NULL,
    "description" TEXT,
    "status" "donaive_core"."PlanStatus" NOT NULL DEFAULT 'draft',
    "includedModules" "donaive_core"."ModuleKey"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donaive_core"."License" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "planId" TEXT,
    "status" "donaive_core"."LicenseStatus" NOT NULL DEFAULT 'active',
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "lifecycleStatus" "donaive_core"."CommercialLifecycleStatus" NOT NULL DEFAULT 'active',
    "gracePeriodEndsAt" TIMESTAMP(3),
    "deviceLimit" INTEGER,
    "activationRef" TEXT,
    "renewalRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "License_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donaive_core"."Entitlement" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "licenseId" TEXT,
    "moduleId" TEXT,
    "moduleKey" "donaive_core"."ModuleKey",
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "source" "donaive_core"."EntitlementSource" NOT NULL,
    "limits" JSONB,

    CONSTRAINT "Entitlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donaive_core"."Subscription" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT,
    "planId" TEXT NOT NULL,
    "status" "donaive_core"."SubscriptionStatus" NOT NULL DEFAULT 'active',
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "lifecycleStatus" "donaive_core"."CommercialLifecycleStatus" NOT NULL DEFAULT 'active',
    "gracePeriodEndsAt" TIMESTAMP(3),
    "billingCycleRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donaive_core"."ProjectDomain" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "hostname" TEXT NOT NULL,
    "type" "donaive_core"."ProjectDomainType" NOT NULL,
    "status" "donaive_core"."ProjectDomainStatus" NOT NULL DEFAULT 'pending',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "sslStatus" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectDomain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donaive_core"."ProjectUser" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "role" "donaive_core"."ProjectUserRole" NOT NULL,
    "status" "donaive_core"."ProjectUserStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donaive_core"."AuditLog" (
    "id" TEXT NOT NULL,
    "actorType" "donaive_core"."AuditActorType" NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "projectId" TEXT,
    "organizationId" TEXT,
    "before" JSONB,
    "after" JSONB,
    "metadata" JSONB,
    "reason" TEXT,
    "approvalId" TEXT,
    "agentRunId" TEXT,
    "capability" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donaive_core"."AnalyticsSnapshot" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "category" "donaive_core"."ProjectCategory" NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "metrics" JSONB NOT NULL,
    "sensitivity" "donaive_core"."AnalyticsSensitivity" NOT NULL DEFAULT 'aggregate',
    "exportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donaive_core"."AgentContext" (
    "id" TEXT NOT NULL,
    "agentRunId" TEXT NOT NULL,
    "actorId" TEXT,
    "projectId" TEXT,
    "approvalId" TEXT,
    "capabilities" TEXT[],
    "readOnly" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentContext_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donaive_core"."AgentProjectAccess" (
    "id" TEXT NOT NULL,
    "agentContextId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "readOnly" BOOLEAN NOT NULL DEFAULT true,
    "modes" "donaive_core"."AgentAccessMode"[],

    CONSTRAINT "AgentProjectAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donaive_core"."AgentPermission" (
    "id" TEXT NOT NULL,
    "agentProjectAccessId" TEXT NOT NULL,
    "capability" TEXT NOT NULL,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AgentPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donaive_core"."OfflineSyncRequirement" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "localDatabase" BOOLEAN NOT NULL DEFAULT true,
    "syncEngine" BOOLEAN NOT NULL DEFAULT true,
    "offlineQueue" BOOLEAN NOT NULL DEFAULT true,
    "conflictResolution" BOOLEAN NOT NULL DEFAULT true,
    "documentedOnly" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "OfflineSyncRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "donaive_core"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Capability_key_key" ON "donaive_core"."Capability"("key");

-- CreateIndex
CREATE UNIQUE INDEX "RoleCapability_role_capabilityId_key" ON "donaive_core"."RoleCapability"("role", "capabilityId");

-- CreateIndex
CREATE INDEX "UserRoleAssignment_userId_idx" ON "donaive_core"."UserRoleAssignment"("userId");

-- CreateIndex
CREATE INDEX "UserRoleAssignment_organizationId_idx" ON "donaive_core"."UserRoleAssignment"("organizationId");

-- CreateIndex
CREATE INDEX "UserRoleAssignment_projectId_idx" ON "donaive_core"."UserRoleAssignment"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Project_technicalSlug_key" ON "donaive_core"."Project"("technicalSlug");

-- CreateIndex
CREATE INDEX "Project_organizationId_idx" ON "donaive_core"."Project"("organizationId");

-- CreateIndex
CREATE INDEX "Project_category_idx" ON "donaive_core"."Project"("category");

-- CreateIndex
CREATE UNIQUE INDEX "Template_slug_key" ON "donaive_core"."Template"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateVersion_templateId_version_key" ON "donaive_core"."TemplateVersion"("templateId", "version");

-- CreateIndex
CREATE INDEX "ProjectInstance_projectId_idx" ON "donaive_core"."ProjectInstance"("projectId");

-- CreateIndex
CREATE INDEX "InstanceVersion_projectId_idx" ON "donaive_core"."InstanceVersion"("projectId");

-- CreateIndex
CREATE INDEX "ProjectCustomization_projectId_idx" ON "donaive_core"."ProjectCustomization"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectCustomization_projectId_key_key" ON "donaive_core"."ProjectCustomization"("projectId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "Module_key_key" ON "donaive_core"."Module"("key");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectModule_projectId_moduleId_key" ON "donaive_core"."ProjectModule"("projectId", "moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "UpdateRelease_updateId_key" ON "donaive_core"."UpdateRelease"("updateId");

-- CreateIndex
CREATE INDEX "ProjectUpdate_projectId_idx" ON "donaive_core"."ProjectUpdate"("projectId");

-- CreateIndex
CREATE INDEX "ProjectUpdate_updateId_idx" ON "donaive_core"."ProjectUpdate"("updateId");

-- CreateIndex
CREATE INDEX "License_projectId_idx" ON "donaive_core"."License"("projectId");

-- CreateIndex
CREATE INDEX "License_organizationId_idx" ON "donaive_core"."License"("organizationId");

-- CreateIndex
CREATE INDEX "Entitlement_projectId_idx" ON "donaive_core"."Entitlement"("projectId");

-- CreateIndex
CREATE INDEX "Subscription_organizationId_idx" ON "donaive_core"."Subscription"("organizationId");

-- CreateIndex
CREATE INDEX "Subscription_projectId_idx" ON "donaive_core"."Subscription"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectDomain_hostname_key" ON "donaive_core"."ProjectDomain"("hostname");

-- CreateIndex
CREATE INDEX "ProjectDomain_projectId_idx" ON "donaive_core"."ProjectDomain"("projectId");

-- CreateIndex
CREATE INDEX "ProjectUser_projectId_idx" ON "donaive_core"."ProjectUser"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectUser_userId_projectId_key" ON "donaive_core"."ProjectUser"("userId", "projectId");

-- CreateIndex
CREATE INDEX "AuditLog_projectId_idx" ON "donaive_core"."AuditLog"("projectId");

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_idx" ON "donaive_core"."AuditLog"("organizationId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "donaive_core"."AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "donaive_core"."AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsSnapshot_projectId_idx" ON "donaive_core"."AnalyticsSnapshot"("projectId");

-- CreateIndex
CREATE INDEX "AnalyticsSnapshot_category_idx" ON "donaive_core"."AnalyticsSnapshot"("category");

-- CreateIndex
CREATE UNIQUE INDEX "AgentContext_agentRunId_key" ON "donaive_core"."AgentContext"("agentRunId");

-- CreateIndex
CREATE UNIQUE INDEX "AgentProjectAccess_agentContextId_key" ON "donaive_core"."AgentProjectAccess"("agentContextId");

-- CreateIndex
CREATE UNIQUE INDEX "OfflineSyncRequirement_projectId_key" ON "donaive_core"."OfflineSyncRequirement"("projectId");

-- AddForeignKey
ALTER TABLE "donaive_core"."RoleCapability" ADD CONSTRAINT "RoleCapability_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "donaive_core"."Capability"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donaive_core"."UserRoleAssignment" ADD CONSTRAINT "UserRoleAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "donaive_core"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donaive_core"."Project" ADD CONSTRAINT "Project_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "donaive_core"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donaive_core"."Project" ADD CONSTRAINT "Project_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "donaive_core"."Template"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donaive_core"."TemplateVersion" ADD CONSTRAINT "TemplateVersion_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "donaive_core"."Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donaive_core"."ProjectInstance" ADD CONSTRAINT "ProjectInstance_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "donaive_core"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donaive_core"."ProjectInstance" ADD CONSTRAINT "ProjectInstance_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "donaive_core"."Template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donaive_core"."ProjectInstance" ADD CONSTRAINT "ProjectInstance_templateVersionId_fkey" FOREIGN KEY ("templateVersionId") REFERENCES "donaive_core"."TemplateVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donaive_core"."InstanceVersion" ADD CONSTRAINT "InstanceVersion_projectInstanceId_fkey" FOREIGN KEY ("projectInstanceId") REFERENCES "donaive_core"."ProjectInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donaive_core"."InstanceVersion" ADD CONSTRAINT "InstanceVersion_templateVersionId_fkey" FOREIGN KEY ("templateVersionId") REFERENCES "donaive_core"."TemplateVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donaive_core"."ProjectCustomization" ADD CONSTRAINT "ProjectCustomization_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "donaive_core"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donaive_core"."ProjectModule" ADD CONSTRAINT "ProjectModule_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "donaive_core"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donaive_core"."ProjectModule" ADD CONSTRAINT "ProjectModule_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "donaive_core"."Module"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donaive_core"."UpdateRelease" ADD CONSTRAINT "UpdateRelease_updateId_fkey" FOREIGN KEY ("updateId") REFERENCES "donaive_core"."Update"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donaive_core"."UpdateTarget" ADD CONSTRAINT "UpdateTarget_updateId_fkey" FOREIGN KEY ("updateId") REFERENCES "donaive_core"."Update"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donaive_core"."ProjectUpdate" ADD CONSTRAINT "ProjectUpdate_updateId_fkey" FOREIGN KEY ("updateId") REFERENCES "donaive_core"."Update"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donaive_core"."ProjectUpdate" ADD CONSTRAINT "ProjectUpdate_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "donaive_core"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donaive_core"."License" ADD CONSTRAINT "License_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "donaive_core"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donaive_core"."License" ADD CONSTRAINT "License_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "donaive_core"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donaive_core"."License" ADD CONSTRAINT "License_planId_fkey" FOREIGN KEY ("planId") REFERENCES "donaive_core"."Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donaive_core"."Entitlement" ADD CONSTRAINT "Entitlement_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "donaive_core"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donaive_core"."Entitlement" ADD CONSTRAINT "Entitlement_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "donaive_core"."License"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donaive_core"."Entitlement" ADD CONSTRAINT "Entitlement_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "donaive_core"."Module"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donaive_core"."Subscription" ADD CONSTRAINT "Subscription_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "donaive_core"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donaive_core"."Subscription" ADD CONSTRAINT "Subscription_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "donaive_core"."Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donaive_core"."Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "donaive_core"."Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donaive_core"."ProjectDomain" ADD CONSTRAINT "ProjectDomain_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "donaive_core"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donaive_core"."ProjectUser" ADD CONSTRAINT "ProjectUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "donaive_core"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donaive_core"."ProjectUser" ADD CONSTRAINT "ProjectUser_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "donaive_core"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donaive_core"."AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "donaive_core"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donaive_core"."AnalyticsSnapshot" ADD CONSTRAINT "AnalyticsSnapshot_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "donaive_core"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donaive_core"."AgentContext" ADD CONSTRAINT "AgentContext_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "donaive_core"."Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donaive_core"."AgentProjectAccess" ADD CONSTRAINT "AgentProjectAccess_agentContextId_fkey" FOREIGN KEY ("agentContextId") REFERENCES "donaive_core"."AgentContext"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donaive_core"."AgentPermission" ADD CONSTRAINT "AgentPermission_agentProjectAccessId_fkey" FOREIGN KEY ("agentProjectAccessId") REFERENCES "donaive_core"."AgentProjectAccess"("id") ON DELETE CASCADE ON UPDATE CASCADE;
