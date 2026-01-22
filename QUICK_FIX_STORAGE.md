# 🔧 Solution rapide : Créer les buckets Storage

## ⚠️ Problème actuel

Vous recevez ces erreurs :
- `Bucket not found` → Le bucket `3d-models` n'existe pas
- `mime type application/octet-stream is not supported` → Le bucket existe mais n'accepte pas ce type MIME

## ✅ Solution en 2 minutes

### Option 1 : Via le Dashboard Supabase (Recommandé)

1. **Ouvrez** [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. **Sélectionnez** votre projet "Web menu AR"
3. **Cliquez** sur **Storage** dans le menu de gauche
4. **Cliquez** sur **New bucket**

#### Pour le bucket `3d-models` :
- **Nom** : `3d-models` (exactement comme ça, avec le tiret)
- **Public** : ✅ **OUI** (cochez la case)
- **File size limit** : `50` MB
- **Allowed MIME types** : Cliquez sur "Add MIME type" et ajoutez **un par un** :
  1. `model/gltf-binary`
  2. `model/gltf+json`
  3. `application/octet-stream`
- **Cliquez** sur **Create bucket**

#### Pour le bucket `images` :
- **Nom** : `images`
- **Public** : ✅ **OUI**
- **File size limit** : `10` MB
- **Allowed MIME types** :
  1. `image/jpeg`
  2. `image/png`
  3. `image/webp`
  4. `image/gif`
- **Cliquez** sur **Create bucket**

### Option 2 : Via SQL (si vous avez accès au SQL Editor)

```sql
-- Note: Les buckets doivent être créés via l'API Storage ou le Dashboard
-- Cette requête vérifie seulement si les buckets existent
SELECT name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE name IN ('3d-models', 'images');
```

## 🧪 Vérification

Après avoir créé les buckets :

1. **Rafraîchissez** la page admin
2. **Allez** dans **Admin** > **Assets**
3. **Essayez** d'uploader un fichier `.glb`
4. **Vérifiez** qu'il n'y a plus d'erreur

## 📝 Notes importantes

- ✅ Les buckets **doivent être publics** pour que les fichiers soient accessibles depuis le frontend
- ✅ Ajoutez **tous les types MIME** listés ci-dessus (certains navigateurs détectent les fichiers GLB comme `application/octet-stream`)
- ✅ Le code a été mis à jour pour détecter automatiquement le bon MIME type selon l'extension du fichier

## 🐛 Si ça ne fonctionne toujours pas

1. Vérifiez que les buckets sont bien **publics** (icône de cadenas déverrouillé)
2. Vérifiez que tous les types MIME sont bien ajoutés
3. Vérifiez que vous êtes bien **connecté** en tant qu'admin (les politiques RLS nécessitent une authentification)
4. Vérifiez les logs dans la console du navigateur (F12)
5. Si vous voyez l'erreur "new row violates row-level security policy", vérifiez que les politiques RLS ont été créées (elles sont créées automatiquement via migration SQL)

## ✅ Politiques RLS

Les politiques RLS suivantes sont configurées automatiquement :
- ✅ Lecture publique pour tous
- ✅ Upload pour les utilisateurs authentifiés uniquement
- ✅ La vérification admin se fait côté application avant l'upload
