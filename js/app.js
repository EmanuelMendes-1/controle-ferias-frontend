exigirLogin();

const $ = (sel) => document.querySelector(sel);
const toast = $('#toast');

const sessao = obterSessao();
if (sessao) {
    $('#usuario-logado').textContent = `${sessao.nome} (${sessao.login})`;
}

function mostrarToast(msg, tipo = 'ok') {
    toast.textContent = msg;
    toast.className = `toast ${tipo}`;
    setTimeout(() => toast.classList.add('hidden'), 3500);
}

function formatarData(iso) {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
}

function badgeStatus(status) {
    const map = {
        PENDENTE: 'badge-pendente',
        APROVADA: 'badge-aprovada',
        REJEITADA: 'badge-rejeitada'
    };
    return `<span class="badge ${map[status] || ''}">${status}</span>`;
}

let perfisCache = [];
let funcionariosCache = [];

async function carregarPerfis() {
    const lista = await apiAutenticada('/perfis');
    perfisCache = lista;

    const selectTipo = $('#tipo-funcionario');
    selectTipo.innerHTML = lista.map(p =>
        `<option value="${p.id}">${p.descricao}</option>`
    ).join('');

    const container = $('#lista-perfis');
    if (!lista.length) {
        container.innerHTML = '<p class="vazio">Nenhuma função/perfil cadastrado.</p>';
        return;
    }

    container.innerHTML = lista.map(p => `
        <div class="item">
            <div class="item-info">
                <strong>${p.descricao}</strong>
                <span>ID: ${p.id}</span>
            </div>
            <div class="acoes-inline">
                <button class="btn-editar" data-tipo="perfil" data-id="${p.id}">Editar</button>
                <button class="btn-excluir" data-tipo="perfil" data-id="${p.id}">Excluir</button>
            </div>
        </div>
    `).join('');
}

async function carregarUsuarios() {
    const lista = await apiAutenticada('/usuarios');
    const container = $('#lista-usuarios');

    if (!lista.length) {
        container.innerHTML = '<p class="vazio">Nenhum usuário cadastrado.</p>';
        return;
    }

    container.innerHTML = lista.map(u => `
        <div class="item">
            <div class="item-info">
                <strong>${u.nome} — ${u.login}</strong>
                <span>ID: ${u.id}</span>
            </div>
            <div class="acoes-inline">
                <button class="btn-editar" data-tipo="usuario" data-id="${u.id}">Editar</button>
                <button class="btn-excluir" data-tipo="usuario" data-id="${u.id}">Excluir</button>
            </div>
        </div>
    `).join('');
}

function resetPerfilForm() {
    $('#perfil-id').value = '';
    $('#perfil-descricao').value = '';
    $('#btn-salvar-perfil').textContent = 'Salvar';
}

function resetUsuarioForm() {
    $('#usuario-id').value = '';
    $('#usuario-nome').value = '';
    $('#usuario-login').value = '';
    $('#usuario-senha').value = '';
    $('#btn-salvar-usuario').textContent = 'Salvar usuário';
}

function resetFuncionarioForm() {
    $('#funcionario-id').value = '';
    $('#nome-funcionario').value = '';
    $('#cpf-funcionario').value = '';
    $('#nascimento-funcionario').value = '';
    $('#telefone-funcionario').value = '';
    if (perfisCache.length) {
        $('#tipo-funcionario').value = String(perfisCache[0].id);
    }
    $('#btn-salvar-funcionario').textContent = 'Salvar pessoa';
}

function obterDataInicio() {
    return montarDataIso($('#inicio-dia'), $('#inicio-mes'), $('#inicio-ano'));
}

function obterDataFim() {
    return montarDataIso($('#fim-dia'), $('#fim-mes'), $('#fim-ano'));
}

async function carregarFuncionarios() {
    const lista = await apiAutenticada('/funcionarios');
    funcionariosCache = lista;
    const container = $('#lista-funcionarios');
    const select = $('#funcionario-select');

    if (!lista.length) {
        container.innerHTML = '<p class="vazio">Nenhuma pessoa cadastrada.</p>';
        select.innerHTML = '<option value="">—</option>';
        return;
    }

    container.innerHTML = lista.map(f => `
        <div class="item">
            <div class="item-info">
                <strong>${f.nome}</strong>
                <span>CPF: ${f.cpf} · ${f.pessoaTipoDescricao || '—'} · Tel: ${f.telefone}</span>
            </div>
            <div class="acoes-inline">
                <button class="btn-editar" data-tipo="funcionario" data-id="${f.id}">Editar</button>
                <button class="btn-excluir" data-tipo="funcionario" data-id="${f.id}">Excluir</button>
            </div>
        </div>
    `).join('');

    select.innerHTML = lista.map(f =>
        `<option value="${f.id}">${f.nome} (${f.pessoaTipoDescricao || 'pessoa'})</option>`
    ).join('');
}

