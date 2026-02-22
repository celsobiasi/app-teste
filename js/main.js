// Supabase Configuration
const SUPABASE_URL = 'https://pramywnhahowzsnqlshx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_NGPuXFyj0qAmlfAX-UlBpA_IchCQYIv'; // As provided in prompt.

document.addEventListener('DOMContentLoaded', () => {
    // Initialize the Supabase client
    // We use window.supabase (from CDN) to create the client, and assign it to a local const 'supabase'.
    // This shadows the global 'supabase' variable within this scope, which is fine and allows us to use the user's preferred variable name.
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // DOM Elements
    const authCard = document.querySelector('.auth-card');
    const tabs = document.querySelectorAll('.tab-btn');
    const tabIndicator = document.querySelector('.tab-indicator');
    const tabPanes = document.querySelectorAll('.tab-pane');

    // Login Form Elements
    const loginForm = document.getElementById('login-form');
    const loginBtn = loginForm.querySelector('button[type="submit"]');
    const loginBtnText = loginBtn.querySelector('.btn-text');
    const loginBtnLoader = loginBtn.querySelector('.btn-loader');
    const loginErrorMsg = document.getElementById('login-error');
    const loginSuccessMsg = document.getElementById('login-success');
    const forgotPasswordLink = document.getElementById('forgot-password');

    // Register Form Elements
    const registerForm = document.getElementById('register-form');
    const registerBtn = registerForm.querySelector('button[type="submit"]');
    const registerBtnText = registerBtn.querySelector('.btn-text');
    const registerBtnLoader = registerBtn.querySelector('.btn-loader');
    const registerErrorMsg = document.getElementById('register-error');
    const registerSuccessMsg = document.getElementById('register-success');

    const togglePasswordBtns = document.querySelectorAll('.toggle-password');

    // --- UI Logic ---

    // Tab Switching
    tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));

            // Add active class to clicked tab
            tab.classList.add('active');

            // Show corresponding content
            const targetTab = tab.getAttribute('data-tab'); // 'login' or 'register'
            document.getElementById(`${targetTab}-tab`).classList.add('active');

            // Move the indicator
            if (index === 0) {
                tabIndicator.style.transform = 'translateX(0)';
            } else {
                tabIndicator.style.transform = 'translateX(100%)';
            }

            // Clear messages when switching
            clearMessages();
        });
    });

    // Password Toggle
    togglePasswordBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const input = btn.previousElementSibling;
            const icon = btn.querySelector('i');

            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });

    // Helper: Show/Hide Loading State
    function setLoading(btn, isLoading, originalText = 'Entrar') {
        const textSpan = btn.querySelector('.btn-text');
        const loader = btn.querySelector('.btn-loader');

        if (isLoading) {
            btn.disabled = true;
            textSpan.textContent = 'Carregando...';
            loader.classList.remove('hidden');
        } else {
            btn.disabled = false;
            textSpan.textContent = originalText;
            loader.classList.add('hidden');
        }
    }

    // Helper: Show Messages
    function showMessage(element, message, isError = true) {
        element.textContent = message;
        element.classList.remove('hidden');

        // Optional: Auto-hide success messages after a while
        if (!isError) {
            setTimeout(() => {
                element.classList.add('hidden');
            }, 5000);
        }
    }

    function clearMessages() {
        [loginErrorMsg, loginSuccessMsg, registerErrorMsg, registerSuccessMsg].forEach(el => {
            el.classList.add('hidden');
            el.textContent = '';
        });

        // Reset input borders
        document.querySelectorAll('input.error').forEach(input => {
            input.classList.remove('error');
        });
    }

    // --- Auth Logic ---

    // 1. Handle Login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearMessages();

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        setLoading(loginBtn, true, 'Entrar');

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) throw error;

            const user = data.user;

            // Success - Now check role
            const { data: profile, error: profileError } = await supabase
                .from('usuarios')
                .select('tipo_user')
                .eq('id', user.id)
                .single();

            if (profileError || !profile) {
                console.error('Profile fetch error:', profileError);
                await supabase.auth.signOut();
                throw new Error('Falha ao verificar perfil de usuário.');
            }

            if (profile.tipo_user === 'superadmin') {
                showMessage(loginSuccessMsg, 'Login realizado com sucesso! Redirecionando...', false);
                setTimeout(() => {
                    window.location.href = 'dashboard/index.html';
                }, 1000);
            } else {
                await supabase.auth.signOut();
                showMessage(loginErrorMsg, 'Acesso restrito: Apenas superadministradores podem acessar o dashboard.');
            }

        } catch (error) {
            console.error('Login error:', error);
            showMessage(loginErrorMsg, formatErrorMessage(error.message));
        } finally {
            setLoading(loginBtn, false, 'Entrar');
        }
    });

    // 2. Handle Registration
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearMessages();

        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const confirmPassword = document.getElementById('reg-confirm-password').value;

        // Validation
        if (password !== confirmPassword) {
            showMessage(registerErrorMsg, 'As senhas não coincidem.');
            document.getElementById('reg-confirm-password').classList.add('error');
            return;
        }

        if (password.length < 6) {
            showMessage(registerErrorMsg, 'A senha deve ter no mínimo 6 caracteres.');
            document.getElementById('reg-password').classList.add('error');
            return;
        }

        setLoading(registerBtn, true, 'Criar Conta');

        try {
            // Step A: Create User in Supabase Auth
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        full_name: name // Optional: stores in user_metadata too
                    }
                }
            });

            if (error) throw error;

            // Start of Removed Manual Insert Block
            // The trigger 'on_auth_user_created' now handles insertion into public.usuarios automatically.
            // This prevents RLS errors when email confirmation is required (session is null).
            // End of Removed Manual Insert Block

            // Success
            showMessage(registerSuccessMsg, 'Conta criada! Verifique seu e-mail para confirmar.', false);
            registerForm.reset();

        } catch (error) {
            console.error('Registration error:', error);
            showMessage(registerErrorMsg, formatErrorMessage(error.message));
        } finally {
            setLoading(registerBtn, false, 'Criar Conta');
        }
    });

    // 3. Handle Forgot Password
    forgotPasswordLink.addEventListener('click', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;

        if (!email) {
            showMessage(loginErrorMsg, 'Por favor, digite seu email primeiro para recuperar a senha.');
            document.getElementById('login-email').focus();
            return;
        }

        const { error } = await supabase.auth.resetPasswordForEmail(email);

        if (error) {
            showMessage(loginErrorMsg, formatErrorMessage(error.message));
        } else {
            showMessage(loginSuccessMsg, 'Email de recuperação enviado! Verifique sua caixa de entrada.', false);
        }
    });


    // Utility: Format Supabase Errors to Portuguese
    function formatErrorMessage(msg) {
        if (msg.includes('Invalid login credentials')) return 'Email ou senha incorretos.';
        if (msg.includes('User already registered')) return 'Este email já está cadastrado.';
        if (msg.includes('Password should be at least')) return 'A senha deve ter no mínimo 6 caracteres.';
        return msg || 'Ocorreu um erro inesperado. Tente novamente.';
    }

});
