// server.ts

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser'; // [NOVO]
import userRoutes from './routes/user.routes';
import authRoutes from './routes/auth.routes'; 
import productRoutes from './routes/product.routes'; // [NOVO] Importa as rotas de produto

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configuração do CORS para permitir cookies (credentials)
app.use(cors({
    origin: 'http://localhost:8000', // Ajuste esta porta/URL para o seu frontend
    credentials: true, // [ALTERADO] Permite o envio de cookies
}));

app.use(express.json());
app.use(cookieParser()); // [NOVO] Usar o cookie-parser

app.use('/api', productRoutes);
app.use('/api', userRoutes);
app.use('/api', authRoutes);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});