// usuarios.js
async function cadastrarFuncionario(dados) {
    const response = await fetch(`${API_URL}/usuarios`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({
            nome: dados.nome,
            login: dados.login,
            senha: dados.senha,
            cpf: dados.cpf,
            telefone: dados.telefone
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao cadastrar funcionário');
    }
    return response.json();
}