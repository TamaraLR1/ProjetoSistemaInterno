// src/utils/log.util.ts

// Função para logar APENAS se o ambiente for 'development'
export const devLog = (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
        console.log(...args);
    }
};

// Função para logar uma mensagem informativa (em todos os ambientes, se necessário)
export const infoLog = (message: string) => {
    console.info(`[API INFO] ${message}`);
};

// Função para logar erros (SEMPRE ativa)
export const errorLog = (message: string, error: any) => {
    console.error(`[API ERRO] ${message}`, error);
};