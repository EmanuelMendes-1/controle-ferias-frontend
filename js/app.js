let usuarioLogado = null;
let isAdmin = false;

function carregarUsuarioLogado() {
    const usuarioStr = localStorage.getItem('usuario');
    if (usuarioStr) {
        usuarioLogado = JSON.parse(usuarioStr);
        isAdmin = usuarioLogado.id === 1;
        const usuarioSpan = document.getElementById('usuario-logado');
        if (usuarioSpan) {
            usuarioSpan.textContent = `${usuarioLogado.nome} (${isAdmin ? 'Admin' : 'Funcionário'})`;
        }
        ajustarVisibilidadePorPerfil();
    }
}

function ajustarVisibilidadePorPerfil() {
    if (!isAdmin) {
        const secoesAdmin = ['perfis-section', 'usuarios-section', 'funcionarios-section'];
        secoesAdmin.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
    }
}

function mostrarToast(mensagem, tipo = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = mensagem;
    toast.className = `toast ${tipo} show`;
    setTimeout(() => {
        toast.className = 'toast hidden';
    }, 3000);
}

async function listarPerfis() {
    try {
        const response = await fetch(`${API_URL}/perfis`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!response.ok) throw new Error('Erro ao carregar perfis');
        const data = await response.json();
        const container = document.getElementById('lista-perfis');
        if (!container) return;
        if (data.length === 0) {
            container.innerHTML = '<p>Nenhum perfil cadastrado.</p>';
            return;
        }
        container.innerHTML = data.map(p => `
            <div class="item-lista">
                <span>${p.descricao}</span>
                <div>
                    <button onclick="editarPerfil(${p.pessoa_tipo_id})" class="btn-editar">Editar</button>
                    <button onclick="excluirPerfil(${p.pessoa_tipo_id})" class="btn-excluir">Excluir</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erro:', error);
    }
}

async function listarUsuarios() {
    try {
        const response = await fetch(`${API_URL}/usuarios`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!response.ok) throw new Error('Erro ao carregar usuários');
        const data = await response.json();
        const container = document.getElementById('lista-usuarios');
        if (!container) return;
        if (data.length === 0) {
            container.innerHTML = '<p>Nenhum usuário cadastrado.</p>';
            return;
        }
        container.innerHTML = data.map(u => `
            <div class="item-lista">
                <span>${u.nome} (${u.login})</span>
                <div>
                    <button onclick="editarUsuario(${u.usuario_id})" class="btn-editar">Editar</button>
                    <button onclick="excluirUsuario(${u.usuario_id})" class="btn-excluir">Excluir</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erro:', error);
    }
}

async function listarFuncionarios() {
    try {
        const response = await fetch(`${API_URL}/pessoas`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!response.ok) throw new Error('Erro ao carregar funcionários');
        const data = await response.json();
        const container = document.getElementById('lista-funcionarios');
        if (!container) return;
        if (data.length === 0) {
            container.innerHTML = '<p>Nenhum funcionário cadastrado.</p>';
            return;
        }
        container.innerHTML = data.map(f => `
            <div class="item-lista">
                <span>${f.nome} - ${f.cpf || 'SEM CPF'}</span>
                <div>
                    <button onclick="editarFuncionario(${f.pessoa_id})" class="btn-editar">Editar</button>
                    <button onclick="excluirFuncionario(${f.pessoa_id})" class="btn-excluir">Excluir</button>
                </div>
            </div>
        `).join('');
        const select = document.getElementById('funcionario-select');
        if (select) {
            select.innerHTML = '<option value="">Selecione um funcionário</option>' + data.map(f => `<option value="${f.pessoa_id}">${f.nome}</option>`).join('');
        }
    } catch (error) {
        console.error('Erro:', error);
    }
}

async function listarSolicitacoes() {
    try {
        let data;
        if (isAdmin) {
            data = await listarTodasSolicitacoes();
        } else {
            data = await listarMinhasSolicitacoes();
        }
        const container = document.getElementById('lista-solicitacoes');
        if (!container) return;
        if (!data || data.length === 0) {
            container.innerHTML = '<p>Nenhuma solicitação encontrada.</p>';
            return;
        }
        container.innerHTML = data.map(s => `
            <div class="solicitacao-card ${s.status}">
                <div class="solicitacao-info">
                    <strong>${s.funcionarioNome || `Funcionário #${s.funcionarioId}`}</strong>
                    <span class="status status-${s.status}">
                        ${s.status === 'pendente' ? '⏳ Pendente' : s.status === 'aprovado' ? '✅ Aprovado' : '❌ Recusado'}
                    </span>
                </div>
                <div class="solicitacao-datas">
                    📅 ${formatarData(s.dataInicio)} até ${formatarData(s.dataFim)}
                    (${calcularDias(s.dataInicio, s.dataFim)} dias)
                </div>
                ${s.observacao ? `<div class="solicitacao-obs">📝 ${s.observacao}</div>` : ''}
                ${s.status === 'pendente' && isAdmin ? `
                    <div class="solicitacao-acoes">
                        <button onclick="aprovarSolicitacao(${s.id})" class="btn-aprovar">✓ Aprovar</button>
                        <button onclick="recusarSolicitacao(${s.id})" class="btn-recusar">✗ Recusar</button>
                    </div>
                ` : ''}
            </div>
        `).join('');
    } catch (error) {
        console.error('Erro ao listar solicitações:', error);
        const container = document.getElementById('lista-solicitacoes');
        if (container) {
            container.innerHTML = `<p class="error">Erro ao carregar solicitações: ${error.message}</p>`;
        }
    }
}

function formatarData(dataStr) {
    const data = new Date(dataStr);
    return data.toLocaleDateString('pt-BR');
}

function popularDatas() {
    const dias = Array.from({ length: 31 }, (_, i) => i + 1);
    const meses = Array.from({ length: 12 }, (_, i) => i + 1);
    const anoAtual = new Date().getFullYear();
    const anos = Array.from({ length: 5 }, (_, i) => anoAtual + i);
    
    const selectsDia = ['inicio-dia', 'fim-dia'];
    const selectsMes = ['inicio-mes', 'fim-mes'];
    const selectsAno = ['inicio-ano', 'fim-ano'];
    
    selectsDia.forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            select.innerHTML = dias.map(d => `<option value="${d}">${d}</option>`).join('');
        }
    });
    
    selectsMes.forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            select.innerHTML = meses.map(m => `<option value="${m}">${m}</option>`).join('');
        }
    });
    
    selectsAno.forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            select.innerHTML = anos.map(a => `<option value="${a}">${a}</option>`).join('');
        }
    });
    
    const inicioDia = document.getElementById('inicio-dia');
    const inicioMes = document.getElementById('inicio-mes');
    const inicioAno = document.getElementById('inicio-ano');
    const fimDia = document.getElementById('fim-dia');
    const fimMes = document.getElementById('fim-mes');
    const fimAno = document.getElementById('fim-ano');
    const diasCountSpan = document.getElementById('dias-calculados');
    
    function atualizarDias() {
        if (inicioDia && inicioMes && inicioAno && fimDia && fimMes && fimAno && diasCountSpan) {
            const dataInicio = `${inicioAno.value}-${inicioMes.value}-${inicioDia.value}`;
            const dataFim = `${fimAno.value}-${fimMes.value}-${fimDia.value}`;
            if (dataInicio && dataFim) {
                const dias = calcularDias(dataInicio, dataFim);
                diasCountSpan.textContent = dias;
                if (dias > 35) {
                    diasCountSpan.style.color = 'red';
                } else {
                    diasCountSpan.style.color = 'green';
                }
            }
        }
    }
    
    const selects = [inicioDia, inicioMes, inicioAno, fimDia, fimMes, fimAno];
    selects.forEach(select => {
        if (select) select.addEventListener('change', atualizarDias);
    });
}

window.aprovarSolicitacao = async function(id) {
    if (confirm('Aprovar esta solicitação de férias?')) {
        try {
            await aprovarSolicitacao(id);
            mostrarToast('Solicitação aprovada!', 'success');
            listarSolicitacoes();
        } catch (error) {
            mostrarToast(error.message, 'error');
        }
    }
};

window.recusarSolicitacao = async function(id) {
    const motivo = prompt('Motivo da recusa:');
    if (motivo !== null) {
        try {
            await recusarSolicitacao(id, motivo);
            mostrarToast('Solicitação recusada!', 'success');
            listarSolicitacoes();
        } catch (error) {
            mostrarToast(error.message, 'error');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    carregarUsuarioLogado();
    listarPerfis();
    listarUsuarios();
    listarFuncionarios();
    listarSolicitacoes();
    popularDatas();
    
    const btnSair = document.getElementById('btn-sair');
    if (btnSair) {
        btnSair.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            window.location.href = 'login.html';
        });
    }
    
    const formSolicitacao = document.getElementById('form-solicitacao');
    if (formSolicitacao) {
        formSolicitacao.addEventListener('submit', async (e) => {
            e.preventDefault();
            const funcionarioId = document.getElementById('funcionario-select').value;
            const dataInicio = `${document.getElementById('inicio-ano').value}-${document.getElementById('inicio-mes').value}-${document.getElementById('inicio-dia').value}`;
            const dataFim = `${document.getElementById('fim-ano').value}-${document.getElementById('fim-mes').value}-${document.getElementById('fim-dia').value}`;
            const dias = calcularDias(dataInicio, dataFim);
            if (dias > 35) {
                mostrarToast('O período de férias não pode ultrapassar 35 dias', 'error');
                return;
            }
            try {
                const resultado = await criarSolicitacao(dataInicio, dataFim, '');
                mostrarToast('Solicitação enviada com sucesso!', 'success');
                formSolicitacao.reset();
                listarSolicitacoes();
            } catch (error) {
                mostrarToast(error.message, 'error');
            }
        });
    }
});