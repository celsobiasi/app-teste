const SUPABASE_URL = 'https://pramywnhahowzsnqlshx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_NGPuXFyj0qAmlfAX-UlBpA_IchCQYIv';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        if (!window.supabase) {
            throw new Error('SDK do Supabase não carregado');
        }

        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
            window.location.href = '/?tab=login';
            return;
        }

        const userId = session.user.id;

        // 1. Fetch User Data
        const { data: userData, error: userError } = await supabase
            .from('usuarios')
            .select('nome, empresa_user')
            .eq('id', userId)
            .single();

        if (userError || !userData) {
            console.error('Erro ao resgatar perfil:', userError);
            throw new Error('Falha ao autenticar os dados do usuário.');
        }

        document.getElementById('user-name').textContent = userData.nome || 'Usuário';

        const empresaId = userData.empresa_user;

        if (!empresaId || empresaId === 'null') {
            document.getElementById('loading-activities').innerHTML = '<p style="color: #f59e0b;">Sua conta ainda não está vinculada a nenhuma empresa prestadora de serviços.<br>Peça o link de inscrições direto para os administradores da sua unidade!</p>';
            return;
        }

        // Recuperar o nome da empresa para personalizar a frase
        let companyName = "sua empresa";
        const { data: empresaData } = await supabase
            .from('empresas')
            .select('nome_fantasia, razao_social')
            .eq('id', empresaId)
            .single();

        if (empresaData) {
            companyName = empresaData.nome_fantasia || empresaData.razao_social || companyName;
        }

        document.getElementById('company-welcome-text').textContent = `Veja as atividades oferecidas pela empresa ${companyName}.`;

        // 2. Fetch Open Activities from the Secure View
        console.log("Buscando turmas disponíveis da empresa:", empresaId);

        const { data: turmas, error: turmasError } = await supabase
            .from('vw_turmas_inscricoes')
            .select('*')
            .eq('empresa_id', empresaId)
            .eq('inscricao_ativa', true)
            .order('created_at', { ascending: false });

        if (turmasError) {
            console.error('Erro ao buscar turmas:', turmasError);
            throw new Error('Erro carregando as informações da empresa conectada.');
        }

        const container = document.getElementById('user-activities-container');
        const grid = document.getElementById('activities-grid');
        const loading = document.getElementById('loading-activities');

        loading.style.display = 'none';

        if (!turmas || turmas.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px; background: white; border-radius: 12px; border: 1px dashed var(--border-color);">
                    <i class="fa-solid fa-calendar-xmark" style="font-size: 2rem; color: var(--text-muted); margin-bottom: 16px;"></i>
                    <h3 style="color: var(--text-color); margin-bottom: 8px;">Nenhuma atividade no momento</h3>
                    <p style="color: var(--text-muted);">Sua empresa ainda não possui matrículas abertas.</p>
                </div>
            `;
            container.style.display = 'block';
            return;
        }

        // Render Turmas (Activity Cards)
        grid.innerHTML = turmas.map(t => {
            // Formatar os horários com base no JSON armazenado
            let horariosHtml = '';
            if (t.horarios && t.horarios.length > 0) {
                t.horarios.forEach(h => {
                    horariosHtml += `
                        <span style="background: var(--bg-color); padding: 4px 8px; border-radius: 4px; border: 1px solid var(--border-color); font-size: 0.85rem;">
                            ${h.dia}: ${h.inicio} - ${h.fim}
                        </span>
                    `;
                });
            } else {
                horariosHtml = '<span style="color: var(--text-muted); font-size: 0.85rem; font-style: italic;">Horários a definir</span>';
            }

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
                        <button class="btn-primary" onclick="alert('Funcionalidade de matrículas em desenvolvimento!')">Inscrever-se na Turma</button>
                    </div>
                </div>
            `;
        }).join('');

        container.style.display = 'block';

    } catch (err) {
        console.error('Erro global do painel:', err);
        const errContainer = document.getElementById('loading-activities');
        if (errContainer) {
            errContainer.innerHTML = `<p style="color: #ef4444; font-weight: bold; padding: 20px; border: 1px solid #fee2e2; border-radius: 8px; background: #fef2f2;">${err.message}</p>`;
        }
    }
});
