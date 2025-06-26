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