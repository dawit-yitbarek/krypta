import { Router } from 'express';
import { fetchCandleDataHistory } from '../controllers/candleController.js';

const router = Router();

router.get('/', fetchCandleDataHistory);

export default router;