async function carregarSolicitacoes() {
    const lista = await apiAutenticada('/solicitacoes');
    const container = $('#lista-solicitacoes');

    if (!lista.length) {
        container.innerHTML = '<p class="vazio">Nenhuma solicitação ainda.</p>';
        return;
    }

    container.innerHTML = lista.map(s => `
        <div class="item" data-id="${s.id}">
            <div class="item-info">
                <strong>${s.funcionarioNome}</strong>
                <span>${formatarData(s.dataInicio)} → ${formatarData(s.dataFim)} · ${s.diasSolicitados} dias</span>
            </div>
            ${badgeStatus(s.status)}
            ${s.status === 'PENDENTE' ? `
                <div class="acoes">
                    <button class="btn-aprovar" data-acao="aprovar" data-id="${s.id}">Aprovar</button>
                    <button class="btn-rejeitar" data-acao="rejeitar" data-id="${s.id}">Rejeitar</button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

async function atualizarDiasCalculados() {
    const inicio = obterDataInicio();
    const fim = obterDataFim();
    const el = $('#dias-calculados');

    if (!inicio || !fim) {
        el.textContent = '—';
        return;
    }

    try {
        const { dias } = await apiAutenticada(`/calcular-dias?dataInicio=${inicio}&dataFim=${fim}`);
        el.textContent = dias;
    } catch {
        el.textContent = '—';
    }
}

$('#btn-sair').addEventListener('click', async () => {
    try {
        await apiAutenticada('/auth/logout', { method: 'POST' });
    } catch {
        /* ignora */
    }
    limparSessao();
    window.location.href = 'login.html';
});

$('#form-funcionario').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        const id = $('#funcionario-id').value ? parseInt($('#funcionario-id').value, 10) : null;
        const payload = {
            nome: $('#nome-funcionario').value,
            cpf: $('#cpf-funcionario').value,
            nascimento: $('#nascimento-funcionario').value,
            telefone: $('#telefone-funcionario').value,
            pessoaTipoId: parseInt($('#tipo-funcionario').value, 10)
        };

        if (id) {
            await apiAutenticada(`/funcionarios/${id}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
            mostrarToast('Pessoa atualizada!');
        } else {
            await apiAutenticada('/funcionarios', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            mostrarToast('Pessoa cadastrada!');
        }

        resetFuncionarioForm();
        await Promise.all([carregarFuncionarios(), carregarSolicitacoes()]);
    } catch (err) {
        mostrarToast(err.message, 'erro');
    }
});

$('#btn-cancelar-funcionario').addEventListener('click', resetFuncionarioForm);

$('#form-perfil').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        const id = $('#perfil-id').value ? parseInt($('#perfil-id').value, 10) : null;
        const payload = { descricao: $('#perfil-descricao').value };

        if (id) {
            await apiAutenticada(`/perfis/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
            mostrarToast('Perfil atualizado!');
        } else {
            await apiAutenticada('/perfis', { method: 'POST', body: JSON.stringify(payload) });
            mostrarToast('Perfil criado!');
        }

        resetPerfilForm();
        await carregarPerfis();
    } catch (err) {
        mostrarToast(err.message, 'erro');
    }
});

$('#btn-cancelar-perfil').addEventListener('click', resetPerfilForm);

$('#form-usuario').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        const id = $('#usuario-id').value ? parseInt($('#usuario-id').value, 10) : null;
        const payload = {
            nome: $('#usuario-nome').value,
            login: $('#usuario-login').value
        };
        const senha = $('#usuario-senha').value;
        if (!id || senha) payload.senha = senha;

        if (id) {
            await apiAutenticada(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
            mostrarToast('Usuário atualizado!');
        } else {
            if (!payload.senha) throw new Error('Senha é obrigatória ao criar usuário');
            await apiAutenticada('/usuarios', { method: 'POST', body: JSON.stringify(payload) });
            mostrarToast('Usuário criado!');
        }

        resetUsuarioForm();
        await carregarUsuarios();
    } catch (err) {
        mostrarToast(err.message, 'erro');
    }
});

