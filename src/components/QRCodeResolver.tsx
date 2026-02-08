import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

/**
 * Composant qui resoud un code QR court vers le contexte du restaurant
 * Route: /q/:code
 */
export const QRCodeResolver = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const resolve = async () => {
      if (!code) {
        navigate('/', { replace: true });
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('qr_codes')
          .select('id, type, label, code, metadata, is_active, scan_count')
          .eq('code', code)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (!data || !data.is_active) {
          setError('Ce QR code est invalide ou inactif.');
          setTimeout(() => navigate('/', { replace: true }), 2000);
          return;
        }

        // Stocker le contexte dans sessionStorage
        sessionStorage.setItem('qr_context', JSON.stringify({
          type: data.type,
          label: data.label,
          code: data.code,
          metadata: data.metadata,
          scanned_at: new Date().toISOString(),
        }));

        // Incrementer le compteur de scans (fire-and-forget)
        supabase
          .from('qr_codes')
          .update({ scan_count: (data.scan_count || 0) + 1 })
          .eq('id', data.id)
          .then();

        navigate('/', { replace: true });
      } catch {
        setError('Erreur lors du chargement.');
        setTimeout(() => navigate('/', { replace: true }), 2000);
      }
    };

    resolve();
  }, [code, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <p className="text-white text-lg mb-2">{error}</p>
          <p className="text-gray-400 text-sm">Redirection en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-500 mx-auto mb-4"></div>
        <p className="text-gray-400 text-sm">Chargement du menu...</p>
      </div>
    </div>
  );
};
