/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  // By default, Docusaurus generates a sidebar from the docs folder structure
  docsSidebar: [
    {
      type: 'doc',
      id: 'api-reference',
      label: 'API Reference',
    },
    {
      type: 'category',
      label: 'Architecture',
      items: [
        'backend-architecture',
        'frontend-architecture',
      ],
    },
    {
      type: 'category',
      label: 'Features',
      items: [
        'dast-scanning-feature',
        'dast-implementation-changelog',
      ],
    },
    {
      type: 'category',
      label: 'API Documentation',
      items: [
        {
          type: 'category',
          label: 'Core & Authentication',
          items: [
            'api/auth',
            'api/oidc',
            'api/organizations',
            'api/company',
            'api/teams',
            'api/projects',
            'api/memberships',
          ],
        },
        {
          type: 'category',
          label: 'Supporting Resources',
          items: [
            'api/invitations',
            'api/integrations',
            'api/security-tools',
            'api/findings',
            'api/dast-scans',
            'api/hierarchy',
            'api/relationships',
            'api/technologies',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Frontend Documentation',
      items: [
        'frontend/lib',
        'frontend/hooks',
        'frontend/pages',
        {
          type: 'category',
          label: 'Components',
          items: [
            'frontend/components/applications',
            'frontend/components/architecture',
            'frontend/components/findings',
            'frontend/components/integrations',
            'frontend/components/settings',
            'frontend/components/sidebar',
          ],
        },
        {
          type: 'category',
          label: 'Stores',
          items: [
            'frontend/stores/useAuthStore',
            'frontend/stores/useArchitectureStore',
            'frontend/stores/useCompanyStore',
            'frontend/stores/useDomainStore',
            'frontend/stores/useFindingStore',
            'frontend/stores/useHierarchyStore',
            'frontend/stores/useIntegrationStore',
            'frontend/stores/useMembershipStore',
            'frontend/stores/useOIDCStore',
            'frontend/stores/useOrganizationStore',
            'frontend/stores/useProjectStore',
            'frontend/stores/useTeamStore',
            'frontend/stores/useUIStore',
          ],
        },
      ],
    },
  ],
};

module.exports = sidebars; 