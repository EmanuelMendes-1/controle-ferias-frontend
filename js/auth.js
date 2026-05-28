const AUTH_KEY = 'ferias_auth';

function salvarSessao(dados) {
    sessionStorage.setItem(AUTH_KEY, JSON.stringify(dados));
}

function obterSessao() {
    const raw = sessionStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function limparSessao() {
    sessionStorage.removeItem(AUTH_KEY);
}

function exigirLogin() {
    if (!obterSessao()) {
        window.location.href = 'login.html';
    }
}

function redirecionarSeLogado() {
    if (obterSessao()) {
        window.location.href = 'index.html';
    }
}

async function apiAutenticada(url, options = {}) {
    const sessao = obterSessao();
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };
    if (sessao?.token) {
        headers.Authorization = `Bearer ${sessao.token}`;
    }

    const res = await fetch(API_BASE + url, { ...options, headers });
    const body = await res.json().catch(() => ({}));

    if (res.status === 401) {
        limparSessao();
        window.location.href = 'login.html';
        throw new Error('Sessão expirada. Faça login novamente.');
    }

    if (!res.ok) {
        throw new Error(body.message || body.error || 'Erro na requisição');
    }
    return body;
}
