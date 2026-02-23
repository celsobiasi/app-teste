document.addEventListener('DOMContentLoaded', () => {
    // Adicionar um timeout de segurança para o loader
    const securityTimeout = setTimeout(() => {
        const loader = document.getElementById('page-loader');
        if (loader && !loader.classList.contains('hidden')) {
            showError('O sistema está demorando para responder. Verifique se você está logado ou tente recarregar.');
        }
    }, 8000);

    async function startDashboard(client, user) {
        clearTimeout(securityTimeout);
        try {
            console.log('[dashboard.js] Iniciando dashboard para o usuário:', user.id);

            // 1. Obter ID da empresa (prioridade para a URL, fallback para o perfil)
            const urlParams = new URLSearchParams(window.location.search);
            let empresaId = urlParams.get('id');

            if (!empresaId || empresaId === 'null') {
                console.log('[dashboard.js] Buscando empresa_user no perfil...');
                const { data: profile, error: profileError } = await client
                    .from('usuarios')
                    .select('empresa_user')
                    .eq('id', user.id)
                    .single();

                if (profileError) {
                    console.error('[dashboard.js] Erro ao buscar perfil:', profileError);
                    throw profileError;
                }
                empresaId = profile?.empresa_user;
            } else {
                console.log('[dashboard.js] Usando empresaId da URL:', empresaId);
            }

            if (!empresaId) {
                console.warn('[dashboard.js] Usuário sem empresa vinculada.');
                showError('Seu usuário não está vinculado a nenhuma empresa. Entre em contato com o suporte.');
                hideLoader();
                return;
            }

            // 2. Buscar os dados da empresa
            const { data: empresa, error: empresaError } = await client
                .from('empresas')
                .select('*')
                .eq('id', empresaId)
                .single();

            // 3. Buscar contagens (ex: Unidades)
            const { count: unidadesCount, error: countError } = await client
                .from('unidades')
                .select('*', { count: 'exact', head: true })
                .eq('empresa_id', empresaId);

            if (countError) console.warn('[dashboard.js] Erro ao contar unidades:', countError);

            // 4. Preencher a UI
            populateUI(empresa, { unidades: unidadesCount || 0 });

        } catch (error) {
            console.error('[dashboard.js] Erro fatal:', error);
            showError('Falha ao carregar os dados da empresa: ' + (error.message || 'Erro desconhecido'));
        } finally {
            hideLoader();
        }
    }

    // Escutar o evento do header OU usar dados se já estiverem prontos
    if (window.__headerUser) {
        console.log('[dashboard.js] Header já estava pronto.');
        const { client, user } = window.__headerUser;
        startDashboard(client, user);
    } else {
        console.log('[dashboard.js] Aguardando evento header-ready...');
        document.addEventListener('header-ready', (e) => {
            const { client, user } = e.detail;
            startDashboard(client, user);
        });
    }

    function populateUI(empresa, counts = {}) {
        document.getElementById('view-razao-social').textContent = empresa.razao_social || 'N/A';
        document.getElementById('view-cnpj').textContent = `CNPJ: ${empresa.cnpj || '...'}`;

        // Definir valores das categorias
        document.getElementById('count-unidades').textContent = counts.unidades ?? '0';
        document.getElementById('count-modalidades').textContent = '0';
        document.getElementById('count-turmas').textContent = '0';
        document.getElementById('count-alunos').textContent = '0';
        document.getElementById('count-eventos').textContent = '0';

        const statusBadge = document.getElementById('view-status');
        if (empresa.ativo) {
            statusBadge.textContent = 'Ativa';
            statusBadge.className = 'status-badge status-active';
        } else {
            statusBadge.textContent = 'Inativa';
            statusBadge.className = 'status-badge status-inactive';
        }
    }

    function showError(msg) {
        const errorEl = document.getElementById('error-message');
        if (errorEl) {
            errorEl.textContent = msg;
            errorEl.classList.remove('hidden');
        }
    }

    function hideLoader() {
        const loader = document.getElementById('page-loader');
        if (loader) {
            loader.classList.add('hidden');
        }
    }
});
