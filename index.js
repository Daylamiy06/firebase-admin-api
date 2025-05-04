const express = require('express');
const admin = require('firebase-admin');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

// Configuration Firebase via .env
const serviceAccount = {
  type: "service_account",
  project_id: process.env.PROJECT_ID,
  private_key_id: process.env.PRIVATE_KEY_ID,
  private_key: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.CLIENT_EMAIL,
  client_id: process.env.CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.CLIENT_EMAIL)}`
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Liste des utilisateurs
app.get('/utilisateurs', async (req, res) => {
  try {
    const listAllUsers = async (nextPageToken, allUsers = []) => {
      const result = await admin.auth().listUsers(1000, nextPageToken);
      allUsers.push(...result.users);
      if (result.pageToken) return listAllUsers(result.pageToken, allUsers);
      return allUsers;
    };

    const utilisateurs = await listAllUsers();
    const simplifié = utilisateurs.map(user => ({
      uid: user.uid,
      email: user.email
    }));

    res.json(simplifié);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mise à jour utilisateur
app.post('/update-user', async (req, res) => {
  const { uid, email, password } = req.body;
  if (!uid) return res.status(400).json({ error: "uid requis" });

  try {
    const updatedUser = await admin.auth().updateUser(uid, {
      ...(email && { email }),
      ...(password && { password })
    });
    res.json({ success: true, user: { uid: updatedUser.uid, email: updatedUser.email } });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur en ligne sur le port ${PORT}`);
});
