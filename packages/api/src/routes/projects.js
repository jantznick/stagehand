/**
 * @openapi
 * tags:
 *   - name: Projects
 *     description: Project management and application details
 * 
 * components:
 *   schemas:
 *     ProjectDetailed:
 *       allOf:
 *         - $ref: '#/components/schemas/Project'
 *         - type: object
 *           properties:
 *             applicationUrl:
 *               type: string
 *               description: URL of the deployed application
 *             version:
 *               type: string
 *               description: Current version of the application
 *             deploymentStatus:
 *               type: string
 *               enum: [DEVELOPMENT, STAGING, PRODUCTION, DEPRECATED]
 *               description: Current deployment status
 *             repositoryUrl:
 *               type: string
 *               description: Source code repository URL
 *             repositoryBranch:
 *               type: string
 *               description: Primary repository branch
 *             repositoryProvider:
 *               type: string
 *               enum: [GITHUB, GITLAB, BITBUCKET]
 *               description: Source code repository provider
 *             ciCdPipelineUrl:
 *               type: string
 *               description: CI/CD pipeline URL
 *             projectType:
 *               type: string
 *               enum: [WEB_APPLICATION, MOBILE_APPLICATION, API, LIBRARY, MICROSERVICE, DATABASE, INFRASTRUCTURE]
 *               description: Type of project
 *             dataClassification:
 *               type: string
 *               enum: [PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED]
 *               description: Data classification level
 *             applicationCriticality:
 *               type: string
 *               enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *               description: Business criticality level
 *             isExternallyExposed:
 *               type: boolean
 *               description: Whether the application is exposed to external users
 *             communicationChannel:
 *               type: string
 *               description: Team communication channel (e.g., Slack channel)
 *             documentationUrl:
 *               type: string
 *               description: Project documentation URL
 *             apiReferenceUrl:
 *               type: string
 *               description: API reference documentation URL
 *             runbookUrl:
 *               type: string
 *               description: Operational runbook URL
 *             threatModelUrl:
 *               type: string
 *               description: Security threat model URL
 *             lastSecurityReview:
 *               type: string
 *               format: date-time
 *               description: Date of last security review
 *             securityToolProjectId:
 *               type: string
 *               description: Associated security tool project ID
 *             team:
 *               $ref: '#/components/schemas/TeamWithCompanyAndOrg'
 *             contacts:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProjectContact'
 *             technologies:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProjectTechnology'
 *             dependencies:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProjectDependency'
 *     
 *     CreateProjectRequest:
 *       type: object
 *       required:
 *         - name
 *         - teamId
 *       properties:
 *         name:
 *           type: string
 *           description: Project name
 *         description:
 *           type: string
 *           description: Project description
 *         teamId:
 *           type: string
 *           description: Parent team ID
 *     
 *     UpdateProjectRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Project name
 *         description:
 *           type: string
 *           description: Project description
 *         applicationUrl:
 *           type: string
 *           description: URL of the deployed application
 *         version:
 *           type: string
 *           description: Current version of the application
 *         deploymentStatus:
 *           type: string
 *           enum: [DEVELOPMENT, STAGING, PRODUCTION, DEPRECATED]
 *           description: Current deployment status
 *         repositoryUrl:
 *           type: string
 *           description: Source code repository URL
 *         ciCdPipelineUrl:
 *           type: string
 *           description: CI/CD pipeline URL
 *         projectType:
 *           type: string
 *           enum: [WEB_APPLICATION, MOBILE_APPLICATION, API, LIBRARY, MICROSERVICE, DATABASE, INFRASTRUCTURE]
 *           description: Type of project
 *         dataClassification:
 *           type: string
 *           enum: [PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED]
 *           description: Data classification level
 *         applicationCriticality:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *           description: Business criticality level
 *         isExternallyExposed:
 *           type: boolean
 *           description: Whether the application is exposed to external users
 *         communicationChannel:
 *           type: string
 *           description: Team communication channel (e.g., Slack channel)
 *         documentationUrl:
 *           type: string
 *           description: Project documentation URL
 *         apiReferenceUrl:
 *           type: string
 *           description: API reference documentation URL
 *         runbookUrl:
 *           type: string
 *           description: Operational runbook URL
 *         threatModelUrl:
 *           type: string
 *           description: Security threat model URL
 *         lastSecurityReview:
 *           type: string
 *           format: date-time
 *           description: Date of last security review
 *     
 *     Contact:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         role:
 *           type: string
 *           description: Contact's role in the project
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     ProjectContact:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         projectId:
 *           type: string
 *         contactId:
 *           type: string
 *         contact:
 *           $ref: '#/components/schemas/Contact'
 *         user:
 *           type: object
 *           nullable: true
 *           properties:
 *             id:
 *               type: string
 *             email:
 *               type: string
 *               format: email
 *         projectMembership:
 *           type: object
 *           nullable: true
 *           properties:
 *             userId:
 *               type: string
 *             role:
 *               type: string
 *               enum: [ADMIN, EDITOR, READER]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     Technology:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         category:
 *           type: string
 *         version:
 *           type: string
 *         description:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     ProjectTechnology:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         projectId:
 *           type: string
 *         technologyId:
 *           type: string
 *         technology:
 *           $ref: '#/components/schemas/Technology'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     ProjectDependency:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         fromProjectId:
 *           type: string
 *         toProjectId:
 *           type: string
 *         dependencyType:
 *           type: string
 *           enum: [API, DATABASE, SERVICE, LIBRARY]
 *           description: Type of dependency relationship
 *         description:
 *           type: string
 *           description: Description of the dependency
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     TeamWithCompanyAndOrg:
 *       allOf:
 *         - $ref: '#/components/schemas/Team'
 *         - type: object
 *           properties:
 *             company:
 *               allOf:
 *                 - $ref: '#/components/schemas/Company'
 *                 - type: object
 *                   properties:
 *                     organization:
 *                       $ref: '#/components/schemas/Organization'
 */

