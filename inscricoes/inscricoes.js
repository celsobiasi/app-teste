const SUPABASE_URL = 'https://pramywnhahowzsnqlshx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_NGPuXFyj0qAmlfAX-UlBpA_IchCQYIv';

// Capturar erros globais para facilitar o debug na tela
window.addEventListener('error', function (event) {
    const el = document.getElementById('loading-activities');
    if (el) el.innerHTML = `<p style="color: #ef4444; font-weight: bold;">Erro de Script: ${event.message}</p>`;
});

window.addEventListener('unhandledrejection', function (event) {
    const el = document.getElementById('loading-activities');
    if (el) el.innerHTML = `<p style="color: #ef4444; font-weight: bold;">Erro Assíncrono: ${event.reason}</p>`;
});

document.addEventListener('DOMContentLoaded', async () => {
    try {
        if (!window.supabase) {
            throw new Error('Supabase SDK não foi carregado corretamente.');
        }

        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        console.log("Supabase inicializado.");

        const urlParams = new URLSearchParams(window.location.search);
        // Usar o ID da URL, mas se não vier nada, injetar o ID da TIME FORTE para fins de teste/fallback temporário
        const empresaId = urlParams.get('id') || '9e0f41ea-ca25-42d7-b8f2-22f5b8ca09ac';
        console.log("Empresa ID:", empresaId);

        if (!empresaId) {
            document.getElementById('loading-activities').innerHTML = '<p style="color: #ef4444; font-weight: bold;">⚠️ Link inválido: O ID da empresa não foi informado na página.</p>';
            return;
        }

        console.log("Buscando detalhes da empresa...");
        // 1. Fetch Company details
        const { data: empresa, error: empresaError } = await supabase
            .from('empresas')
            .select('*')
            .eq('id', empresaId)
            .single();

        console.log("Empresa fetch concluído:", empresa);

        if (empresaError) throw new Error('Erro ao buscar dados da empresa. Verifique se o ID está correto ou se a empresa não existe (RLS pode estar bloqueando).');

        document.getElementById('view-razao-social').textContent = empresa.razao_social || 'N/A';
        document.getElementById('view-cnpj').textContent = `CNPJ: ${empresa.cnpj || '...'}`;
        document.getElementById('company-card').style.display = 'flex';

        console.log("Buscando turmas a partir da view segura...");
        // 2. Fetch Turmas with open registrations from the view
        const { data: turmas, error: turmasError } = await supabase
            .from('vw_turmas_inscricoes')
            .select('*')
            .eq('empresa_id', empresaId)
            .eq('inscricao_ativa', true)
            .order('created_at', { ascending: false });

        console.log("Turmas fetch concluído. Quantidade:", turmas ? turmas.length : 0);

        if (turmasError) throw new Error('Erro ao buscar turmas: ' + turmasError.message);

        document.getElementById('loading-activities').style.display = 'none';

        const grid = document.getElementById('activities-grid');
        const noActivities = document.getElementById('no-activities');

        if (!turmas || turmas.length === 0) {
            console.log("Nenhuma turma encontrada, exibindo mensagem formatada.");
            noActivities.style.display = 'block';
            return;
        }

        console.log("Renderizando turmas no grid HTML...");
        // Render Turmas
        grid.innerHTML = turmas.map(t => {
            const horariosHtml = (t.horarios || []).map(h => `
                <span class="schedule-badge">
                    ${h.dia.charAt(0).toUpperCase() + h.dia.slice(1)}: ${h.inicio} - ${h.fim}
                </span>
            `).join('');

            return `
                <div class="activity-card">
                    <div class="activity-main-info">
                        <div class="activity-header">
                            <div>
                                <h3 class="activity-title">${t.nome_turma}</h3>
                                <p class="activity-subtitle">${t.modalidade_nome || 'Modalidade Indefinida'}</p>
                            </div>
                            <span class="activity-badge">Abertas</span>
                        </div>

                        <div class="activity-details">
                            <div class="detail-item">
                                <i class="fa-solid fa-location-dot"></i>
                                <span>${t.unidade_nome || 'Unidade não informada'}</span>
                            </div>
                            <div class="detail-item">
                                <i class="fa-solid fa-users"></i>
                                <span>Categoria: ${t.categoria_nome || 'Não definida'}</span>
                            </div>
                            <div class="detail-item">
                                <i class="fa-solid fa-venus-mars"></i>
                                <span style="text-transform: capitalize;">Gênero: ${t.sexo_turma || 'Misto'}</span>
                            </div>
                            <div class="detail-item">
                                <i class="fa-solid fa-clock"></i>
                                <div class="schedules-container">
                                    ${horariosHtml}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="activity-footer">
                        <span style="color: var(--text-muted); font-size: 0.85rem; font-weight: 500;">
                            ${t.vagas !== null ? t.vagas + ' Vagas' : 'Vagas ilimitadas'}
                        </span>
                        <button class="btn-primary" onclick="window.subscribe('${empresaId}')">Inscreva-se</button>
                    </div>
                </div>
            `;
        }).join('');

    } catch (err) {
        console.error('Erro geral ao carregar a página:', err);
        const errContainer = document.getElementById('loading-activities');
        if (errContainer) {
            errContainer.innerHTML = `<p style="color: #ef4444; font-weight: bold; padding: 20px; border: 1px solid #fee2e2; border-radius: 8px; background: #fef2f2;">${err.message}</p>`;
        }
    }
});

// Tornar a função de inscrição global
window.subscribe = function (empresaId) {
    // Armazena no localStorage o ID da empresa para vínculo após o cadastro
    localStorage.setItem('registro_empresa_id', empresaId);
    // Redireciona para o login na aba Registration
    window.location.href = '/?tab=register';
};
