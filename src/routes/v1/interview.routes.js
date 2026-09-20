import express from 'express';
import * as interviewController from '../../controllers/interview.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  updateInterviewSchema,
  queryInterviewsSchema,
  upcomingInterviewsSchema,
  mongoIdParamSchema,
} from '../../validators/interview.validator.js';

const router = express.Router();

// All interview routes require authentication
router.use(authenticate);

// 1. Static routes FIRST to guarantee route precedence
router.get(
  '/upcoming',
  validate(upcomingInterviewsSchema),
  interviewController.getUpcomingInterviews
);

router.get(
  '/',
  validate(queryInterviewsSchema),
  interviewController.getAllInterviews
);

// 2. Dynamic parameterized routes AFTER static routes
router.get(
  '/:id',
  validate(mongoIdParamSchema),
  interviewController.getInterviewById
);

router.patch(
  '/:id',
  validate(updateInterviewSchema),
  interviewController.updateInterview
);

router.delete(
  '/:id',
  validate(mongoIdParamSchema),
  interviewController.deleteInterview
);

export default router;
