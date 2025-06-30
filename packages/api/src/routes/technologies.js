/**
 * @openapi
 * tags:
 *   - name: Technologies
 *     description: Technology search and autocomplete functionality
 * 
 * components:
 *   schemas:
 *     Technology:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Technology ID
 *         name:
 *           type: string
 *           description: Technology name
 *         type:
 *           type: string
 *           description: Technology type/category
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 * 
 * /api/v1/technologies/search:
 *   get:
 *     summary: Search technologies
 *     description: Searches for technologies by name with autocomplete functionality
 *     tags: [Technologies]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *         description: Search query for technology name
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 50
 *         description: Maximum number of results to return
 *     responses:
 *       200:
 *         description: List of matching technologies
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Technology'
 *       400:
 *         description: Search query is required
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

const prisma = new PrismaClient();
const router = Router();

// All routes in this file are protected
router.use(protect);

// GET /api/v1/technologies - Search for technologies
router.get('/', async (req, res) => {
  const { search } = req.query;

  try {
    const technologies = await prisma.technology.findMany({
      where: {
        name: {
          contains: search || '',
          mode: 'insensitive', // Case-insensitive search
        },
      },
      take: 10, // Limit the number of results for autocomplete performance
    });
    res.status(200).json(technologies);
  } catch (error) {
    console.error('Search technologies error:', error);
    res.status(500).json({ error: 'Failed to search for technologies.' });
  }
});

export default router; 