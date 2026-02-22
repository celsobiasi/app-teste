document.addEventListener('DOMContentLoaded', () => {
    // Escuta o evento 'header-ready' que é disparado quando o header termina de carregar o usuário
    document.addEventListener('header-ready', async (e) => {
        const { client } = e.detail;

        try {
            // Busca a contagem de empresas
            const { count, error } = await client
                .from('empresas')
                .select('*', { count: 'exact', head: true });

            if (error) {
                console.error("Erro ao buscar a quantidade de empresas:", error);
                document.getElementById('company-count').textContent = 'Erro';
            } else {
                document.getElementById('company-count').textContent = count || 0;
            }
        } catch (error) {
            console.error("Exceção ao buscar empresas:", error);
            document.getElementById('company-count').textContent = 'Erro';
        }
    });
});
