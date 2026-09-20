import express from 'express';
import * as applicationController from '../../controllers/application.controller.js';
import * as interviewController from '../../controllers/interview.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  createApplicationSchema,
  updateApplicationSchema,
  mongoIdParamSchema,
  queryApplicationsSchema,
} from '../../validators/application.validator.js';
import {
  createInterviewSchema,
  applicationIdParamSchema,
} from '../../validators/interview.validator.js';

const router = express.Router();

// All application routes require authentication
router.use(authenticate);

// Static / collection-level routes first
router.post(
  '/',
  validate(createApplicationSchema),
  applicationController.createApplication
);

router.get(
  '/',
  validate(queryApplicationsSchema),
  applicationController.getApplications
);

// Specific subpath routes before generic parameterized routes
router.patch(
  '/:id/archive',
  validate(mongoIdParamSchema),
  applicationController.toggleArchiveApplication
);

// Nested interview routes
router.post(
  '/:applicationId/interviews',
  validate(createInterviewSchema),
  interviewController.createInterview
);

router.get(
  '/:applicationId/interviews',
  validate(applicationIdParamSchema),
  interviewController.getInterviewsByApplication
);

// Dynamic parameterized routes
router.get(
  '/:id',
  validate(mongoIdParamSchema),
  applicationController.getApplicationById
);

router.patch(
  '/:id',
  validate(updateApplicationSchema),
  applicationController.updateApplication
);

router.delete(
  '/:id',
  validate(mongoIdParamSchema),
  applicationController.deleteApplication
);

export default router;
