/**
 * @fileoverview Defines the authentication routes for authentication to the sentate voting system
 * 
 * @version 1.0.0
 * @date 2025-03-6
 * @author Jason Watson
 */

import { Router } from "express";
import authService from "./auth.service.js";

const router = Router();

router.post('/login', authService.login);
router.get('/logout', authService.logout);