$('#btn-cancelar-usuario').addEventListener('click', resetUsuarioForm);

document.body.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-tipo]');
    if (!btn) return;

    const tipo = btn.dataset.tipo;
    const id = btn.dataset.id;

    try {
        if (tipo === 'perfil') {
            const perfil = perfisCache.find(p => String(p.id) === String(id));
            if (btn.classList.contains('btn-editar')) {
                $('#perfil-id').value = perfil.id;
                $('#perfil-descricao').value = perfil.descricao;
                $('#btn-salvar-perfil').textContent = 'Atualizar';
                return;
            }
            if (btn.classList.contains('btn-excluir')) {
                if (!confirm(`Excluir perfil "${perfil.descricao}"?`)) return;
                await apiAutenticada(`/perfis/${perfil.id}`, { method: 'DELETE' });
                mostrarToast('Perfil excluído!');
                await carregarPerfis();
            }
            return;
        }

        if (tipo === 'usuario') {
            if (btn.classList.contains('btn-editar')) {
                const u = await apiAutenticada(`/usuarios/${id}`);
                $('#usuario-id').value = u.id;
                $('#usuario-nome').value = u.nome;
                $('#usuario-login').value = u.login;
                $('#usuario-senha').value = '';
                $('#btn-salvar-usuario').textContent = 'Atualizar usuário';
                return;
            }
            if (btn.classList.contains('btn-excluir')) {
                if (!confirm('Excluir este usuário?')) return;
                await apiAutenticada(`/usuarios/${id}`, { method: 'DELETE' });
                mostrarToast('Usuário excluído!');
                await carregarUsuarios();
            }
            return;
        }

        if (tipo === 'funcionario') {
            const f = funcionariosCache.find(p => String(p.id) === String(id));
            if (btn.classList.contains('btn-editar')) {
                $('#funcionario-id').value = f.id;
                $('#nome-funcionario').value = f.nome;
                $('#cpf-funcionario').value = f.cpf;
                $('#nascimento-funcionario').value = f.nascimento;
                $('#telefone-funcionario').value = f.telefone;
                if (f.pessoaTipoId) $('#tipo-funcionario').value = String(f.pessoaTipoId);
                $('#btn-salvar-funcionario').textContent = 'Atualizar pessoa';
                return;
            }
            if (btn.classList.contains('btn-excluir')) {
                if (!confirm(`Excluir "${f.nome}"?`)) return;
                await apiAutenticada(`/funcionarios/${id}`, { method: 'DELETE' });
                mostrarToast('Pessoa excluída!');
                await carregarFuncionarios();
            }
        }
    } catch (err) {
        mostrarToast(err.message, 'erro');
    }
});

$('#form-solicitacao').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        await apiAutenticada('/solicitacoes', {
            method: 'POST',
            body: JSON.stringify({
                funcionarioId: parseInt($('#funcionario-select').value, 10),
                dataInicio: obterDataInicio(),
                dataFim: obterDataFim()
            })
        });
        e.target.reset();
        inicializarDatasFerias(atualizarDiasCalculados);
        $('#dias-calculados').textContent = '—';
        mostrarToast('Solicitação criada! Aguardando aprovação.');
        await carregarSolicitacoes();
    } catch (err) {
        mostrarToast(err.message, 'erro');
    }
});

$('#lista-solicitacoes').addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-acao]');
    if (!btn) return;

    const id = btn.dataset.id;
    const acao = btn.dataset.acao;

    try {
        await apiAutenticada(`/solicitacoes/${id}/${acao}`, { method: 'POST' });
        mostrarToast(acao === 'aprovar' ? 'Férias aprovadas!' : 'Solicitação rejeitada.');
        await carregarSolicitacoes();
    } catch (err) {
        mostrarToast(err.message, 'erro');
    }
});

async function init() {
    inicializarDatasFerias(atualizarDiasCalculados);
    try {
        await carregarPerfis();
        await Promise.all([carregarUsuarios(), carregarFuncionarios(), carregarSolicitacoes()]);
    } catch {
        mostrarToast('Backend offline ou MySQL indisponível. Execute database/Projeto_Ferias.sql', 'erro');
    }
}

init();
