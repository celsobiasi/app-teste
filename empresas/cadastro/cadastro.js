// Supabase Configuration
const SUPABASE_URL = 'https://pramywnhahowzsnqlshx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_NGPuXFyj0qAmlfAX-UlBpA_IchCQYIv';

let supabase;

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado em Empresas/Cadastro');

    if (window.supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase carregado.');
    }

    const form = document.getElementById('empresa-form');
    const cnpjInput = document.getElementById('cnpj');
    const btnLookup = document.getElementById('btn-lookup');
    const cnpjLoader = document.getElementById('cnpj-loader');
    const cnpjError = document.getElementById('cnpj-error');
    const btnCancel = document.getElementById('btn-cancel');
    const btnSubmit = document.getElementById('btn-submit');
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');

    // CNPJ Masking
    function applyCnpjMask(value) {
        const raw = value.replace(/\D/g, '');
        let masked = raw;
        if (raw.length > 2) masked = raw.slice(0, 2) + '.' + raw.slice(2);
        if (raw.length > 5) masked = masked.slice(0, 6) + '.' + masked.slice(6);
        if (raw.length > 8) masked = masked.slice(0, 10) + '/' + masked.slice(10);
        if (raw.length > 12) masked = masked.slice(0, 15) + '-' + masked.slice(15);
        return masked.substring(0, 18);
    }

    cnpjInput.addEventListener('input', (e) => {
        e.target.value = applyCnpjMask(e.target.value);
    });

    // Manual Lookup Trigger
    btnLookup.addEventListener('click', () => {
        const rawCnpj = cnpjInput.value.replace(/\D/g, '');
        if (rawCnpj.length === 14) {
            lookupCnpj(rawCnpj);
        } else {
            showToast('Digite os 14 dígitos do CNPJ.', 'error');
        }
    });

    // Automatic Lookup as Fallback User Experience
    cnpjInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            btnLookup.click();
        }
    });

    // CNPJ Lookup Function
    async function lookupCnpj(cnpj) {
        console.log('Iniciando busca para:', cnpj);
        cnpjLoader.classList.remove('hidden');
        cnpjError.classList.add('hidden');
        btnLookup.disabled = true;

        // Browsers can't use node 'require'. We use 'fetch'.
        // Falls back to multiple APIs for reliability.
        const apis = [
            `https://open.cnpja.com/office/${cnpj}`,
            `https://brasilapi.com.br/api/cnpj/v1/${cnpj}`
        ];

        let success = false;

        for (const url of apis) {
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error('Falha na resposta');

                const data = await response.json();
                console.log('API Success:', url, data);

                populateForm(data);
                success = true;
                showToast('Dados carregados com sucesso!', 'success');
                break;
            } catch (err) {
                console.warn('API Error:', url, err);
            }
        }

        if (!success) {
            cnpjError.classList.remove('hidden');
            showToast('Erro ao buscar CNPJ. Preencha manualmente.', 'error');
        }

        cnpjLoader.classList.add('hidden');
        btnLookup.disabled = false;
    }

    function populateForm(data) {
        const razao = data.company?.name || data.razao_social || data.nome_empresarial || '';
        const fantasia = data.alias || data.nome_fantasia || razao || '';

        document.getElementById('razao_social').value = razao;
        document.getElementById('nome_fantasia').value = fantasia;

        let phone = '';
        if (data.phones && data.phones[0]) {
            phone = `(${data.phones[0].area}) ${data.phones[0].number}`;
        } else if (data.ddd_telefone_1) {
            phone = `(${data.ddd_telefone_1.substring(0, 2)}) ${data.ddd_telefone_1.substring(2)}`;
        }
        document.getElementById('telefone').value = phone;

        document.getElementById('email').value = data.emails?.[0]?.address || data.email || '';

        if (data.address) {
            document.getElementById('cep').value = data.address.zip || '';
            document.getElementById('cidade').value = data.address.city || '';
            document.getElementById('estado').value = data.address.state || '';
            document.getElementById('logradouro').value = data.address.street || '';
            document.getElementById('numero').value = data.address.number || '';
        } else if (data.cep) {
            document.getElementById('cep').value = data.cep || '';
            document.getElementById('cidade').value = data.municipio || '';
            document.getElementById('estado').value = data.uf || '';
            document.getElementById('logradouro').value = (data.logradouro || '') + ' ' + (data.bairro || '');
            document.getElementById('numero').value = data.numero || '';
        }
    }

    function showToast(message, type = 'success') {
        toastMessage.textContent = message;
        toast.className = `toast show ${type}`;
        setTimeout(() => toast.className = 'toast hidden', 3000);
    }

    btnCancel.addEventListener('click', () => window.location.href = '../../dashboard');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!supabase) return;

        btnSubmit.disabled = true;
        btnSubmit.querySelector('.btn-text').textContent = 'Gravando...';
        btnSubmit.querySelector('.btn-loader').classList.remove('hidden');

        try {
            const formData = {
                cnpj: cnpjInput.value.replace(/\D/g, ''),
                razao_social: document.getElementById('razao_social').value,
                nome_fantasia: document.getElementById('nome_fantasia').value,
                responsavel: document.getElementById('responsavel').value,
                telefone: document.getElementById('telefone').value,
                email: document.getElementById('email').value,
                cep: document.getElementById('cep').value,
                cidade: document.getElementById('cidade').value,
                estado: document.getElementById('estado').value,
                logradouro: document.getElementById('logradouro').value,
                numero: document.getElementById('numero').value
            };

            const { error } = await supabase.from('empresas').insert([formData]);
            if (error) throw error;

            showToast('Empresa cadastrada com sucesso!', 'success');
            setTimeout(() => window.location.href = '../../dashboard', 1500);
        } catch (error) {
            console.error('Save Error:', error);
            showToast('Erro ao cadastrar.', 'error');
            btnSubmit.disabled = false;
            btnSubmit.querySelector('.btn-text').textContent = 'Cadastrar';
            btnSubmit.querySelector('.btn-loader').classList.add('hidden');
        }
    });
});
