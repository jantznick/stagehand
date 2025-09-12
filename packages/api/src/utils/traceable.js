const TRACEABLE_API_URL = 'https://api.traceable.ai/graphql';

/**
 * Executes a GraphQL query against the Traceable API.
 * @param {object} credentials - The credentials for Traceable, containing the apiToken.
 * @param {string} query - The GraphQL query string.
 * @param {object} variables - The variables for the GraphQL query.
 * @returns {Promise<object>} The data from the GraphQL response.
 */
async function executeTraceableQuery(credentials, query, variables) {
    const { apiToken } = credentials;

    const response = await fetch(TRACEABLE_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiToken}`,
        },
        body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Traceable API request failed with status ${response.status}: ${errorBody}`);
    }

    const result = await response.json();
    if (result.errors) {
        throw new Error(`Traceable GraphQL query failed: ${JSON.stringify(result.errors)}`);
    }
    return result.data;
}

/**
 * Fetches a list of services from Traceable.
 * @param {object} credentials - The credentials for Traceable.
 * @returns {Promise<Array<{id: string, name: string}>>} A list of services.
 */
export async function getTraceableServices(credentials) {
    const query = `
        query GetServices {
          services {
            items {
              id
              name
            }
          }
        }
    `;
    const data = await executeTraceableQuery(credentials, query, {});
    return data.services.items;
}

/**
 * Fetches vulnerabilities for a specific service from Traceable.
 * @param {object} credentials - The credentials for Traceable.
 * @param {string} serviceId - The ID of the service to fetch vulnerabilities for.
 * @returns {Promise<Array<object>>} A list of vulnerabilities.
 */
export async function getTraceableVulnerabilities(credentials, serviceId) {
    const query = `
        query GetVulnerabilities($serviceId: ID!) {
          vulnerabilities(serviceId: $serviceId) {
            items {
              id
              cve
              title
              description
              severity
              remediation
              threat_category
              api_endpoint_path
              http_method
            }
          }
        }
    `;
    const variables = { serviceId };
    const data = await executeTraceableQuery(credentials, query, variables);
    return data.vulnerabilities.items;
}
    return data.vulnerabilities.items;
}
