import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// A list of hostnames/subdomains to ignore (e.g., for admin panels or marketing sites)
const IGNORED_HOSTNAMES = ['www', 'app', 'api', 'admin', 'status'];

/**
 * Middleware to identify the organization based on the request's hostname.
 * It attaches the organization and its calculated feature set to `req.organization`.
 */
export const instanceResolver = async (req, res, next) => {
	try {
        const hostname = req.headers['x-forwarded-host'] || req.hostname;
        
        // In development, req.hostname might be 'localhost', which we'll treat as a special case.
        // For production, we expect a subdomain like 'acme.stagehand.app'.
		const hostParts = hostname.split('.');
		const subdomain = hostParts[0];

		if (!subdomain || IGNORED_HOSTNAMES.includes(subdomain) || hostname === 'localhost') {
			// This is not an organization-specific request, so we skip instance resolution.
            // This is important for global routes like health checks or a future super-admin login.
			return next();
		}

		const organization = await prisma.organization.findUnique({
			where: { hostname: subdomain },
			include: {
				plan: {
					include: {
						features: true // Get the plan's default features
					}
				},
				features: { // Get the organization-specific feature overrides
                    include: {
                        feature: true
                    }
                }
			}
		});

		if (!organization) {
			return res.status(404).json({ error: 'Organization instance not found.' });
		}

        // Calculate final feature set
        const features = {};

        // 1. Apply plan features
        if (organization.plan && organization.plan.features) {
            for (const feature of organization.plan.features) {
                features[feature.key] = 'ACTIVE';
            }
        }

        // 2. Apply organization-specific overrides
        if (organization.features) {
            for (const orgFeature of organization.features) {
                features[orgFeature.feature.key] = orgFeature.status;
            }
        }

        // Attach the resolved instance and its features to the request object
        req.organization = {
            id: organization.id,
            name: organization.name,
            hostname: organization.hostname,
            plan: organization.plan ? { id: organization.plan.id, name: organization.plan.name } : null,
            features: features
        };

		return next();
	} catch (error) {
		console.error('Error in instanceResolver middleware:', error);
		return res.status(500).json({ error: 'Internal Server Error' });
	}
};
