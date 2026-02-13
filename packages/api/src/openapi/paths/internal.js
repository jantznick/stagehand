/**
 * @openapi
 * tags:
 *   name: Internal
 *   description: Internal-only endpoints for service-to-service communication. Not for public use.
 */
export const internalPaths = {
  "/internal/scans/{scanId}/report": {
    post: {
      summary: "Report scan results",
      description: "An internal endpoint for scanner services to report back their results upon completion. This endpoint is protected by a shared secret.",
      tags: ["Internal"],
      parameters: [
        {
          in: "path",
          name: "scanId",
          required: true,
          schema: { type: "string" },
          description: "The ID of the scan execution this report belongs to.",
        },
        {
          in: "header",
          name: "X-Internal-Secret",
          required: true,
          schema: { type: "string" },
          description: "The shared secret to authenticate the internal service.",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                provider: { type: "string", example: "Semgrep" },
                results: {
                  type: "array",
                  items: { type: "object" },
                  description: "An array of finding objects from the scanner.",
                },
                error: {
                  type: "string",
                  description: "An error message if the scan failed.",
                },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Report received successfully." },
        403: { description: "Forbidden. The internal secret was invalid or missing." },
      },
    },
  },
};
