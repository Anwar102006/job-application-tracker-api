import express from 'express';
import * as analyticsController from '../../controllers/analytics.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { monthlyTrendsQuerySchema } from '../../validators/analytics.validator.js';

const router = express.Router();

router.use(authenticate);

router.get('/overview', analyticsController.getOverview);
router.get('/status-breakdown', analyticsController.getStatusBreakdown);
router.get('/conversion-rates', analyticsController.getConversionRates);
router.get(
  '/monthly-trends',
  validate(monthlyTrendsQuerySchema),
  analyticsController.getMonthlyTrends
);

export default router;
