// user.routes.ts

import { Router } from 'express';
import { registerUser, getUserInfo, updateUserInfo } from '../controllers/user.controller'; // [ALTERADO] Importar getUserInfo
import { protect } from '../middlewares/auth.middleware'; // [NOVO] Importar o middleware de proteção

const router = Router();

// Rota pública de cadastro
router.post('/register', registerUser);

// [NOVO] Rota Protegida: /api/user/info
router.get('/user/info', protect, getUserInfo);

// Rota para atualizar (PUT)
router.put('/user/update', protect, updateUserInfo);

export default router;