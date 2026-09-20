import express from 'express';
import authRoutes from './auth.routes.js';
import applicationRoutes from './application.routes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/applications', applicationRoutes);

export default router;
