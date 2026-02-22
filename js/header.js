/**
 * header.js — Componente reutilizável de cabeçalho
 *
 * USO: adicione em qualquer página:
 *   <script src="/js/header.js" data-root-path="../"></script>
 *
 * O atributo data-root-path define o caminho relativo até a raiz do projeto.
 * Ex: No dashboard (1 nível) → "../"
 *     No cadastro  (2 níveis) → "../../"
 */
(function () {
    // ---- Detectar root path a partir do tag <script> ----
    const scriptTag = document.currentScript;
    const ROOT = scriptTag?.getAttribute('data-root-path') || '../';

    // ---- Supabase Config ----
    const SUPABASE_URL = 'https://pramywnhahowzsnqlshx.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_NGPuXFyj0qAmlfAX-UlBpA_IchCQYIv';

    // ---- Inject Header HTML ----
    const headerHTML = `
    <header class="app-header" id="app-header">
        <a href="${ROOT}dashboard" class="header-logo">
            <i class="fa-solid fa-futbol"></i>
            Gestor Esportivo
        </a>

        <div class="header-right" style="display: flex; align-items: center;">
            <a href="${ROOT}empresas/cadastro" class="btn-primary" style="margin-right: 15px; text-decoration: none; font-size: 0.9rem; padding: 0.5rem 1rem; width: auto;">
                <i class="fa-solid fa-plus"></i> Novo Cadastro
            </a>
            <div class="user-menu" id="user-menu">
                <div class="user-menu-trigger" id="user-menu-trigger">
                    <div class="user-avatar" id="user-avatar">?</div>
                    <span id="user-display-name">Carregando...</span>
                    <i class="fa-solid fa-chevron-down chevron"></i>
                </div>
                <div class="user-dropdown">
                    <a href="${ROOT}perfil/"><i class="fa-solid fa-user"></i> Meu Perfil</a>
                    <div class="divider"></div>
                    <button id="logout-btn" class="danger"><i class="fa-solid fa-right-from-bracket"></i> Sair</button>
                </div>
            </div>
        </div>
    </header>`;

    // Inserir como primeiro filho do body
    document.body.classList.add('has-header');
    document.body.insertAdjacentHTML('afterbegin', headerHTML);

    // ---- Esperar Supabase carregar e buscar dados do usuário ----
    function waitForSupabase(maxAttempts) {
        return new Promise((resolve) => {
            let attempts = 0;
            const check = () => {
                if (window.supabase) return resolve(window.supabase);
                if (++attempts >= maxAttempts) return resolve(null);
                setTimeout(check, 100);
            };
            check();
        });
    }

    async function initHeader() {
        const sb = await waitForSupabase(30);
        if (!sb) {
            console.warn('[header.js] Supabase SDK não carregou.');
            return;
        }

        const client = sb.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        // Usar getSession primeiro (síncrono com cache), depois getUser
        const { data: { session } } = await client.auth.getSession();

        if (!session) {
            window.location.href = ROOT + 'index.html';
            return;
        }

        const user = session.user;

        // Buscar nome na tabela usuarios
        const { data: profile } = await client
            .from('usuarios')
            .select('nome')
            .eq('id', user.id)
            .single();

        const name = profile?.nome || user.email;
        const initial = name.charAt(0).toUpperCase();

        document.getElementById('user-display-name').textContent = name;
        document.getElementById('user-avatar').textContent = initial;

        // Expor dados para a página usar (ex: perfil)
        window.__headerUser = { user, name, initial, client };
        document.dispatchEvent(new CustomEvent('header-ready', { detail: { user, name, initial, client } }));

        // ---- Logout ----
        document.getElementById('logout-btn').addEventListener('click', async () => {
            try { await client.auth.signOut(); } catch (e) { console.error(e); }
            finally { window.location.href = ROOT + 'index.html'; }
        });
    }

    // ---- Dropdown toggle (mobile + desktop click) ----
    document.addEventListener('click', (e) => {
        const trigger = e.target.closest('#user-menu-trigger');
        const menu = document.getElementById('user-menu');
        if (!menu) return;

        if (trigger) {
            menu.classList.toggle('open');
        } else if (!menu.contains(e.target)) {
            menu.classList.remove('open');
        }
    });

    // Iniciar
    initHeader();
})();
