import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

/**
 * Fonction pour extraire les paramètres du hash de l'URL (#access_token=...)
 */
const parseHashParams = (hash: string): Record<string, string> => {
  const params: Record<string, string> = {};
  if (hash && hash.length > 1) {
    const hashParams = new URLSearchParams(hash.substring(1));
    hashParams.forEach((value, key) => {
      params[key] = value;
    });
  }
  return params;
};

/**
 * Page de callback pour gérer les invitations Supabase Auth
 * Cette page intercepte les liens d'invitation et les redirige vers la bonne URL
 */
export const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Traitement de l\'invitation...');

  useEffect(() => {
    const handleInvitation = async () => {
      try {
        // Vérifier d'abord si on a des tokens dans le hash (#access_token=...)
        const hashParams = parseHashParams(window.location.hash);
        const hasHashTokens = hashParams.access_token && hashParams.refresh_token;

        // Si on a des tokens dans le hash, établir la session directement
        if (hasHashTokens) {
          setMessage('Connexion en cours...');
          
          try {
            const { data, error } = await supabase.auth.setSession({
              access_token: hashParams.access_token,
              refresh_token: hashParams.refresh_token,
            });

            if (error) throw error;

            // Nettoyer le hash de l'URL
            window.history.replaceState(null, '', window.location.pathname + window.location.search);

            if (data.session) {
              setStatus('success');
              setMessage('Connexion réussie ! Redirection...');
              
              // Vérifier si c'est une invitation (première connexion)
              const isInvite = hashParams.type === 'invite' || searchParams.get('type') === 'invite';
              
              setTimeout(() => {
                if (isInvite) {
                  // Pour une invitation, rediriger vers la page de création de mot de passe
                  navigate('/admin/login?invite=true');
                } else {
                  // Sinon, rediriger vers le dashboard
                  navigate('/admin/dashboard');
                }
              }, 2000);
              return;
            }
          } catch (sessionError: any) {
            console.error('Erreur lors de l\'établissement de la session:', sessionError);
            // Continuer avec le traitement normal si l'établissement de session échoue
          }
        }

        // Récupérer les paramètres de l'URL (query params)
        const token = searchParams.get('token');
        const type = searchParams.get('type');
        const tokenHash = searchParams.get('token_hash');

        // Si c'est une invitation (type=invite)
        if (type === 'invite' && (token || tokenHash)) {
          setMessage('Vérification de l\'invitation...');
          
          // Vérifier d'abord si on a déjà une session
          const { data: { session: existingSession } } = await supabase.auth.getSession();
          
          if (existingSession) {
            setStatus('success');
            setMessage('Invitation acceptée avec succès ! Redirection...');
            setTimeout(() => {
              navigate('/admin/dashboard');
            }, 2000);
            return;
          }

          // Si on a un token_hash, essayer de l'échanger
          if (tokenHash) {
            try {
              // Supabase devrait automatiquement traiter le token_hash dans l'URL
              // On attend un peu pour que Supabase traite le token
              await new Promise(resolve => setTimeout(resolve, 1500));

              // Vérifier si l'utilisateur est maintenant connecté
              const { data: { session } } = await supabase.auth.getSession();
              
              if (session) {
                setStatus('success');
                setMessage('Invitation acceptée avec succès ! Redirection...');
                setTimeout(() => {
                  navigate('/admin/dashboard');
                }, 2000);
                return;
              }
            } catch (tokenError: any) {
              console.error('Erreur lors du traitement du token:', tokenError);
            }
          }

          // Si pas de session, rediriger vers la page de connexion
          // avec un message indiquant qu'il faut créer un mot de passe
          setStatus('success');
          setMessage('Redirection vers la création de compte...');
          setTimeout(() => {
            navigate('/admin/login?invite=true');
          }, 2000);
        } 
        // Si c'est une réinitialisation de mot de passe ou autre type
        else if (token || tokenHash) {
          setMessage('Traitement de la demande...');
          
          // Rediriger vers la page de connexion avec le token
          // La page de login gérera le reste
          setTimeout(() => {
            navigate(`/admin/login?token=${token || tokenHash}&type=${type || 'recovery'}`);
          }, 1000);
        }
        // Si aucun token, rediriger vers la page d'accueil
        else {
          setStatus('error');
          setMessage('Lien invalide. Redirection...');
          setTimeout(() => {
            navigate('/');
          }, 2000);
        }
      } catch (error: any) {
        console.error('Erreur lors du traitement de l\'invitation:', error);
        setStatus('error');
        setMessage(`Erreur: ${error.message || 'Une erreur est survenue'}`);
        
        setTimeout(() => {
          navigate('/admin/login');
        }, 3000);
      }
    };

    handleInvitation();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          {status === 'loading' && (
            <div className="mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
            </div>
          )}
          {status === 'success' && (
            <div className="mb-4">
              <div className="rounded-full h-12 w-12 bg-green-100 flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          )}
          {status === 'error' && (
            <div className="mb-4">
              <div className="rounded-full h-12 w-12 bg-red-100 flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
          )}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {status === 'loading' && 'Traitement en cours...'}
            {status === 'success' && 'Succès !'}
            {status === 'error' && 'Erreur'}
          </h2>
          <p className="text-gray-600">{message}</p>
        </div>
      </div>
    </div>
  );
};
