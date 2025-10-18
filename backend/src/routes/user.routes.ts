// user.routes.ts

import { Router } from 'express';
import { registerUser, getUserInfo } from '../controllers/user.controller'; // [ALTERADO] Importar getUserInfo
import { protect } from '../middlewares/auth.middleware'; // [NOVO] Importar o middleware de proteção

const router = Router();

// Rota pública de cadastro
router.post('/register', registerUser);

// [NOVO] Rota Protegida: /api/user/info
router.get('/user/info', protect, getUserInfo);

export default router;