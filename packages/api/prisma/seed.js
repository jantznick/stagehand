import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const modelNames = [
	'Membership', 'Invitation', 'PasswordResetToken', 'LoginToken',
	'ProjectContact', 'ProjectTechnology',
	'Project', 'Team', 'AutoJoinDomain', 'OIDCConfiguration',
	'Company', 'Organization',
	'Contact', 'Technology', 'User',
	'OrganizationFeature', 'Plan', 'Feature'
];

// Helper to create teams with projects
const createTeamsAndProjects = (teamNames, projectCountPerTeam) => {
	return teamNames.map(teamName => ({
		name: teamName,
		projects: {
			create: Array.from({ length: projectCountPerTeam }, (_, i) => ({
				name: `${teamName} Project ${i + 1}`,
				description: `This is the description for project ${i + 1} of team ${teamName}.`,
				applicationUrl: `https://${teamName.toLowerCase().replace(/ /g, '-')}-p${i+1}.dev`,
				repositoryUrl: `https://github.com/example-corp/${teamName.toLowerCase().replace(/ /g, '-')}-p${i+1}`
			}))
		}
	}));
};

async function seedFeaturesAndPlans() {
	console.log('Creating features...');
	const features = {
		sast: await prisma.feature.create({ data: { key: 'sast-scanning', description: 'Run SAST scans against repositories' } }),
		dast: await prisma.feature.create({ data: { key: 'dast-scanning', description: 'Run DAST scans against applications' } }),
		oidc: await prisma.feature.create({ data: { key: 'oidc-sso', description: 'Enable OIDC Single Sign-On' } }),
		customRoles: await prisma.feature.create({ data: { key: 'custom-roles', description: 'Define custom roles and permissions' } })
	};
	console.log('Features created.');

	console.log('Creating plans...');
	const plans = {
		basic: await prisma.plan.create({
			data: {
				name: 'Basic',
				description: 'For small teams getting started.',
			}
		}),
		premium: await prisma.plan.create({
			data: {
				name: 'Premium',
				description: 'For growing businesses that need advanced features.',
				features: {
					connect: [
						{ id: features.sast.id },
						{ id: features.dast.id }
					]
				}
			}
		}),
		enterprise: await prisma.plan.create({
			data: {
				name: 'Enterprise',
				description: 'For large organizations with complex security and compliance needs.',
				features: {
					connect: [
						{ id: features.sast.id },
						{ id: features.dast.id },
						{ id: features.oidc.id },
						{ id: features.customRoles.id }
					]
				}
			}
		})
	};
	console.log('Plans created.');
	return { features, plans };
}

