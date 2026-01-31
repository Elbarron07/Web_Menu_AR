# Dashboard Admin - Documentation

## Accès

L'interface admin est accessible à l'adresse : `/admin`

## Première connexion

Tout utilisateur authentifié via Supabase Auth a automatiquement accès à l'interface admin.

1. Créer un compte utilisateur via Supabase Auth (Dashboard Supabase > Authentication > Users)
2. Se connecter avec les identifiants sur `/admin/login`

## Modules disponibles

### 1. Dashboard
Vue d'ensemble avec statistiques et plats récents.

### 2. Gestion du Menu
- CRUD complet des plats
- Recherche et filtres
- Gestion des variantes
- Upload d'images 2D

### 3. Asset Manager 3D
- Upload de fichiers .glb/.gltf
- Éditeur de hotspots interactif
- Preview 3D

### 4. Analytics
- Métriques d'engagement AR
- Graphiques de visualisation
- Taux de conversion
- Top plats

### 5. Paramètres
- Configuration du restaurant
- Générateur de QR Codes
- Upload de logo

## Configuration Supabase Storage

Assurez-vous que les buckets suivants existent dans Supabase Storage :

1. **3d-models** : Pour les fichiers .glb
2. **images** : Pour les images 2D et logos

Créer les buckets via l'interface Supabase ou via SQL :

```sql
-- Les buckets seront créés automatiquement lors du premier upload
-- Ou créez-les manuellement via l'interface Supabase Storage
```

## Sécurité

- Toutes les routes admin sont protégées par authentification
- RLS activé sur toutes les tables
- Seuls les admins authentifiés peuvent modifier les données
- Les utilisateurs anonymes peuvent uniquement lire les données publiques
