// user.routes.ts

import { Router, RequestHandler } from 'express';
import { registerUser, getUserInfo, updateUserInfo } from '../controllers/user.controller'; // [ALTERADO] Importar getUserInfo
import { protect } from '../middlewares/auth.middleware';
import { parseUpload } from '../middlewares/upload.middleware';

const router = Router();

// Rota pública de cadastro
router.post('/register', registerUser);

// [NOVO] Rota Protegida: /api/user/info
router.get('/user/info', protect, getUserInfo);

// Rota para atualizar (PUT)
router.put('/user/update', [ protect, parseUpload('avatar', 1), updateUserInfo ] as RequestHandler[]);


export default router;