/**
 * @openapi
 * /api/v1/projects/{id}:
 *   get:
 *     summary: Get project by ID with full details
 *     description: Retrieves a single project with comprehensive details including team hierarchy, contacts, technologies, and dependencies
 *     tags: [Projects]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Detailed project information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProjectDetailed'
 *       403:
 *         description: Not authorized to view this project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Project not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   
 *   put:
 *     summary: Update project details
 *     description: Updates project information including application details, security metadata, and operational information
 *     tags: [Projects]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProjectRequest'
 *     responses:
 *       200:
 *         description: Project successfully updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not authorized to update this project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   
 *   delete:
 *     summary: Delete project
 *     description: Permanently deletes a project and all associated data
 *     tags: [Projects]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       204:
 *         description: Project successfully deleted
 *       403:
 *         description: Not authorized to delete this project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * 
 * /api/v1/projects:
 *   get:
 *     summary: List all projects user has access to
 *     description: Returns all projects that the authenticated user has access to view
 *     tags: [Projects]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of projects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Project'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   
 *   post:
 *     summary: Create a new project
 *     description: Creates a new project within a team and assigns creator as admin
 *     tags: [Projects]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProjectRequest'
 *     responses:
 *       201:
 *         description: Project successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not authorized to create project in this team
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @openapi
 * /api/v1/projects/{id}/members:
 *   get:
 *     summary: Get project members
 *     description: Retrieves all users with access to the project from the parent organization, excluding those already assigned as contacts
 *     tags: [Projects]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: List of available project members
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   email:
 *                     type: string
 *                     format: email
 *       403:
 *         description: Not authorized to view this project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Project not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * 
 * /api/v1/projects/{id}/contacts:
 *   post:
 *     summary: Add contact to project
 *     description: Adds a new contact to the project with specified role. Creates contact if it doesn't exist.
 *     tags: [Projects]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - name
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Contact email address
 *               name:
 *                 type: string
 *                 description: Contact full name
 *               role:
 *                 type: string
 *                 description: Contact role in the project
 *     responses:
 *       201:
 *         description: Contact successfully added
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProjectContact'
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not authorized to add contacts to this project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Contact already associated with this project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * 
 * /api/v1/projects/{projectId}/contacts/{contactId}:
 *   put:
 *     summary: Update project contact
 *     description: Updates contact information and role for a project
 *     tags: [Projects]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *       - in: path
 *         name: contactId
 *         required: true
 *         schema:
 *           type: string
 *         description: Contact ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - oldContactType
 *               - newContactType
 *             properties:
 *               name:
 *                 type: string
 *                 description: Updated contact name
 *               oldContactType:
 *                 type: string
 *                 description: Current contact role/type
 *               newContactType:
 *                 type: string
 *                 description: New contact role/type
 *     responses:
 *       200:
 *         description: Contact successfully updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProjectContact'
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not authorized to update contacts for this project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Contact with new role already exists for this project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * 
 * /api/v1/projects/{id}/contacts/{contactId}/{contactType}:
 *   delete:
 *     summary: Remove contact from project
 *     description: Removes a contact association from the project
 *     tags: [Projects]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *       - in: path
 *         name: contactId
 *         required: true
 *         schema:
 *           type: string
 *         description: Contact ID
 *       - in: path
 *         name: contactType
 *         required: true
 *         schema:
 *           type: string
 *         description: Contact type/role
 *     responses:
 *       204:
 *         description: Contact successfully removed
 *       400:
 *         description: Missing required parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not authorized to remove contacts from this project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Contact not found for this project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * 
 * /api/v1/projects/{id}/technologies:
 *   get:
 *     summary: Get project technologies
 *     description: Retrieves all technologies associated with the project
 *     tags: [Projects]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: List of project technologies
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProjectTechnology'
 *       403:
 *         description: Not authorized to view this project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   
 *   post:
 *     summary: Add technology to project
 *     description: Associates a technology with the project. Can add new technology or reference existing one.
 *     tags: [Projects]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Technology name (required if technologyId not provided)
 *               type:
 *                 type: string
 *                 description: Technology type (required if technologyId not provided)
 *               version:
 *                 type: string
 *                 description: Technology version
 *               technologyId:
 *                 type: string
 *                 description: Existing technology ID (alternative to name/type)
 *               source:
 *                 type: string
 *                 default: user-entered
 *                 description: Source of the technology information
 *     responses:
 *       201:
 *         description: Technology successfully added
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProjectTechnology'
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not authorized to add technologies to this project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Specified technology does not exist
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Technology with this version already exists for this project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * 
 * /api/v1/projects/{id}/technologies/{projectTechnologyId}:
 *   put:
 *     summary: Update project technology version
 *     description: Updates the version of a technology associated with the project
 *     tags: [Projects]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *       - in: path
 *         name: projectTechnologyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project technology association ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               version:
 *                 type: string
 *                 description: New technology version
 *     responses:
 *       200:
 *         description: Technology version successfully updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProjectTechnology'
 *       403:
 *         description: Not authorized to update technologies for this project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Technology association not found for this project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Technology with this version already exists for this project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   
 *   delete:
 *     summary: Remove technology from project
 *     description: Removes a technology association from the project
 *     tags: [Projects]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *       - in: path
 *         name: projectTechnologyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project technology association ID
 *     responses:
 *       204:
 *         description: Technology successfully removed
 *       403:
 *         description: Not authorized to remove technologies from this project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Technology association not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * 
 * /api/v1/projects/graph:
 *   get:
 *     summary: Get company-wide project dependency graph
 *     description: Retrieves project nodes and relationship edges for a company's dependency graph visualization
 *     tags: [Projects]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID to get project graph for
 *     responses:
 *       200:
 *         description: Project graph data with nodes and edges
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 nodes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       type:
 *                         type: string
 *                         example: default
 *                       data:
 *                         type: object
 *                         properties:
 *                           label:
 *                             type: string
 *                       position:
 *                         type: object
 *                         properties:
 *                           x:
 *                             type: number
 *                           y:
 *                             type: number
 *                 edges:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       source:
 *                         type: string
 *                       target:
 *                         type: string
 *                       label:
 *                         type: string
 *                       type:
 *                         type: string
 *                         example: default
 *       400:
 *         description: Company ID is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not a member of this company
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * 
 * /api/v1/projects/{id}/graph:
 *   get:
 *     summary: Get project-specific dependency mini-graph
 *     description: Retrieves a focused dependency graph for a specific project showing its immediate relationships
 *     tags: [Projects]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project mini-graph data with nodes and edges
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 nodes:
 *                   type: array
 *                   items:
 *                     type: object
 *                 edges:
 *                   type: array
 *                   items:
 *                     type: object
 *       403:
 *         description: Not authorized to view this project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Project not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/authMiddleware.js';
import { getVisibleResourceIds, hasPermission, isMemberOfCompany } from '../utils/permissions.js';
import { getDescendants } from '../utils/hierarchy.js';
import { decrypt } from '../utils/crypto.js';
import { syncGitHubFindings } from '../utils/findings.js';

const prisma = new PrismaClient();
const router = Router();

// All routes in this file are protected
router.use(protect);

// GET /api/v1/projects/:id - Get a single project with all Stagehand details
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    // Authorization: Check if the user has at least READER access to the project
    const canView = await hasPermission(req.user, ['ADMIN', 'EDITOR', 'READER'], 'project', id);
    if (!canView) {
        return res.status(403).json({ error: 'You are not authorized to view this project.' });
    }

    try {
        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                team: {
                    include: {
                        company: {
                            include: {
                                organization: true
                            }
                        }
                    }
                },
                contacts: {
                    include: {
                        contact: true,
                    }
                },
                technologies: { include: { technology: true } },
                dependencies: true,
            }
        });

        if (!project) {
            return res.status(404).json({ error: 'Project not found.' });
        }

        // --- Start: Enrich Contacts with User and Membership info ---
        if (project.contacts && project.contacts.length > 0) {
            const contactEmails = project.contacts.map(c => c.contact.email);

            // Find users that match the contact emails
            const users = await prisma.user.findMany({
                where: { email: { in: contactEmails } },
                select: { id: true, email: true }
            });

            // Find memberships for those users specifically on this project
            const userIds = users.map(u => u.id);
            const memberships = await prisma.membership.findMany({
                where: {
                    projectId: id,
                    userId: { in: userIds }
                },
                select: { userId: true, role: true }
            });

            const usersByEmail = new Map(users.map(u => [u.email, u]));
            const membershipsByUserId = new Map(memberships.map(m => [m.userId, m]));

            // Inject the user and membership info into the contact objects
            project.contacts = project.contacts.map(pc => {
                const user = usersByEmail.get(pc.contact.email);
                const projectMembership = user ? membershipsByUserId.get(user.id) : null;
                return {
                    ...pc,
                    user: user || null,
                    projectMembership: projectMembership || null,
                };
            });
        }
        // --- End: Enrich Contacts ---

        res.status(200).json(project);

    } catch (error) {
        console.error('Get project error:', error);
        res.status(500).json({ error: 'Failed to get project.' });
    }
});

// GET /api/v1/projects - List all projects a user has access to
router.get('/', async (req, res) => {
    try {
        const visibleProjectIds = await getVisibleResourceIds(req.user, 'project');
        const projects = await prisma.project.findMany({
            where: { id: { in: visibleProjectIds } }
        });
        res.status(200).json(projects);
    } catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({ error: 'Failed to retrieve projects.' });
    }
});

// POST /api/v1/projects - Create a new project
router.post('/', async (req, res) => {
    const { name, description, teamId } = req.body;

    if (!name || !teamId) {
        return res.status(400).json({ error: 'Name and teamId are required.' });
    }

    // Authorization: User must be ADMIN or EDITOR of the parent team.
    const canCreate = await hasPermission(req.user, ['ADMIN', 'EDITOR'], 'team', teamId);
    if (!canCreate) {
        return res.status(403).json({ error: 'You are not authorized to create a project in this team.' });
    }
    
    try {
        const newProject = await prisma.project.create({
            data: { name, description, teamId }
        });

        // The creator automatically becomes an ADMIN of the new project.
        await prisma.membership.create({
            data: {
                userId: req.user.id,
                projectId: newProject.id,
                role: 'ADMIN'
            }
        });

        res.status(201).json(newProject);

    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({ error: 'Failed to create project.' });
    }
});

// PUT /api/v1/projects/:id - Update a project
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { 
        name, description, applicationUrl, version, deploymentStatus, 
        repositoryUrl, ciCdPipelineUrl, projectType, dataClassification, 
        applicationCriticality, isExternallyExposed, communicationChannel, 
        documentationUrl, apiReferenceUrl, runbookUrl, threatModelUrl, 
        lastSecurityReview 
    } = req.body;

    // Authorization: User must be an ADMIN or EDITOR of the project to update it.
    const canUpdate = await hasPermission(req.user, ['ADMIN', 'EDITOR'], 'project', id);
    if (!canUpdate) {
        return res.status(403).json({ error: 'You are not authorized to update this project.' });
    }

    try {
        const updatedProject = await prisma.project.update({
            where: { id },
            data: { 
                name, 
                description,
                applicationUrl,
                version,
                deploymentStatus,
                repositoryUrl,
                ciCdPipelineUrl,
                projectType,
                dataClassification,
                applicationCriticality,
                isExternallyExposed,
                communicationChannel,
                documentationUrl,
                apiReferenceUrl,
                runbookUrl,
                threatModelUrl,
                lastSecurityReview: lastSecurityReview ? new Date(lastSecurityReview) : null,
            }
        });
        res.status(200).json(updatedProject);
    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({ error: 'Failed to update project.' });
    }
});

// DELETE /api/v1/projects/:id - Delete a project
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    // Authorization: User must be an ADMIN of the project to delete it.
    const canDelete = await hasPermission(req.user, 'ADMIN', 'project', id);
    if (!canDelete) {
        return res.status(403).json({ error: 'You are not authorized to delete this project.' });
    }

    try {
        await prisma.project.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({ error: 'Failed to delete project.' });
    }
});

// GET /api/v1/projects/:id/members - Get all users with access to the project
router.get('/:id/members', async (req, res) => {
    const { id } = req.params;

    const canView = await hasPermission(req.user, ['ADMIN', 'EDITOR', 'READER'], 'project', id);
    if (!canView) {
        return res.status(403).json({ error: 'You are not authorized to view this project.' });
    }

    try {
        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                team: { include: { company: { include: { organization: true } } } }
            }
        });

        if (!project) {
            return res.status(404).json({ error: 'Project not found.' });
        }

        const orgId = project.team.company.organization.id;

        // Find all members of the parent organization
        const orgMemberships = await prisma.membership.findMany({
            where: { organizationId: orgId },
            include: { user: { select: { id: true, email: true } } }
        });
        
        // Get contacts already on the project to filter them out
        const projectContacts = await prisma.projectContact.findMany({
            where: { projectId: id },
            include: { contact: true }
        });
        const existingContactEmails = new Set(projectContacts.map(pc => pc.contact.email));

        const members = orgMemberships
            .map(m => m.user)
            .filter(user => user && !existingContactEmails.has(user.email));

        res.status(200).json(members);
    } catch (error) {
        console.error(`Error getting project members for project ${id}:`, error);
        res.status(500).json({ error: 'Failed to retrieve project members.' });
    }
});

// POST /api/v1/projects/:id/contacts - Add a contact to a project
router.post('/:id/contacts', async (req, res) => {
    const { id: projectId } = req.params;
    const { email, name, role } = req.body;

    if (!email || !name || !role) {
        return res.status(400).json({ error: 'Email, name, and role are required fields.' });
    }

    const canUpdate = await hasPermission(req.user, ['ADMIN', 'EDITOR'], 'project', projectId);
    if (!canUpdate) {
        return res.status(403).json({ error: 'You are not authorized to add contacts to this project.' });
    }

    try {
        // Check if a user with this email exists in the system
        const user = await prisma.user.findUnique({ where: { email } });

        const contact = await prisma.contact.upsert({
            where: { email },
            update: { name }, // Update name if email already exists
            create: { 
                email, 
                name,
                userId: user ? user.id : null,
            },
        });

        // If the contact was just created and we found a user, connect them.
        if (user && !contact.userId) {
            await prisma.contact.update({
                where: { id: contact.id },
                data: { userId: user.id }
            });
        }

        // Check if this contact is already associated with the project
        const existingProjectContact = await prisma.projectContact.findFirst({
            where: { projectId, contactId: contact.id }
        });

        if (existingProjectContact) {
            return res.status(409).json({ error: `Contact with email ${contact.email} is already associated with this project.` });
        }

        const newContact = await prisma.projectContact.create({
            data: {
                projectId,
                contactId: contact.id,
                contactType: role,
            },
            include: {
                contact: true // Include the full contact details in the response
            }
        });

        res.status(201).json(newContact);

    } catch (error) {
        if (error.code === 'P2002') { // Unique constraint violation
            return res.status(409).json({ error: `A contact with the role '${role}' already exists for this project.` });
        }
        console.error(`Error adding contact to project ${projectId}:`, error);
        res.status(500).json({ error: 'Failed to add contact.' });
    }
});

// PUT /api/v1/projects/:projectId/contacts/:contactId - Update a project contact
router.put('/:projectId/contacts/:contactId', async (req, res) => {
    const { projectId, contactId } = req.params;
    const { name, oldContactType, newContactType } = req.body;

    if (!name || !oldContactType || !newContactType) {
        return res.status(400).json({ error: 'Name, oldContactType, and newContactType are required.' });
    }

    const canUpdate = await hasPermission(req.user, ['ADMIN', 'EDITOR'], 'project', projectId);
    if (!canUpdate) {
        return res.status(403).json({ error: 'You are not authorized to update contacts for this project.' });
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Update the name on the base Contact model
            await tx.contact.update({
                where: { id: contactId },
                data: { name },
            });

            // 2. If the role/type has changed, we must delete and recreate the ProjectContact
            if (oldContactType !== newContactType) {
                await tx.projectContact.delete({
                    where: {
                        projectId_contactId_contactType: {
                            projectId,
                            contactId,
                            contactType: oldContactType,
                        }
                    },
                });

                const newProjectContact = await tx.projectContact.create({
                    data: {
                        projectId,
                        contactId,
                        contactType: newContactType,
                    },
                    include: { contact: true },
                });
                return newProjectContact;
            } else {
                // 3. If only the name was changed, just return the existing record
                const existing = await tx.projectContact.findUnique({
                     where: {
                        projectId_contactId_contactType: {
                            projectId,
                            contactId,
                            contactType: oldContactType,
                        }
                    },
                    include: { contact: true },
                });
                return existing;
            }
        });
        res.status(200).json(result);
    } catch (error) {
         if (error.code === 'P2002') { // Unique constraint violation on create
            return res.status(409).json({ error: `A contact with the role '${newContactType}' already exists for this project.` });
        }
        console.error(`Error updating contact ${contactId} for project ${projectId}:`, error);
        res.status(500).json({ error: 'Failed to update contact.' });
    }
});

// DELETE /api/v1/projects/:id/contacts/:contactId/:contactType - Remove a contact from a project
router.delete('/:id/contacts/:contactId/:contactType', async (req, res) => {
    const { id: projectId, contactId, contactType } = req.params;

    if (!contactId || !contactType) {
        return res.status(400).json({ error: 'contactId and contactType are required.' });
    }

    const canUpdate = await hasPermission(req.user, ['ADMIN', 'EDITOR'], 'project', projectId);
    if (!canUpdate) {
        return res.status(403).json({ error: 'You are not authorized to remove contacts from this project.' });
    }

    try {
        await prisma.projectContact.delete({
            where: {
                projectId_contactId_contactType: {
                    projectId,
                    contactId,
                    contactType,
                }
            },
        });
        res.status(204).send();
    } catch (error) {
        if (error.code === 'P2025') { // Record to delete not found
            return res.status(404).json({ error: 'Contact not found for this project.' });
        }
        console.error(`Error removing contact from project ${projectId}:`, error);
        res.status(500).json({ error: 'Failed to remove contact.' });
    }
});

// --- Technology Management for a Project ---

// GET /api/v1/projects/:id/technologies - Get all technologies for a project
router.get('/:id/technologies', async (req, res) => {
    const { id: projectId } = req.params;

    const canView = await hasPermission(req.user, ['ADMIN', 'EDITOR', 'READER'], 'project', projectId);
    if (!canView) {
        return res.status(403).json({ error: 'You are not authorized to view this project.' });
    }

    try {
        const technologies = await prisma.projectTechnology.findMany({
            where: { projectId },
            include: {
                technology: true
            }
        });
        res.status(200).json(technologies);
    } catch (error) {
        console.error(`Error getting technologies for project ${projectId}:`, error);
        res.status(500).json({ error: 'Failed to retrieve technologies.' });
    }
});

// POST /api/v1/projects/:id/technologies - Add a technology to a project
router.post('/:id/technologies', async (req, res) => {
    const { id: projectId } = req.params;
    const { name, type, version, technologyId, source } = req.body;

    if ((!name || !type) && !technologyId) {
        return res.status(400).json({ error: 'Technology name and type are required.' });
    }

    const canUpdate = await hasPermission(req.user, ['ADMIN', 'EDITOR'], 'project', projectId);
    if (!canUpdate) {
        return res.status(403).json({ error: 'You are not authorized to add technologies to this project.' });
    }

    let technology; // Define here to be available in the catch block

    try {
        if (technologyId) {
            // Case 1: Adding a new version to an existing technology
            technology = await prisma.technology.findUnique({ where: { id: technologyId } });
            if (!technology) {
                return res.status(404).json({ error: 'The specified technology does not exist.' });
            }
        } else if (name && type) {
            // Case 2: Adding a new technology or a version of a potentially existing one
            // Upsert the technology: find it by name/type or create it if it doesn't exist
            technology = await prisma.technology.upsert({
                where: { name_type: { name, type } },
                update: {},
                create: { name, type },
            });
        } else {
            // If neither technologyId nor name/type is provided
            return res.status(400).json({ error: 'Either technologyId or both name and type are required.' });
        }
        
        // Now, create the link between the project and the technology
        const newProjectTechnology = await prisma.projectTechnology.create({
            data: {
                projectId,
                technologyId: technology.id,
                version,
                source: source || 'user-entered',
            },
            include: {
                technology: true, // Include the full technology details in the response
            },
        });

        res.status(201).json(newProjectTechnology);
    } catch (error) {
        if (error.code === 'P2002' && technology) {
            // Unique constraint violation
             return res.status(409).json({ error: `This project already has a record for technology '${technology.name}' (${technology.type}) with version '${version}'.` });
        }
        console.error(`Error adding technology to project ${projectId}:`, error);
        res.status(500).json({ error: 'Failed to add technology.' });
    }
});

// PUT /api/v1/projects/:id/technologies/:projectTechnologyId - Update a technology's version for a project
router.put('/:id/technologies/:projectTechnologyId', async (req, res) => {
    const { id: projectId, projectTechnologyId } = req.params;
    const { version } = req.body;

    const canUpdate = await hasPermission(req.user, ['ADMIN', 'EDITOR'], 'project', projectId);
    if (!canUpdate) {
        return res.status(403).json({ error: 'You are not authorized to update technologies for this project.' });
    }

    try {
        const updatedProjectTechnology = await prisma.projectTechnology.update({
            where: { 
                id: projectTechnologyId,
                projectId: projectId, // Extra check to ensure it belongs to the project
            },
            data: {
                version,
            },
            include: {
                technology: true,
            }
        });
        res.status(200).json(updatedProjectTechnology);
    } catch (error) {
        if (error.code === 'P2025') { // Record to update not found
            return res.status(404).json({ error: 'Technology association not found for this project.' });
        }
        if (error.code === 'P2002') { // Unique constraint violation
             return res.status(409).json({ error: `This project already has a record for this technology with version '${version}'.` });
        }
        console.error(`Error updating technology version for project ${projectId}:`, error);
        res.status(500).json({ error: 'Failed to update technology version.' });
    }
});

// DELETE /api/v1/projects/:id/technologies/:projectTechnologyId - Remove a technology from a project
router.delete('/:id/technologies/:projectTechnologyId', async (req, res) => {
    const { id: projectId, projectTechnologyId } = req.params;

    const canUpdate = await hasPermission(req.user, ['ADMIN', 'EDITOR'], 'project', projectId);
    if (!canUpdate) {
        return res.status(403).json({ error: 'You are not authorized to remove technologies from this project.' });
    }

    try {
        await prisma.projectTechnology.delete({
            where: { 
                id: projectTechnologyId,
                projectId: projectId, // Extra check
             }
        });
        res.status(204).send();
    } catch (error) {
        if (error.code === 'P2025') { // Record to delete not found
            return res.status(404).json({ error: 'Technology association not found.' });
        }
        console.error(`Error removing technology from project ${projectId}:`, error);
        res.status(500).json({ error: 'Failed to remove technology.' });
    }
});

// GET endpoint for company-wide project graph data
router.get('/graph', async (req, res) => {
    const { companyId } = req.query;
    const userId = req.user.id;

    if (!companyId) {
        return res.status(400).json({ error: 'A company ID is required.' });
    }

    // Authorize: Check if user is part of the company
    const isMember = await isMemberOfCompany(userId, companyId);
    if (!isMember) {
        return res.status(403).json({ error: 'You are not a member of this company.' });
    }

    try {
        const projects = await prisma.project.findMany({
            where: { team: { companyId: companyId } },
        });

        const relationships = await prisma.projectRelationship.findMany({
            where: { sourceProject: { team: { companyId: companyId } } },
        });

        const nodes = projects.map(project => ({
            id: project.id,
            type: 'default',
            data: { label: project.name },
            position: { x: Math.random() * 400, y: Math.random() * 400 },
        }));

        const edges = relationships.map(rel => ({
            id: rel.id,
            source: rel.sourceProjectId,
            target: rel.targetProjectId,
            label: rel.type,
            type: 'default',
            style: { strokeWidth: 4 },
            markerEnd: { type: 'arrowclosed', width: 25, height: 25 },
        }));

        res.json({ nodes, edges });
    } catch (error) {
        console.error('Failed to fetch company graph:', error);
        res.status(500).json({ error: 'Failed to fetch company graph data.' });
    }
});

// GET endpoint for project-specific "mini-graph"
router.get('/:id/graph', async (req, res) => {
    const { id: projectId } = req.params;
    const userId = req.user.id;

    try {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { team: true },
        });

        if (!project) {
            return res.status(404).json({ error: 'Project not found.' });
        }

        const isMember = await isMemberOfCompany(userId, project.team.companyId);
        if (!isMember) {
            return res.status(403).json({ error: 'You are not authorized to view this project.' });
        }

        const relationships = await prisma.projectRelationship.findMany({
            where: {
                OR: [
                    { sourceProjectId: projectId },
                    { targetProjectId: projectId },
                ],
            },
        });

        const relatedProjectIds = new Set([projectId]);
        relationships.forEach(rel => {
            relatedProjectIds.add(rel.sourceProjectId);
            relatedProjectIds.add(rel.targetProjectId);
        });

        const relatedProjects = await prisma.project.findMany({
            where: { id: { in: [...relatedProjectIds] } },
        });

        const nodes = relatedProjects.map(p => ({
            id: p.id,
            type: 'default', // All nodes are default to have both handles
            data: { 
              label: p.name,
              isPrimary: p.id === projectId // Flag for styling the main project
            },
            position: { x: Math.random() * 250, y: Math.random() * 250 },
        }));

        const edges = relationships.map(rel => ({
            id: rel.id,
            source: rel.sourceProjectId,
            target: rel.targetProjectId,
            label: rel.type,
            style: { strokeWidth: 2 },
            markerEnd: { type: 'arrowclosed', width: 25, height: 25 },
        }));

        res.json({ nodes, edges });
    } catch (error) {
        console.error('Failed to fetch project graph:', error);
        res.status(500).json({ error: 'Failed to fetch project graph data.' });
    }
});

/**
 * @route GET /api/v1/projects/by-resource
 * @desc Get a flat list of all projects within a given resource's hierarchy
 * @access Private
 */
