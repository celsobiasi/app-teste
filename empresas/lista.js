// Function to format CNPJ: XX.XXX.XXX/XXXX-XX
function formatCnpj(cnpj) {
    if (!cnpj) return "";
    const raw = cnpj.replace(/\D/g, '');
    let masked = raw;
    if (raw.length > 2) masked = raw.slice(0, 2) + '.' + raw.slice(2);
    if (raw.length > 5) masked = masked.slice(0, 6) + '.' + masked.slice(6);
    if (raw.length > 8) masked = masked.slice(0, 10) + '/' + masked.slice(10);
    if (raw.length > 12) masked = masked.slice(0, 15) + '-' + masked.slice(15);
    return masked.substring(0, 18);
}

document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('companies-grid');
    const loader = document.getElementById('loader');
    const alertMsg = document.getElementById('alert-message');
    const searchInput = document.getElementById('search-input');
    let allCompanies = []; // holds full list for client-side search
    let supabaseClient = null;

    function showError(message) {
        alertMsg.textContent = message;
        alertMsg.classList.remove('hidden');
        alertMsg.className = "error-message user-msg";
        loader.classList.add('hidden');
    }

    // --- Render a list of companies into the grid ---
    function renderCompanies(data) {
        if (data.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-magnifying-glass empty-icon"></i>
                    <h3>Nenhum resultado encontrado</h3>
                    <p>Tente buscar por outro nome, CNPJ ou responsável.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = data.map(company => {
            const title = company.nome_fantasia || company.razao_social || 'Sem Nome';
            const initial = title.charAt(0).toUpperCase();
            const addressParts = [
                company.logradouro ? company.logradouro + (company.numero ? ', ' + company.numero : '') : null,
                company.cidade ? company.cidade + (company.estado ? ' - ' + company.estado : '') : null
            ].filter(Boolean);
            const addressLine = addressParts.join(' • ') || 'Endereço não informado';

            return `
                <div class="company-card">
                    <div class="company-header">
                        <div class="company-icon">${initial}</div>
                        <div>
                            <h3 class="company-name" title="${title}">${title}</h3>
                            <p class="company-cnpj">${company.cnpj ? formatCnpj(company.cnpj) : 'CNPJ não informado'}</p>
                        </div>
                    </div>
                    
                    <div class="company-details">
                        <div class="detail-item">
                            <i class="fa-solid fa-building detail-icon"></i>
                            <span class="detail-text">${company.razao_social || 'Razão Social não informada'}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fa-solid fa-user-tie detail-icon"></i>
                            <span class="detail-text">${company.responsavel || 'Responsável não informado'}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fa-solid fa-envelope detail-icon"></i>
                            <span class="detail-text">${company.email || 'Não informado'}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fa-solid fa-phone detail-icon"></i>
                            <span class="detail-text">${company.telefone || 'Não informado'}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fa-solid fa-location-dot detail-icon"></i>
                            <span class="detail-text">${addressLine}</span>
                        </div>
                    </div>
                    
                    <div class="card-actions">
                        <div class="toggle-container" title="Status da Empresa">
                            <span class="status-label">${company.ativo ? 'Ativa' : 'Inativa'}</span>
                            <label class="switch">
                                <input type="checkbox" ${company.ativo ? 'checked' : ''} onchange="toggleCompanyStatus('${company.id}', this)">
                                <span class="slider round"></span>
                            </label>
                        </div>
                        <div style="flex-grow: 1;"></div>
                        <button class="action-btn edit" onclick="editCompany('${company.id}')" title="Editar">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="action-btn delete" onclick="openDeleteModal('${company.id}')" title="Excluir">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // --- Load companies from Supabase ---
    async function loadCompanies() {
        if (!supabaseClient) return;

        loader.classList.remove('hidden');
        grid.innerHTML = `
            <div class="loader-container" id="loader">
                <i class="fa-solid fa-spinner fa-spin"></i>
            </div>
        `;
        alertMsg.classList.add('hidden');

        try {
            const { data, error } = await supabaseClient
                .from('empresas')
                .select('*')
                .order('nome_fantasia', { ascending: true });

            if (error) {
                console.error("Fetch Error:", error);
                throw error;
            }

            loader.classList.add('hidden');

            if (!data || data.length === 0) {
                grid.innerHTML = `
                    <div class="empty-state">
                        <i class="fa-solid fa-building-circle-xmark empty-icon"></i>
                        <h3>Nenhuma empresa encontrada</h3>
                        <p>Ainda não há empresas cadastradas no sistema.</p>
                        <a href="cadastro" class="btn-primary" style="display: inline-flex; width: auto; margin-top: 15px; text-decoration: none;">
                            <i class="fa-solid fa-plus" style="margin-right:8px;"></i> Cadastrar Primeira
                        </a>
                    </div>
                `;
                return;
            }

            allCompanies = data;
            renderCompanies(data);

        } catch (error) {
            console.error("Exceção:", error);
            showError("Ocorreu um erro ao carregar as empresas. Tente recarregar a página.");
        }
    }

    // --- Header ready (provides supabase client) ---
    document.addEventListener('header-ready', (e) => {
        supabaseClient = e.detail.client;
        loadCompanies();
    });

    // --- Client-side search / filter ---
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const q = searchInput.value.trim().toLowerCase();
            if (!q) {
                renderCompanies(allCompanies);
                return;
            }
            const qDigits = q.replace(/\D/g, '');
            const filtered = allCompanies.filter(c => {
                const name = (c.nome_fantasia || c.razao_social || '').toLowerCase();
                const cnpj = (c.cnpj || '').replace(/\D/g, '');
                const resp = (c.responsavel || '').toLowerCase();
                return name.includes(q) || resp.includes(q) || (qDigits && cnpj.includes(qDigits));
            });
            renderCompanies(filtered);
        });
    }

    // --- Modal Logic ---
    const deleteModal = document.getElementById('delete-modal');
    const btnCancelDelete = document.getElementById('btn-cancel-delete');
    const btnConfirmDelete = document.getElementById('btn-confirm-delete');
    let companyToDelete = null;

    window.openDeleteModal = function (id) {
        companyToDelete = id;
        deleteModal.classList.add('active');
    };

    function closeDeleteModal() {
        companyToDelete = null;
        deleteModal.classList.remove('active');
        btnConfirmDelete.disabled = false;
        btnConfirmDelete.querySelector('.btn-loader').classList.add('hidden');
        btnConfirmDelete.querySelector('.btn-text').textContent = 'Excluir';
    }

    btnCancelDelete.addEventListener('click', closeDeleteModal);
    deleteModal.addEventListener('click', (e) => {
        if (e.target === deleteModal) closeDeleteModal(); // click outside
    });

    btnConfirmDelete.addEventListener('click', async () => {
        if (!companyToDelete || !supabaseClient) return;

        btnConfirmDelete.disabled = true;
        btnConfirmDelete.querySelector('.btn-text').textContent = 'Aguarde...';
        btnConfirmDelete.querySelector('.btn-loader').classList.remove('hidden');

        try {
            const { error } = await supabaseClient
                .from('empresas')
                .delete()
                .eq('id', companyToDelete);

            if (error) throw error;

            closeDeleteModal();

            // Remove from local list and re-render without reloading
            allCompanies = allCompanies.filter(c => c.id !== companyToDelete);
            const q = searchInput ? searchInput.value.trim().toLowerCase() : '';
            if (q) {
                const qDigits = q.replace(/\D/g, '');
                const filtered = allCompanies.filter(c => {
                    const name = (c.nome_fantasia || c.razao_social || '').toLowerCase();
                    const cnpj = (c.cnpj || '').replace(/\D/g, '');
                    const resp = (c.responsavel || '').toLowerCase();
                    return name.includes(q) || resp.includes(q) || (qDigits && cnpj.includes(qDigits));
                });
                renderCompanies(filtered);
            } else {
                renderCompanies(allCompanies);
            }

            alertMsg.textContent = "Empresa excluída com sucesso!";
            alertMsg.className = "success-message user-msg";
            setTimeout(() => { alertMsg.classList.add('hidden'); }, 3000);

        } catch (error) {
            console.error("Erro ao excluir:", error);
            btnConfirmDelete.disabled = false;
            btnConfirmDelete.querySelector('.btn-loader').classList.add('hidden');
            btnConfirmDelete.querySelector('.btn-text').textContent = 'Excluir';
            alert("Erro ao excluir empresa. Tente novamente.");
        }
    });

    // --- Edit logic ---
    window.editCompany = function (id) {
        window.location.href = `/empresas/editar/?id=${id}`;
    };

    // --- Toggle status logic ---
    window.toggleCompanyStatus = async function (id, checkbox) {
        if (!supabaseClient) return;

        const newState = checkbox.checked;
        const statusLabel = checkbox.closest('.toggle-container').querySelector('.status-label');
        const originalLabel = statusLabel.textContent;

        // Optimistic UI update
        statusLabel.textContent = newState ? 'Ativa' : 'Inativa';
        checkbox.disabled = true;

        try {
            const { error } = await supabaseClient
                .from('empresas')
                .update({ ativo: newState, updated_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;

            // Update local state for search consistency
            const company = allCompanies.find(c => c.id === id);
            if (company) company.ativo = newState;

        } catch (error) {
            console.error("Erro ao atualizar status:", error);
            // Revert on error
            checkbox.checked = !newState;
            statusLabel.textContent = originalLabel;
            alert("Erro ao atualizar o status da empresa. Tente novamente.");
        } finally {
            checkbox.disabled = false;
        }
    };
});
