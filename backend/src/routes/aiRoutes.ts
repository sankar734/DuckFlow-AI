import { Router } from 'express';
import { aiController } from '../controllers/aiController';
import { authenticate } from '../middleware/authMiddleware';
import { checkAICredits } from '../middleware/planLimitMiddleware';
import { aiLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use(authenticate);
router.use(aiLimiter);

router.post('/documents/generate', checkAICredits(2), (req, res, next) => aiController.generateDocument(req, res, next));
router.post('/writer', checkAICredits(1), (req, res, next) => aiController.aiWriter(req, res, next));
router.post('/summarize', checkAICredits(1), (req, res, next) => aiController.summarize(req, res, next));
router.post('/pdf/chat', checkAICredits(1), (req, res, next) => aiController.chatWithPdf(req, res, next));
router.post('/excel/analyze', checkAICredits(1), (req, res, next) => aiController.analyzeExcel(req, res, next));
router.post('/presentation/generate', checkAICredits(3), (req, res, next) => aiController.generatePresentation(req, res, next));
router.post('/artifact', checkAICredits(2), (req, res, next) => aiController.createArtifact(req, res, next));
router.get('/credits', (req, res, next) => aiController.getCredits(req, res, next));

export default router;
