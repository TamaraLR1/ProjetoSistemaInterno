import { Router } from 'express';
import { moveStock, getStockHistory } from '../controllers/inventory.controller';
import { protect } from '../middlewares/auth.middleware'; // Seu middleware de JWT

const router = Router();

// Todas as rotas de estoque exigem login
router.post('/move', protect, moveStock);
router.get('/history', protect, getStockHistory);

export default router;