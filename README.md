# Proxy France Travail — Agent POEI

Proxy Node.js/Express qui expose 4 routes pour l'Agent POEI :

| Route | Description |
|-------|-------------|
| `POST /offres` | Offres actives par ROME + localisation |
| `POST /entreprises` | Entreprises par secteur NAF + département |
| `POST /tension` | Indicateurs IMT tension bassin |
| `GET /rome/:code` | Fiche métier ROME |

## Variables d'environnement (à configurer sur Render)

```
FT_CLIENT_ID=votre_client_id_france_travail
FT_CLIENT_SECRET=votre_client_secret_france_travail
```

## Déploiement sur Render

1. Forker ce repo sur GitHub
2. Créer un Web Service sur render.com
3. Connecter le repo GitHub
4. Ajouter les variables d'environnement
5. Build Command : `npm install`
6. Start Command : `npm start`
