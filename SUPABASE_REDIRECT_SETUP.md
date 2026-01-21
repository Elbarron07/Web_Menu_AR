# Configuration des URLs de redirection Supabase

## Problème
Les liens d'invitation Supabase Auth pointent vers `localhost:3000` au lieu de `https://web-menu-ar.vercel.app/`.

## Solutions implémentées

### Solution automatique côté code (Déjà active)

Une solution automatique a été implémentée dans le code pour intercepter et rediriger les liens localhost :

1. **Détection automatique** : Le composant `LocalhostChecker` détecte si l'application est accédée via `localhost` avec des tokens d'authentification
2. **Redirection automatique** : La page `LocalhostRedirect` redirige automatiquement vers `https://web-menu-ar.vercel.app/auth/callback` avec tous les paramètres préservés
3. **Gestion des tokens** : La page `AuthCallback` gère les tokens dans le hash (`#access_token=...`) et établit automatiquement la session Supabase

**Comment ça fonctionne** :
- Si un utilisateur clique sur un lien d'invitation pointant vers `localhost:3000/#access_token=...`
- Le composant détecte automatiquement la présence de tokens sur localhost
- Redirection automatique vers `https://web-menu-ar.vercel.app/localhost-redirect`
- La page extrait les tokens et redirige vers `/auth/callback` avec les mêmes paramètres
- La session est établie et l'utilisateur est redirigé vers le dashboard ou la page de création de mot de passe

**Cette solution fonctionne même si Supabase Dashboard n'est pas configuré correctement.**

### Option 1 : Configuration dans le Dashboard Supabase (Recommandé pour éviter la redirection)

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

## Configuration du client Supabase

Le client Supabase est configuré avec `redirectTo` explicite dans `src/lib/supabase.ts` :

```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    redirectTo: `${siteUrl}/auth/callback`,
    flowType: 'pkce'
  }
});
```

L'URL de redirection est déterminée par :
1. La variable d'environnement `VITE_SITE_URL` (si définie)
2. Sinon, `window.location.origin` (URL actuelle)
3. Sinon, `https://web-menu-ar.vercel.app` (fallback)

### Variable d'environnement

Ajoutez dans votre `.env.local` (et configurez dans Vercel) :

```env
VITE_SITE_URL=https://web-menu-ar.vercel.app
```

## Notes importantes

- ✅ **La solution automatique fonctionne même si Supabase Dashboard n'est pas configuré**
- ⚠️ **Les changements dans le Dashboard Supabase prennent effet immédiatement**
- ✅ **La page `/auth/callback` gère automatiquement les tokens dans le hash**
- ✅ **La redirection automatique préserve tous les paramètres d'authentification**
- 🔒 **Assurez-vous que les URLs de redirection sont en HTTPS en production**

## Structure des URLs

- **Page de redirection localhost** : `https://web-menu-ar.vercel.app/localhost-redirect`
- **Page de callback** : `https://web-menu-ar.vercel.app/auth/callback`
- **Page de login** : `https://web-menu-ar.vercel.app/admin/login`
- **Dashboard admin** : `https://web-menu-ar.vercel.app/admin/dashboard`

## Flux de redirection complet

```
Email d'invitation (localhost:3000/#access_token=...)
    ↓
LocalhostChecker détecte localhost + tokens
    ↓
Redirection vers /localhost-redirect
    ↓
LocalhostRedirect extrait les tokens
    ↓
Redirection vers https://web-menu-ar.vercel.app/auth/callback?...
    ↓
AuthCallback traite les tokens (hash ou query params)
    ↓
Établit la session Supabase avec setSession()
    ↓
Redirige vers /admin/login?invite=true ou /admin/dashboard
```

## Dépannage

### Si les liens d'invitation pointent toujours vers `localhost`

1. **Vérifier la configuration Supabase Dashboard** :
   - Allez dans **Authentication** > **URL Configuration**
   - Vérifiez que `Site URL` est défini sur `https://web-menu-ar.vercel.app`
   - Vérifiez que les `Redirect URLs` incluent `https://web-menu-ar.vercel.app/auth/callback`

2. **Vérifier le template d'email** :
   - Allez dans **Authentication** > **Email Templates** > **Invite user**
   - Vérifiez que le champ `Redirect URL` utilise `{{ .SiteURL }}/auth/callback` ou l'URL complète

3. **Vérifier les variables d'environnement** :
   - En production (Vercel), vérifiez que `VITE_SITE_URL` est définie
   - En local, vérifiez votre `.env.local`

4. **Tester la redirection automatique** :
   - Même si Supabase génère des liens localhost, la solution automatique devrait les intercepter
   - Ouvrez la console du navigateur pour voir les logs de redirection

### Si la redirection automatique ne fonctionne pas

1. Vérifiez que le composant `LocalhostChecker` est bien monté dans `App.tsx`
2. Vérifiez que la route `/localhost-redirect` existe dans `App.tsx`
3. Vérifiez la console du navigateur pour les erreurs JavaScript

### Si la session n'est pas établie après redirection

1. Vérifiez que `AuthCallback` extrait correctement les tokens du hash
2. Vérifiez que `supabase.auth.setSession()` est appelé avec les bons tokens
3. Vérifiez la console pour les erreurs d'authentification Supabase
