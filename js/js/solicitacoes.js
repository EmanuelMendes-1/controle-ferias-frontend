// solicitações.js
const API_SOLICITACOES = `${API_URL}/solicitacoes-ferias`;

function getToken() {
    return localStorage.getItem('token');
}

function isAdmin() {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    return usuario.id === 1;
}

function getUsuarioId() {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    return usuario.id;
}

function calcularDias(dataInicio, dataFim) {
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    const diffTime = Math.abs(fim - inicio);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

async function criarSolicitacao(dataInicio, dataFim, observacao) {
    const dias = calcularDias(dataInicio, dataFim);
    if (dias > 35) {
        throw new Error('O período de férias não pode ultrapassar 35 dias');
    }
    
    const response = await fetch(API_SOLICITACOES, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ dataInicio, dataFim, observacao })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar solicitação');
    }
    return response.json();
}

async function listarMinhasSolicitacoes() {
    const response = await fetch(`${API_SOLICITACOES}/minhas`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    if (!response.ok) throw new Error('Erro ao listar solicitações');
    return response.json();
}

async function listarTodasSolicitacoes() {
    const response = await fetch(API_SOLICITACOES, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    if (!response.ok) throw new Error('Erro ao listar solicitações');
    return response.json();
}

async function listarPendentes() {
    const response = await fetch(`${API_SOLICITACOES}/pendentes`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    if (!response.ok) throw new Error('Erro ao listar pendentes');
    return response.json();
}

async function aprovarSolicitacao(id) {
    const response = await fetch(`${API_SOLICITACOES}/${id}/aprovar`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    if (!response.ok) throw new Error('Erro ao aprovar');
    return response.json();
}

async function recusarSolicitacao(id, observacao) {
    const response = await fetch(`${API_SOLICITACOES}/${id}/recusar`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ solicitacaoId: id, observacao })
    });
    if (!response.ok) throw new Error('Erro ao recusar');
    return response.json();
}