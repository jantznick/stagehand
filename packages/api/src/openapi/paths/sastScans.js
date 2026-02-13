/**
 * @openapi
 * tags:
 *   name: SAST Scans
 *   description: Managing SAST (Static Application Security Testing) scans for projects.
 */
export const sastScanPaths = {
  "/projects/{projectId}/sast/scans": {
    post: {
      summary: "Launch a SAST scan",
      description: "Launches a new SAST scan for the specified project. The project must have a repository URL linked.",
      tags: ["SAST Scans"],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: "path",
          name: "projectId",
          required: true,
          schema: { type: "string" },
          description: "The ID of the project to scan.",
        },
      ],
      responses: {
        202: {
          description: "SAST scan successfully queued.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string", example: "SAST scan successfully queued." },
                  scanExecutionId: { type: "string" },
                },
              },
            },
          },
        },
        403: { description: "Access denied." },
        404: { description: "Project not found or repository URL is not configured." },
        500: { description: "An unexpected error occurred." },
      },
    },
    get: {
      summary: "Get SAST scan history",
      description: "Retrieves a list of all SAST scan executions for a project.",
      tags: ["SAST Scans"],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: "path",
          name: "projectId",
          required: true,
          schema: { type: "string" },
          description: "The ID of the project.",
        },
      ],
      responses: {
        200: {
          description: "A list of SAST scan executions.",
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: { $ref: "#/components/schemas/ScanExecution" },
              },
            },
          },
        },
        403: { description: "Access denied." },
      },
    },
  },
};