router.get('/by-resource', async (req, res) => {
    const { resourceType, resourceId } = req.query;

    if (!resourceType || !resourceId) {
        return res.status(400).json({ error: 'resourceType and resourceId query parameters are required.' });
    }

    // First, ensure the user has permission to view the parent resource
    const canView = await hasPermission(req.user, ['ADMIN', 'EDITOR', 'READER'], resourceType, resourceId);
    if (!canView) {
        return res.status(403).json({ error: `You are not authorized to view projects for this ${resourceType}.` });
    }

    try {
        let allProjectIds = [];
        
        if (resourceType === 'project') {
            allProjectIds = [resourceId];
        } else {
            const descendantIds = await getDescendants(resourceType, resourceId);
            allProjectIds = descendantIds.projectIds;
        }

        const projects = await prisma.project.findMany({
            where: {
                id: { in: allProjectIds }
            },
            select: {
                id: true,
                name: true,
                repositoryUrl: true,
            },
            orderBy: {
                name: 'asc'
            }
        });

        res.status(200).json(projects);

    } catch (error) {
        console.error(`Get projects for ${resourceType} error:`, error);
        res.status(500).json({ error: 'Failed to retrieve projects.' });
    }
});

/**
 * @route POST /api/v1/projects/:id/link-repo
 * @desc Link a repository to a project
 * @access Private
 */
