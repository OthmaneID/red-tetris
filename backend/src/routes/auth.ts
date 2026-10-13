import { Router, type Request, type Response } from "express";
import { request } from "http";


const router: Router = Router()



router.get("/me", (req: Request, res: Response) => {
    res.send("THe me User !")
})

export default router;