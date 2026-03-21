import { Router } from 'express';
import { addToCart, getCartCount } from '../controllers/cart.controller';
import { protect } from '../middlewares/auth.middleware'; // Seu middleware de JWT

const router = Router();

// Todas as rotas de carrinho precisam de login
router.post('/cart/add', protect, addToCart);
router.get('/cart/count', protect, getCartCount);

export default router;