const express = require('express');
const fetch = require('node-fetch');

const app = express();
app.use(express.json());

// CORS — autorise ton dashboard à appeler ce proxy
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ── Fonction utilitaire : obtenir un token France Travail ──────────────────
async function getToken() {
  const url = 'https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire';
  const body = new URLSearchParams({
    grant_type:    'client_credentials',
    client_id:     process.env.FT_CLIENT_ID,
    client_secret: process.env.FT_CLIENT_SECRET,
    scope:         'api_offresdemploiv2 o2dsoffre'
  });
  const r = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  const data = await r.json();
  if (!data.access_token) throw new Error('Token KO : ' + JSON.stringify(data));
  return data.access_token;
}

// ── Route santé ────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'Proxy France Travail — Agent POEI' });
});

// ── Route 1 : Offres d'emploi ──────────────────────────────────────────────
app.post('/offres', async (req, res) => {
  try {
    const { codeROME = 'H2909', commune = '69189', distance = '30', nbResultats = '25' } = req.body;
    const token = await getToken();
    const nb = Math.min(parseInt(nbResultats), 149);
    const url = `https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search` +
      `?codeROME=${codeROME}&commune=${commune}&distance=${distance}&range=0-${nb - 1}`;
    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
    });
    if (r.status === 204) return res.json({ resultats: [], total: 0 });
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Route 2 : Entreprises par secteur NAF ─────────────────────────────────
app.post('/entreprises', async (req, res) => {
  try {
    const { secteurActivite = '25', departement = '69', nbResultats = '20' } = req.body;
    const token = await getToken();
    const nb = Math.min(parseInt(nbResultats), 149);
    const url = `https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search` +
      `?secteurActivite=${secteurActivite}&departement=${departement}&range=0-${nb - 1}`;
    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
    });
    if (r.status === 204) return res.json({ resultats: [], total: 0 });
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Route 3 : Tension bassin (IMT) ────────────────────────────────────────
app.post('/tension', async (req, res) => {
  try {
    const { codeRome = 'H2909', codeDept = '69' } = req.body;
    const token = await getToken();
    const url = `https://api.francetravail.io/partenaire/stats-offres-demandes-emploi/v1/indicateur/imt` +
      `?codeRome=${codeRome}&codeDept=${codeDept}`;
    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
    });
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Route 4 : Référentiel ROME ────────────────────────────────────────────
app.get('/rome/:code', async (req, res) => {
  try {
    const token = await getToken();
    const url = `https://api.francetravail.io/partenaire/rome/v1/metier/${req.params.code}`;
    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
    });
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy FT actif sur le port ${PORT}`));
