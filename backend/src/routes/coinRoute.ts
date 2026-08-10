import { Router } from 'express';
import { getTopMarketCapCoins } from '../controllers/coinController.js';

const router = Router();

router.get('/', getTopMarketCapCoins);

export default router;