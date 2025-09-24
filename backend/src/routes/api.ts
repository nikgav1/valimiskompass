import { Router } from "express";
import { computeMatchesFromJson } from "../services/matcher";
import politicians from "../../politicians.json"

const apiRouter = Router()

apiRouter.post('/evaluate', (req, res) => {
    try {
        const answers: number[] = req.body.answers
        const results = computeMatchesFromJson(answers, politicians)
        res.status(200).json(results)
    } catch (err) {
        res.status(500).json({message: "Could not evaluate politicians!"})
    }
})

export default apiRouter