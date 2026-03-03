document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('units-grid');
    const loader = document.getElementById('loader');
    const alertMsg = document.getElementById('alert-message');
    const searchInput = document.getElementById('search-input');
    const searchClear = document.getElementById('search-clear');
    const searchCount = document.getElementById('search-results-count');

    let allUnits = [];
    let supabaseClient = null;
    let currentEmpresaId = null;

    console.log('[lista.js] Script carregado e DOM pronto.');

    function showError(message) {
        console.warn('[lista.js] Exibindo erro:', message);
        alertMsg.textContent = message;
        alertMsg.classList.remove('hidden');
        alertMsg.className = "error-message user-msg";
        if (loader) loader.classList.add('hidden');
    }

    function renderUnits(data) {
        console.log('[lista.js] Renderizando unidades:', data.length);
        if (data.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-magnifying-glass empty-icon"></i>
                    <h3>Nenhuma unidade encontrada</h3>
                    <p>Tente buscar por outro termo ou cadastre uma nova unidade.</p>
                </div>
            `;
            if (searchCount) searchCount.textContent = 'Nenhum resultado';
            return;
        }

        if (searchCount) {
            searchCount.textContent = `${data.length} ${data.length === 1 ? 'unidade encontrada' : 'unidades encontradas'}`;
        }

        grid.innerHTML = data.map(unit => {
            const initial = unit.nome ? unit.nome.charAt(0).toUpperCase() : '?';
            const addressParts = [
                unit.logradouro ? unit.logradouro + (unit.numero ? ', ' + unit.numero : '') : null,
                unit.cidade ? unit.cidade + (unit.estado ? ' - ' + unit.estado : '') : null
            ].filter(Boolean);
            const addressLine = addressParts.join(' • ') || 'Endereço não informado';

            return `
                <div class="unit-card">
                    <div class="unit-header">
                        <div class="unit-icon">${initial}</div>
                        <div>
                            <h3 class="unit-name">${unit.nome || 'Sem nome'}</h3>
                        </div>
                    </div>
                    
                    <div class="unit-details">
                        <div class="detail-item">
                            <i class="fa-solid fa-user-tie detail-icon"></i>
                            <span class="detail-text">Resp: ${unit.responsavel || 'Não informado'}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fa-solid fa-envelope detail-icon"></i>
                            <span class="detail-text">${unit.email || 'E-mail não informado'}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fa-solid fa-phone detail-icon"></i>
                            <span class="detail-text">${unit.telefone || 'Telefone não informado'}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fa-solid fa-location-dot detail-icon"></i>
                            <span class="detail-text">${addressLine}</span>
                        </div>
                    </div>
                    
                    <div class="card-actions">
                        <button class="action-btn view" onclick="viewUnitDetails('${unit.id}')" title="Visualizar Detalhes">
                            <i class="fa-solid fa-magnifying-glass"></i>
                        </button>
                        <button class="action-btn edit" onclick="editUnit('${unit.id}')" title="Editar">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="action-btn delete" onclick="deleteUnit('${unit.id}', '${unit.nome.replace(/'/g, "\\'")}')" title="Excluir">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    async function loadUnits(client, empresaId) {
        console.log('[lista.js] loadUnits iniciado para empresa_id:', empresaId);
        if (loader) loader.classList.remove('hidden');
        grid.innerHTML = '';
        alertMsg.classList.add('hidden');

        try {
            const { data, error } = await client
                .from('unidades')
                .select('*')
                .eq('empresa_id', empresaId)
                .order('nome', { ascending: true });

            if (error) {
                console.error('[lista.js] Erro na consulta ao Supabase:', error);
                throw error;
            }

            console.log('[lista.js] Dados recebidos do Supabase:', data);
            allUnits = data;
            renderUnits(data);
        } catch (error) {
            console.error("[lista.js] Erro ao carregar unidades:", error);
            showError("Erro ao carregar as unidades: " + (error.message || 'Erro desconhecido'));
        } finally {
            if (loader) loader.classList.add('hidden');
        }
    }

    async function loadDashboardData(client, user) {
        console.log('[lista.js] Inciando carregamento de dados para:', user.email);
        supabaseClient = client;
        try {
            const urlParams = new URLSearchParams(window.location.search);
            let empresaId = urlParams.get('empresa_id');

            if (!empresaId) {
                console.log('[lista.js] empresa_id não na URL, buscando no perfil...');
                const { data: profile, error } = await client
                    .from('usuarios')
                    .select('empresa_user')
                    .eq('id', user.id)
                    .single();

                if (error) {
                    console.error('[lista.js] Erro ao buscar perfil:', error);
                    throw error;
                }
                empresaId = profile?.empresa_user;
            }

            console.log('[lista.js] Empresa ID identificada:', empresaId);

            if (!empresaId) {
                showError("Empresa não identificada. Verifique se o seu perfil está vinculado a uma empresa.");
                return;
            }

            currentEmpresaId = empresaId;
            loadUnits(client, empresaId);
        } catch (error) {
            console.error("[lista.js] Erro em loadDashboardData:", error);
            showError("Falha na identificação: " + (error.message || 'Erro de conexão'));
        }
    }

    // Lógica de inicialização robusta
    if (window.__headerUser) {
        console.log('[lista.js] Header pré-carregado. Usando dados existentes.');
        const { client, user } = window.__headerUser;
        loadDashboardData(client, user);
    } else {
        console.log('[lista.js] Header não carregado. Aguardando header-ready.');
        document.addEventListener('header-ready', (e) => {
            console.log('[lista.js] Evento header-ready recebido.');
            const { client, user } = e.detail;
            loadDashboardData(client, user);
        });
    }

    // Buscador
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const q = searchInput.value.trim().toLowerCase();
            if (searchClear) searchClear.style.display = q ? 'block' : 'none';

            if (!q) {
                renderUnits(allUnits);
                return;
            }

            const filtered = allUnits.filter(u => {
                const name = (u.nome || '').toLowerCase();
                const resp = (u.responsavel || '').toLowerCase();
                const addr = (u.logradouro || '').toLowerCase() + ' ' + (u.cidade || '').toLowerCase();
                return name.includes(q) || resp.includes(q) || addr.includes(q);
            });
            renderUnits(filtered);
        });
    }

    if (searchClear) {
        searchClear.addEventListener('click', () => {
            searchInput.value = '';
            searchClear.style.display = 'none';
            renderUnits(allUnits);
        });
    }

    // Ações globais
    window.editUnit = (id) => {
        window.location.href = `/unidades/editar/?id=${id}`;
    };

    window.viewUnitDetails = (id) => {
        window.location.href = `/unidades/detalhes/?id=${id}`;
    };

    window.deleteUnit = async (id, name) => {
        if (!confirm(`Tem certeza que deseja excluir a unidade "${name}"? Esta ação não pode ser desfeita.`)) {
            return;
        }

        try {
            console.log('[lista.js] Excluindo unidade:', id);
            const { error } = await supabaseClient
                .from('unidades')
                .delete()
                .eq('id', id);

            if (error) throw error;

            console.log('[lista.js] Unidade excluída com sucesso.');
            // Recarregar a lista
            loadUnits(supabaseClient, currentEmpresaId);
        } catch (err) {
            console.error('[lista.js] Erro ao excluir unidade:', err);
            alert('Erro ao excluir unidade: ' + err.message);
        }
    };
});
