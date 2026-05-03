// 1. Definição Global de Ambiente (Verifica se é localhost E qual a porta)
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const isDevPort = window.location.port === '8001';

window.isDev = isLocal && isDevPort;

// 2. Definição de URLs Base
// Se estiver na porta 8001 (Dev), aponta para a API 5001
// Se estiver na porta 8000 (Prod Local), aponta para a API 5000
// Se estiver na web, aponta para o domínio oficial
window.API_URL = window.isDev 
    ? 'http://localhost:5001/api' 
    : (isLocal ? 'http://localhost:5000/api' : 'https://ecommerceback.tamaralr.com.br/api');

window.IMG_BASE_URL = window.isDev 
    ? 'http://localhost:5001/uploads' 
    : (isLocal ? 'http://localhost:5000/uploads' : 'https://ecommerceback.tamaralr.com.br/uploads');

window.APP_NAME = "Meu Ecommerce";

console.log(`Ambiente: ${window.isDev ? 'DESENVOLVIMENTO (Porta 5001)' : 'PRODUÇÃO'}`);