router.post('/:id/link-repo', async (req, res) => {
    const { id } = req.params;
    const { repositoryUrl, scmIntegrationId } = req.body;

    if (!repositoryUrl || !scmIntegrationId) {
        return res.status(400).json({ error: 'repositoryUrl and scmIntegrationId are required.' });
    }
    
    // Authorization: Check if the user is an ADMIN or EDITOR of the project.
    const canUpdate = await hasPermission(req.user, ['ADMIN', 'EDITOR'], 'project', id);
    if (!canUpdate) {
        return res.status(403).json({ error: 'You are not authorized to update this project.' });
    }

    try {
        const updatedProject = await prisma.project.update({
            where: { id },
            data: { 
                repositoryUrl,
                scmIntegrationId,
            }
        });

        res.status(200).json(updatedProject);

    } catch (error) {
        console.error('Link repo error:', error);
        res.status(500).json({ error: 'Failed to link repository.' });
    }
});

/**
 * @route GET /api/v1/projects/:id/repo-stats
 * @desc Get repository statistics from the linked SCM provider
 * @access Private
 */
router.get('/:id/repo-stats', async (req, res) => {
    const { id: projectId } = req.params;

    // Authorization check
    const canView = await hasPermission(req.user, ['ADMIN', 'EDITOR', 'READER'], 'project', projectId);
    if (!canView) {
        return res.status(403).json({ error: 'You are not authorized to view this project.' });
    }

    try {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { repositoryUrl: true, scmIntegrationId: true }
        });

        if (!project || !project.scmIntegrationId || !project.repositoryUrl) {
            return res.status(404).json({ error: 'Project is not linked to a repository via an SCM integration.' });
        }

        const integration = await prisma.sCMIntegration.findUnique({
            where: { id: project.scmIntegrationId }
        });

        if (!integration) {
            // This case indicates orphaned data, but we handle it gracefully.
            return res.status(404).json({ error: 'Associated SCM integration not found.' });
        }

        const accessToken = decrypt(integration.encryptedAccessToken);

        // Extract owner/repo from URL, e.g., "https://github.com/owner/repo"
        const urlParts = new URL(project.repositoryUrl);
        const pathParts = urlParts.pathname.split('/').filter(p => p);
        if (urlParts.hostname !== 'github.com' || pathParts.length < 2) {
            return res.status(400).json({ error: 'Invalid or non-GitHub repository URL format.' });
        }
        const owner = pathParts[0];
        const repo = pathParts[1].replace('.git', '');


        // Fetch repo details from GitHub API
        const repoDetailsResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
            headers: {
                'Authorization': `token ${accessToken}`,
                'Accept': 'application/vnd.github.v3+json',
            },
        });

        if (!repoDetailsResponse.ok) {
            const errorData = await repoDetailsResponse.json();
            console.error('GitHub Repo Stats Fetch Error:', errorData);
            return res.status(repoDetailsResponse.status).json({ error: 'Failed to fetch repository details from GitHub.', details: errorData.message });
        }

        const repoData = await repoDetailsResponse.json();

        // Extract and return the stats we care about
        const stats = {
            stars: repoData.stargazers_count,
            forks: repoData.forks_count,
            openIssues: repoData.open_issues_count,
            pushedAt: repoData.pushed_at,
            license: repoData.license?.name,
            visibility: repoData.visibility,
        };

        res.status(200).json(stats);

    } catch (error) {
        console.error(`Get repo stats error for project ${projectId}:`, error);
        res.status(500).json({ error: 'Failed to retrieve repository statistics.' });
    }
});

/**
 * @route POST /api/v1/projects/:projectId/link-security-tool
 * @desc Link a project to a security tool and its specific project ID
 * @access Private
 */
router.post('/:projectId/link-security-tool', protect, async (req, res) => {
  const { projectId } = req.params;
  const { securityToolIntegrationId, provider, toolSpecificId } = req.body;

  if (!securityToolIntegrationId || !provider || !toolSpecificId) {
    return res.status(400).json({ error: 'Missing required fields for linking.' });
  }

  try {
    const canEdit = await hasPermission(req.user, ['ADMIN', 'EDITOR'], 'project', projectId);
    if (!canEdit) {
      return res.status(403).json({ error: 'You are not authorized to modify this project.' });
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }
    
    // Merge the new tool ID into the existing JSON object
    const updatedToolIds = {
      ...project.toolSpecificIds,
      [provider.toLowerCase()]: toolSpecificId
    };

    await prisma.project.update({
      where: { id: projectId },
      data: {
        securityToolIntegrationId, // Link to the main integration
        toolSpecificIds: updatedToolIds
      },
    });

    res.status(200).json({ message: 'Project linked successfully.' });

  } catch (error) {
    console.error(`Failed to link project ${projectId} to security tool:`, error);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
});

export default router; 