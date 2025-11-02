import { Router } from "express";
import { waitlistController } from "../controllers/waitlist.controller.js";

const waitlistRouter = Router()

waitlistRouter.post('/waitlist', waitlistController)

export default waitlistRouter