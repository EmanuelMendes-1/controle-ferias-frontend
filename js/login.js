const $ = (sel) => document.querySelector(sel);
const toast = $('#toast');

function mostrarToast(msg, tipo = 'ok') {
    toast.textContent = msg;
    toast.className = `toast ${tipo}`;
    setTimeout(() => toast.classList.add('hidden'), 3500);
}

redirecionarSeLogado();

$('#form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        const res = await fetch(API_BASE + '/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                login: $('#login-usuario').value.trim(),
                senha: $('#login-senha').value
            })
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
            throw new Error(body.message || 'Credenciais inválidas');
        }
        salvarSessao(body);
        window.location.href = 'index.html';
    } catch (err) {
        mostrarToast(err.message, 'erro');
    }
});
