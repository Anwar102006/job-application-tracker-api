import express from 'express';
import * as userController from '../../controllers/user.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  updateProfileSchema,
  changePasswordSchema,
} from '../../validators/user.validator.js';

const router = express.Router();

router.use(authenticate);

router.get('/me', userController.getProfile);

router.patch(
  '/me',
  validate(updateProfileSchema),
  userController.updateProfile
);

router.patch(
  '/change-password',
  validate(changePasswordSchema),
  userController.changePassword
);

export default router;
