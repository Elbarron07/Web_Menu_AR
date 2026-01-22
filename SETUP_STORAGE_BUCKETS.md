# Configuration des buckets Supabase Storage

## Problème
Les buckets `3d-models` et `images` n'existent pas encore dans Supabase Storage, ce qui cause des erreurs 400 lors des uploads.

## Solution : Créer les buckets dans Supabase Dashboard

### 1. Accéder à Supabase Storage

1. Allez sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet "Web menu AR"
3. Allez dans **Storage** dans le menu de gauche

### 2. Créer le bucket `3d-models`

1. Cliquez sur **New bucket**
2. Nom du bucket : `3d-models` (⚠️ **Important** : utilisez exactement ce nom, avec le tiret)
3. **Public bucket** : ✅ **Activé** (pour permettre l'accès public aux modèles 3D)
4. **File size limit** : 50 MB (ou plus selon vos besoins)
5. **Allowed MIME types** : 
   - `model/gltf-binary` (pour les fichiers .glb)
   - `model/gltf+json` (pour les fichiers .gltf)
   - `application/octet-stream` (fallback pour certains navigateurs)
   
   ⚠️ **Important** : Ajoutez les trois types MIME séparément, un par ligne dans le champ "Allowed MIME types"
6. Cliquez sur **Create bucket**

### 3. Créer le bucket `images`

1. Cliquez sur **New bucket**
2. Nom du bucket : `images`
3. **Public bucket** : ✅ **Activé** (pour permettre l'accès public aux images)
4. **File size limit** : 10 MB (ou plus selon vos besoins)
5. **Allowed MIME types** : `image/jpeg`, `image/png`, `image/webp`, `image/gif`
6. Cliquez sur **Create bucket**

### 4. Politiques RLS configurées automatiquement

Les politiques RLS suivantes ont été configurées via migration SQL :

**Pour `3d-models`** :
- ✅ **SELECT** : Public (tous peuvent lire les fichiers)
- ✅ **INSERT** : Utilisateurs authentifiés uniquement (la vérification admin se fait côté application)
- ✅ **UPDATE/DELETE** : Utilisateurs authentifiés uniquement

**Pour `images`** :
- ✅ **SELECT** : Public (tous peuvent lire les fichiers)
- ✅ **INSERT** : Utilisateurs authentifiés uniquement (la vérification admin se fait côté application)
- ✅ **UPDATE/DELETE** : Utilisateurs authentifiés uniquement

> **Note** : La vérification que l'utilisateur est admin se fait côté application (dans le code React) avant d'appeler l'upload, donc seuls les admins peuvent réellement uploader via l'interface admin.

## Vérification

Après avoir créé les buckets, testez l'upload d'un fichier dans l'admin panel :
1. Allez dans **Admin** > **Assets**
2. Essayez d'uploader un modèle 3D (.glb)
3. Vérifiez qu'il n'y a plus d'erreur "Bucket not found"

## Notes importantes

- Les buckets doivent être créés manuellement dans le Dashboard Supabase
- Les buckets doivent être publics pour que les modèles 3D et images soient accessibles depuis le frontend
- Les politiques RLS peuvent être configurées pour restreindre les uploads aux utilisateurs authentifiés uniquement
- ⚠️ **Important** : Ajoutez **tous les types MIME** listés (y compris `application/octet-stream`) car certains navigateurs détectent les fichiers GLB avec ce type MIME par défaut
- Le code a été mis à jour pour détecter automatiquement le bon MIME type selon l'extension du fichier (.glb → `model/gltf-binary`, .gltf → `model/gltf+json`)

## Voir aussi

Pour un guide rapide de dépannage, consultez `QUICK_FIX_STORAGE.md`
