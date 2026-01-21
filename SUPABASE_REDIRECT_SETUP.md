# Configuration des URLs de redirection Supabase

## Problème
Les liens d'invitation Supabase Auth pointent vers `localhost:3000` au lieu de `https://web-menu-ar.vercel.app/`.

## Solution

### Option 1 : Configuration dans le Dashboard Supabase (Recommandé)

1. **Accéder au Dashboard Supabase** :
   - Allez sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Sélectionnez votre projet "Web menu AR"

2. **Configurer les URLs de redirection** :
   - Allez dans **Authentication** > **URL Configuration**
   - Dans la section **Site URL**, définissez :
     ```
     https://web-menu-ar.vercel.app
     ```
   - Dans la section **Redirect URLs**, ajoutez :
     ```
     https://web-menu-ar.vercel.app/auth/callback
     https://web-menu-ar.vercel.app/admin/login
     ```
   - Cliquez sur **Save**

3. **Configurer les emails d'invitation** :
   - Allez dans **Authentication** > **Email Templates**
   - Sélectionnez le template **Invite user**
   - Dans le champ **Redirect URL**, remplacez `{{ .SiteURL }}` par :
     ```
     https://web-menu-ar.vercel.app/auth/callback
     ```
   - Ou utilisez la variable `{{ .SiteURL }}/auth/callback` si `Site URL` est correctement configuré
   - Cliquez sur **Save**

### Option 2 : Utiliser la page de callback (Déjà implémentée)

Une page de callback a été créée à `/auth/callback` qui :
- Intercepte les liens d'invitation
- Traite les tokens d'invitation
- Redirige vers la page de connexion avec le mode invitation activé

**Comment utiliser** :
1. Dans le Dashboard Supabase, configurez l'URL de redirection comme suit :
   ```
   https://web-menu-ar.vercel.app/auth/callback
   ```

2. Les liens d'invitation pointeront automatiquement vers cette page qui gérera le reste.

### Vérification

Pour tester la configuration :

1. **Créer une invitation** :
   - Dans Supabase Dashboard > **Authentication** > **Users**
   - Cliquez sur **Invite user**
   - Entrez l'email de l'utilisateur
   - L'email d'invitation devrait contenir un lien vers `https://web-menu-ar.vercel.app/auth/callback?...`

2. **Vérifier le lien** :
   - Ouvrez l'email d'invitation
   - Le lien devrait pointer vers votre domaine de production, pas `localhost`

## Notes importantes

- ⚠️ **Les changements dans le Dashboard Supabase prennent effet immédiatement**
- ✅ **La page `/auth/callback` est déjà déployée et fonctionnelle**
- 🔒 **Assurez-vous que les URLs de redirection sont en HTTPS en production**

## Structure des URLs

- **Page de callback** : `https://web-menu-ar.vercel.app/auth/callback`
- **Page de login** : `https://web-menu-ar.vercel.app/admin/login`
- **Dashboard admin** : `https://web-menu-ar.vercel.app/admin/dashboard`

## Support

Si les liens d'invitation pointent toujours vers `localhost`, vérifiez :
1. Que `Site URL` est bien configuré dans Supabase Dashboard
2. Que les templates d'email utilisent `{{ .SiteURL }}` ou l'URL complète
3. Que les variables d'environnement sont correctes en production
