import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/__docusaurus/debug',
    component: ComponentCreator('/__docusaurus/debug', '5ff'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/config',
    component: ComponentCreator('/__docusaurus/debug/config', '5ba'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/content',
    component: ComponentCreator('/__docusaurus/debug/content', 'a2b'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/globalData',
    component: ComponentCreator('/__docusaurus/debug/globalData', 'c3c'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/metadata',
    component: ComponentCreator('/__docusaurus/debug/metadata', '156'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/registry',
    component: ComponentCreator('/__docusaurus/debug/registry', '88c'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/routes',
    component: ComponentCreator('/__docusaurus/debug/routes', '000'),
    exact: true
  },
  {
    path: '/',
    component: ComponentCreator('/', '0e4'),
    routes: [
      {
        path: '/',
        component: ComponentCreator('/', 'b7e'),
        routes: [
          {
            path: '/',
            component: ComponentCreator('/', '6f7'),
            routes: [
              {
                path: '/api-reference',
                component: ComponentCreator('/api-reference', '0dd'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/api/auth',
                component: ComponentCreator('/api/auth', '323'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/api/company',
                component: ComponentCreator('/api/company', '7b8'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/api/dast-scans',
                component: ComponentCreator('/api/dast-scans', '4a1'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/api/findings',
                component: ComponentCreator('/api/findings', '557'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/api/hierarchy',
                component: ComponentCreator('/api/hierarchy', 'b7c'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/api/integrations',
                component: ComponentCreator('/api/integrations', '5fa'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/api/invitations',
                component: ComponentCreator('/api/invitations', 'be0'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/api/memberships',
                component: ComponentCreator('/api/memberships', '401'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/api/oidc',
                component: ComponentCreator('/api/oidc', 'f20'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/api/organizations',
                component: ComponentCreator('/api/organizations', '3ed'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/api/projects',
                component: ComponentCreator('/api/projects', '2b8'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/api/relationships',
                component: ComponentCreator('/api/relationships', '41c'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/api/security-tools',
                component: ComponentCreator('/api/security-tools', '7de'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/api/teams',
                component: ComponentCreator('/api/teams', '7ce'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/api/technologies',
                component: ComponentCreator('/api/technologies', '31a'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/backend-architecture',
                component: ComponentCreator('/backend-architecture', '800'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/dast-implementation-changelog',
                component: ComponentCreator('/dast-implementation-changelog', '129'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/dast-scanning-feature',
                component: ComponentCreator('/dast-scanning-feature', '92e'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/frontend-architecture',
                component: ComponentCreator('/frontend-architecture', '4ce'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/frontend/components/applications',
                component: ComponentCreator('/frontend/components/applications', '5ec'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/frontend/components/architecture',
                component: ComponentCreator('/frontend/components/architecture', '762'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/frontend/components/findings',
                component: ComponentCreator('/frontend/components/findings', '0a4'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/frontend/components/integrations',
                component: ComponentCreator('/frontend/components/integrations', '8b7'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/frontend/components/settings',
                component: ComponentCreator('/frontend/components/settings', '3ef'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/frontend/components/sidebar',
                component: ComponentCreator('/frontend/components/sidebar', '14a'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/frontend/hooks',
                component: ComponentCreator('/frontend/hooks', '4fa'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/frontend/lib',
                component: ComponentCreator('/frontend/lib', 'a2b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/frontend/pages',
                component: ComponentCreator('/frontend/pages', '8b0'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/frontend/stores/useArchitectureStore',
                component: ComponentCreator('/frontend/stores/useArchitectureStore', '526'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/frontend/stores/useAuthStore',
                component: ComponentCreator('/frontend/stores/useAuthStore', '0a8'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/frontend/stores/useCompanyStore',
                component: ComponentCreator('/frontend/stores/useCompanyStore', '414'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/frontend/stores/useDomainStore',
                component: ComponentCreator('/frontend/stores/useDomainStore', 'c08'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/frontend/stores/useFindingStore',
                component: ComponentCreator('/frontend/stores/useFindingStore', 'd11'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/frontend/stores/useHierarchyStore',
                component: ComponentCreator('/frontend/stores/useHierarchyStore', '485'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/frontend/stores/useIntegrationStore',
                component: ComponentCreator('/frontend/stores/useIntegrationStore', '628'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/frontend/stores/useMembershipStore',
                component: ComponentCreator('/frontend/stores/useMembershipStore', '377'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/frontend/stores/useOIDCStore',
                component: ComponentCreator('/frontend/stores/useOIDCStore', '930'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/frontend/stores/useOrganizationStore',
                component: ComponentCreator('/frontend/stores/useOrganizationStore', '132'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/frontend/stores/useProjectStore',
                component: ComponentCreator('/frontend/stores/useProjectStore', '141'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/frontend/stores/useTeamStore',
                component: ComponentCreator('/frontend/stores/useTeamStore', 'bdc'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/frontend/stores/useUIStore',
                component: ComponentCreator('/frontend/stores/useUIStore', '608'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/',
                component: ComponentCreator('/', 'c48'),
                exact: true
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
