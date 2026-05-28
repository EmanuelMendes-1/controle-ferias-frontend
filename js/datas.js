const MESES = [
    { valor: 1, nome: 'Janeiro' },
    { valor: 2, nome: 'Fevereiro' },
    { valor: 3, nome: 'Março' },
    { valor: 4, nome: 'Abril' },
    { valor: 5, nome: 'Maio' },
    { valor: 6, nome: 'Junho' },
    { valor: 7, nome: 'Julho' },
    { valor: 8, nome: 'Agosto' },
    { valor: 9, nome: 'Setembro' },
    { valor: 10, nome: 'Outubro' },
    { valor: 11, nome: 'Novembro' },
    { valor: 12, nome: 'Dezembro' }
];

function diasNoMes(ano, mes) {
    return new Date(ano, mes, 0).getDate();
}

function preencherMeses(selectEl) {
    selectEl.innerHTML = MESES.map(m =>
        `<option value="${m.valor}">${m.nome}</option>`
    ).join('');
}

function preencherAnos(selectEl, anosAntes = 0, anosDepois = 2) {
    const anoAtual = new Date().getFullYear();
    const inicio = anoAtual - anosAntes;
    const fim = anoAtual + anosDepois;
    let html = '';
    for (let a = inicio; a <= fim; a++) {
        html += `<option value="${a}">${a}</option>`;
    }
    selectEl.innerHTML = html;
    selectEl.value = String(anoAtual);
}

function preencherDias(selectDia, selectMes, selectAno) {
    const ano = parseInt(selectAno.value, 10);
    const mes = parseInt(selectMes.value, 10);
    const total = diasNoMes(ano, mes);
    const diaAtual = Math.min(parseInt(selectDia.value, 10) || 1, total);

    let html = '';
    for (let d = 1; d <= total; d++) {
        html += `<option value="${d}">${d}</option>`;
    }
    selectDia.innerHTML = html;
    selectDia.value = String(diaAtual);
}

function montarDataIso(selectDia, selectMes, selectAno) {
    const ano = parseInt(selectAno.value, 10);
    const mes = parseInt(selectMes.value, 10);
    const dia = parseInt(selectDia.value, 10);
    const mm = String(mes).padStart(2, '0');
    const dd = String(dia).padStart(2, '0');
    return `${ano}-${mm}-${dd}`;
}

function vincularGrupoData(prefixo, onChange) {
    const dia = document.getElementById(`${prefixo}-dia`);
    const mes = document.getElementById(`${prefixo}-mes`);
    const ano = document.getElementById(`${prefixo}-ano`);

    preencherMeses(mes);
    preencherAnos(ano);

    const atualizarDias = () => {
        preencherDias(dia, mes, ano);
        if (onChange) onChange();
    };

    mes.addEventListener('change', atualizarDias);
    ano.addEventListener('change', atualizarDias);
    dia.addEventListener('change', onChange || (() => {}));

    atualizarDias();
}

function inicializarDatasFerias(onChange) {
    vincularGrupoData('inicio', onChange);
    vincularGrupoData('fim', onChange);
}
