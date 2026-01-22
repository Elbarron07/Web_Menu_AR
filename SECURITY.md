# Sécurité de l'application Web Menu AR

## Mesures de sécurité implémentées

### 1. Row Level Security (RLS)

**Statut** : ✅ Activé sur toutes les tables

Les tables suivantes ont RLS activé :
- `menu_items`
- `menu_item_variants`
- `menu_item_hotspots`

**Politiques de sécurité** :
- ✅ **SELECT** : Autorisé pour tous les utilisateurs (lecture publique)
- ❌ **INSERT/UPDATE/DELETE** : Bloqué pour les utilisateurs anonymes

Les utilisateurs anonymes peuvent uniquement **lire** les données du menu. Toutes les opérations d'écriture nécessitent une authentification avec des privilèges administrateur (service_role).

### 2. Variables d'environnement

**Statut** : ✅ Configuré

Les clés Supabase ne sont plus en dur dans le code source. Elles sont chargées depuis les variables d'environnement :

- `VITE_SUPABASE_URL` : URL du projet Supabase
- `VITE_SUPABASE_ANON_KEY` : Clé publique (publishable key)

**Fichiers** :
- `.env.local` : Variables locales (non commitées, dans .gitignore)
- `.env.example` : Template pour les variables

### 3. Headers de sécurité HTTP

**Statut** : ✅ Configuré dans vite.config.ts

Les headers suivants sont envoyés avec chaque réponse HTTP :

- **Content-Security-Policy** : Restreint les sources de contenu autorisées
  - `connect-src` autorise `blob:` pour permettre le chargement des textures des modèles 3D GLB/GLTF par `model-viewer`
  - `img-src` autorise `blob:` pour l'affichage des images générées dynamiquement
- **Strict-Transport-Security** : Force l'utilisation de HTTPS
- **X-Frame-Options** : Empêche l'intégration dans des iframes (protection XSS)
- **X-Content-Type-Options** : Empêche le navigateur de deviner le type MIME
- **X-XSS-Protection** : Active la protection XSS du navigateur
- **Referrer-Policy** : Contrôle les informations de référent envoyées
- **Permissions-Policy** : Contrôle les fonctionnalités du navigateur

### 4. HTTPS

**Statut** : ✅ Forcé

- Toutes les requêtes vers Supabase utilisent HTTPS
- Le header `upgrade-insecure-requests` force la mise à niveau vers HTTPS
- HSTS activé pour forcer HTTPS pendant 1 an

## Protection contre les attaques

### ✅ Protection contre l'interception de trafic

- Toutes les communications utilisent HTTPS (TLS/SSL)
- Headers HSTS pour forcer HTTPS
- Pas de requêtes HTTP mixtes

### ✅ Protection contre les injections SQL

- Utilisation du client Supabase avec requêtes paramétrées
- RLS comme couche de sécurité supplémentaire
- Pas d'accès direct à la base de données depuis le frontend

### ✅ Protection contre les attaques XSS

- Content Security Policy (CSP) strict
- Headers X-XSS-Protection
- X-Frame-Options pour empêcher le clickjacking
- Autorisation de `blob:` dans `connect-src` et `img-src` uniquement pour le chargement des ressources 3D locales (modèles GLB/GLTF)

### ✅ Protection contre les modifications non autorisées

- RLS bloque toutes les opérations INSERT/UPDATE/DELETE pour les utilisateurs anonymes
- Seuls les administrateurs avec service_role peuvent modifier les données
- Validation côté serveur via RLS

## Utilisation sécurisée

### Pour les développeurs

1. **Ne jamais commiter** le fichier `.env.local`
2. **Utiliser uniquement** la clé `anon` ou `publishable` côté client
3. **Ne jamais exposer** la clé `service_role` dans le code client
4. **Tester les politiques RLS** avant de déployer

### Pour la production

1. S'assurer que l'application est servie via HTTPS
2. Vérifier que les headers de sécurité sont bien envoyés
3. Configurer les variables d'environnement sur la plateforme de déploiement
4. Activer le monitoring des tentatives d'accès non autorisées

## Vérification de la sécurité

Pour vérifier que tout fonctionne correctement :

1. **RLS** : Tenter un INSERT depuis le client devrait échouer
2. **Variables d'environnement** : Vérifier que l'application démarre sans erreur
3. **Headers** : Inspecter les headers HTTP dans les DevTools du navigateur
4. **HTTPS** : Vérifier que toutes les requêtes utilisent HTTPS

## Notes importantes

- Les clés "anon" ou "publishable" de Supabase sont **conçues** pour être exposées côté client avec RLS activé
- RLS est la première ligne de défense : même si quelqu'un obtient la clé, il ne peut que lire les données publiques
- Les opérations d'écriture nécessitent une authentification appropriée (service_role) qui ne doit **JAMAIS** être exposée côté client
