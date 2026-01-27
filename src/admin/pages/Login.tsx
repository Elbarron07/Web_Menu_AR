import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LogIn } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { authService } from '../../lib/auth';

export const Login = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isInvite, setIsInvite] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Vérifier si c'est une invitation
    const inviteParam = searchParams.get('invite');
    const token = searchParams.get('token');
    const type = searchParams.get('type');

    if (inviteParam === 'true' || (token && type === 'invite')) {
      setIsInvite(true);
      // Essayer de récupérer l'email depuis le token si possible
      // Note: L'email devrait être dans l'URL d'invitation originale
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isInvite) {
        // Si c'est une invitation, créer le mot de passe
        if (password !== confirmPassword) {
          setError('Les mots de passe ne correspondent pas');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Le mot de passe doit contenir au moins 6 caractères');
          setLoading(false);
          return;
        }

        // Mettre à jour le mot de passe via Supabase
        const { error: updateError } = await supabase.auth.updateUser({
          password: password,
        });

        if (updateError) throw updateError;

        // Se connecter avec le nouveau mot de passe
        console.debug('[Login Invite] Tentative de connexion pour:', email);
        const signInResult = await signIn(email, password);
        
        if (!signInResult || !signInResult.user) {
          throw new Error('Erreur lors de la connexion');
        }
        
        console.debug('[Login Invite] Connexion réussie, user:', signInResult.user.id);
        
        // Attendre que la session soit bien établie
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Vérifier que l'utilisateur est bien admin en utilisant authService
        console.debug('[Login Invite] Vérification des droits admin...');
        const isAdmin = await authService.isAdmin();
        console.debug('[Login Invite] Résultat isAdmin:', isAdmin);
        
        if (!isAdmin) {
          // Deuxième tentative après un délai supplémentaire
          console.debug('[Login Invite] Première vérification échouée, retry...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          const isAdminRetry = await authService.isAdmin();
          console.debug('[Login Invite] Résultat isAdmin retry:', isAdminRetry);
          
          if (!isAdminRetry) {
            throw new Error('Vous n\'avez pas les droits d\'administration');
          }
        }
        
        // Rediriger vers le dashboard
        console.debug('[Login Invite] Redirection vers le dashboard');
        navigate('/admin/dashboard', { replace: true });
      } else {
        // Connexion normale
        console.debug('[Login] Tentative de connexion pour:', email);
        const signInResult = await signIn(email, password);
        
        if (!signInResult || !signInResult.user) {
          throw new Error('Erreur lors de la connexion');
        }
        
        console.debug('[Login] Connexion réussie, user:', signInResult.user.id);
        
        // Attendre que la session soit bien établie
        // Le token doit être propagé avant de vérifier les droits admin
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Vérifier que l'utilisateur est bien admin en utilisant authService
        console.debug('[Login] Vérification des droits admin...');
        const isAdmin = await authService.isAdmin();
        console.debug('[Login] Résultat isAdmin:', isAdmin);
        
        if (!isAdmin) {
          // Deuxième tentative après un délai supplémentaire
          console.debug('[Login] Première vérification échouée, retry...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          const isAdminRetry = await authService.isAdmin();
          console.debug('[Login] Résultat isAdmin retry:', isAdminRetry);
          
          if (!isAdminRetry) {
            throw new Error('Vous n\'avez pas les droits d\'administration');
          }
        }
        
        // Rediriger vers le dashboard
        console.debug('[Login] Redirection vers le dashboard');
        navigate('/admin/dashboard', { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500 rounded-2xl mb-4">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isInvite ? 'Créer votre compte' : 'Admin Panel'}
          </h1>
          <p className="text-gray-600">
            {isInvite 
              ? 'Créez votre mot de passe pour accéder au panneau d\'administration'
              : 'Connectez-vous pour gérer votre menu AR'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
              placeholder="admin@restaurant.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              {isInvite ? 'Nouveau mot de passe' : 'Mot de passe'}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
              placeholder={isInvite ? 'Minimum 6 caractères' : '••••••••'}
            />
          </div>

          {isInvite && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmer le mot de passe
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                placeholder="Répétez le mot de passe"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 px-6 rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {loading 
              ? (isInvite ? 'Création du compte...' : 'Connexion...') 
              : (isInvite ? 'Créer le compte' : 'Se connecter')}
          </button>
        </form>
      </div>
    </div>
  );
};