async function main() {
	console.log('--- Start seeding ---');

	// 1. Clean up existing data
	console.log('Cleaning up previous data...');
	for (const modelName of modelNames) {
		if (prisma[modelName]) {
			await prisma[modelName].deleteMany({});
		}
	}
	console.log('Previous data cleaned.');

	// 2. Create Features and Plans
	const { features, plans } = await seedFeaturesAndPlans();

	// 3. Create Master Technologies
	console.log('Creating master technologies...');
	const technologies = {
		react: await prisma.technology.create({ data: { name: 'React', type: 'FRAMEWORK' } }),
		nodejs: await prisma.technology.create({ data: { name: 'Node.js', type: 'LANGUAGE' } }),
		postgres: await prisma.technology.create({ data: { name: 'PostgreSQL', type: 'SERVICE' } }),
		docker: await prisma.technology.create({ data: { name: 'Docker', type: 'TOOL' } }),
		vite: await prisma.technology.create({ data: { name: 'Vite', type: 'TOOL' } }),
		prisma: await prisma.technology.create({ data: { name: 'Prisma', type: 'LIBRARY' } }),
		kubernetes: await prisma.technology.create({ data: { name: 'Kubernetes', type: 'PLATFORM' } }),
		python: await prisma.technology.create({ data: { name: 'Python', type: 'LANGUAGE' } }),
		go: await prisma.technology.create({ data: { name: 'Go', type: 'LANGUAGE' } }),
	};
	console.log('Technologies created.');

	// 4. Create Users
	console.log('Creating users...');
	const password = await bcrypt.hash('password123', 10);
	const users = {
		aperture_admin: await prisma.user.create({ data: { email: 'admin@acme.dev', password, emailVerified: true } }),
		momentum_admin: await prisma.user.create({ data: { email: 'admin@momentum.co', password, emailVerified: true } }),
		nexus_editor: await prisma.user.create({ data: { email: 'editor@nexus-cloud.com', password, emailVerified: true } }),
		quantum_lead: await prisma.user.create({ data: { email: 'lead.quantum@acme.dev', password, emailVerified: true } }),
		velocity_reader: await prisma.user.create({ data: { email: 'reader@velocity.io', password, emailVerified: true } }),
		multi_role_dev: await prisma.user.create({ data: { email: 'dev@acme.dev', password, emailVerified: true } }),
	};
	console.log('Users created.');

	// 5. Create Contacts
	console.log('Creating contacts...');
	const contacts = {
		lead_contact: await prisma.contact.create({ data: { name: 'Casey Lead', email: users.quantum_lead.email, userId: users.quantum_lead.id } }),
		external_pm: await prisma.contact.create({ data: { name: 'Pat Manager', email: 'pat.m@example.com' } }),
		security_consultant: await prisma.contact.create({ data: { name: 'Sam Security', email: 'sam.sec@consultants.com' } }),
		devops_eng: await prisma.contact.create({ data: { name: 'Dana Engineer', email: 'dana.eng@example.com' } }),
	};
	console.log('Contacts created.');

	// 6. Create Hierarchies
	console.log('Creating Acme Corp (ENTERPRISE) hierarchy...');
	const acmeOrg = await prisma.organization.create({
		data: {
			name: 'Acme Corp',
			hostname: 'acme',
			planId: plans.enterprise.id,
			companies: {
				create: [
					{
						name: 'Nexus Cloud Services',
						teams: { create: createTeamsAndProjects(['Compute', 'Storage', 'Networking'], 2) }
					},
					{
						name: 'Quantum Innovations',
						teams: { create: createTeamsAndProjects(['AI Research', 'Simulations', 'Data Analytics'], 3) }
					},
					{
						name: 'Helios Robotics',
						teams: { create: createTeamsAndProjects(['Control Systems', 'Hardware', 'Logistics'], 2) }
					}
				]
			}
		},
		include: { companies: { include: { teams: { include: { projects: true } } } } }
	});

	console.log('Creating Momentum Inc. (STANDARD) hierarchy...');
	const momentumOrg = await prisma.organization.create({
		data: {
			name: 'Momentum Inc.',
			hostname: 'momentum',
			planId: plans.premium.id,
			features: {
				create: [
					{ featureId: features.oidc.id, status: 'PROMO' }
				]
			},
			companies: {
				create: [
					{
						name: 'Velocity Web Solutions',
						teams: { create: createTeamsAndProjects(['E-Commerce', 'Marketing Sites', 'Client Portals'], 2) }
					},
				]
			}
		},
		include: { companies: { include: { teams: { include: { projects: true } } } } }
	});
	console.log('Hierarchies created.');

	// 7. Populate specific projects with extra data
	const simulationsTeam = acmeOrg.companies.find(c => c.name === 'Quantum Innovations').teams.find(t => t.name === 'Simulations');
	const projectToEnrich1 = simulationsTeam.projects[0];

	const ecommerceTeam = momentumOrg.companies.find(c => c.name === 'Velocity Web Solutions').teams.find(t => t.name === 'E-Commerce');
	const projectToEnrich2 = ecommerceTeam.projects[0];

	console.log('Adding extra data to specific projects...');
	await prisma.projectTechnology.createMany({
		data: [
			{ projectId: projectToEnrich1.id, technologyId: technologies.python.id, version: '3.11', source: 'user-entered' },
			{ projectId: projectToEnrich1.id, technologyId: technologies.kubernetes.id, version: '1.27', source: 'user-entered' },
			{ projectId: projectToEnrich1.id, technologyId: technologies.docker.id, version: '24.0', source: 'user-entered' },
			
			{ projectId: projectToEnrich2.id, technologyId: technologies.react.id, version: '18.2.0', source: 'user-entered' },
			{ projectId: projectToEnrich2.id, technologyId: technologies.nodejs.id, version: '18.16.0', source: 'user-entered' },
			{ projectId: projectToEnrich2.id, technologyId: technologies.postgres.id, version: '15.3', source: 'user-entered' },
		]
	});
	await prisma.projectContact.createMany({
		data: [
			{ projectId: projectToEnrich1.id, contactId: contacts.lead_contact.id, contactType: 'Technical Lead' },
			{ projectId: projectToEnrich1.id, contactId: contacts.security_consultant.id, contactType: 'Security Consultant' },
			{ projectId: projectToEnrich1.id, contactId: contacts.devops_eng.id, contactType: 'DevOps Engineer' },

			{ projectId: projectToEnrich2.id, contactId: contacts.external_pm.id, contactType: 'Product Manager' },
			{ projectId: projectToEnrich2.id, contactId: contacts.devops_eng.id, contactType: 'Deployment Contact' },
			{ projectId: projectToEnrich2.id, contactId: contacts.lead_contact.id, contactType: 'External Advisor' },
		]
	});
	console.log('Project enrichment complete.');

	// 8. Assign Memberships
	console.log('Assigning roles and permissions...');
	// Fetch all entities for easy mapping
	const allOrgs = await prisma.organization.findMany({ include: { companies: { include: { teams: { include: { projects: true } } } } } });
	const orgMap = Object.fromEntries(allOrgs.map(o => [o.name, o]));

	const companyMap = new Map();
	allOrgs.forEach(org => org.companies.forEach(c => companyMap.set(c.name, c)));

	const teamMap = new Map();
	allOrgs.forEach(org => org.companies.forEach(c => c.teams.forEach(t => teamMap.set(t.name, t))));

	await prisma.membership.createMany({
		data: [
			// Aperture Labs Permissions
			{ userId: users.aperture_admin.id, organizationId: orgMap['Acme Corp'].id, role: 'ADMIN' },
			{ userId: users.nexus_editor.id, companyId: companyMap.get('Nexus Cloud Services').id, role: 'EDITOR' },
			{ userId: users.quantum_lead.id, teamId: teamMap.get('AI Research').id, role: 'ADMIN' },
			{ userId: users.multi_role_dev.id, teamId: teamMap.get('Control Systems').id, role: 'EDITOR' },
			{ userId: users.multi_role_dev.id, teamId: teamMap.get('Simulations').id, role: 'READER' },

			// Momentum Inc. Permissions
			{ userId: users.momentum_admin.id, organizationId: orgMap['Momentum Inc.'].id, role: 'ADMIN' },
			{ userId: users.velocity_reader.id, companyId: companyMap.get('Velocity Web Solutions').id, role: 'READER' }
		]
	});
	console.log('Permissions assigned.');

	// Make one user a super admin
	await prisma.user.update({
		where: { email: 'admin@acme.dev' },
		data: { isSuperAdmin: true }
	});
	console.log('Super admin rights granted.');

	console.log('--- Seeding finished successfully! ---');
}

main()
	.catch(e => {
		console.error('An error occurred during seeding:');
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	}); 