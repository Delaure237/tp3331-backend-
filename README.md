# 🏥 Projet Backend HospiCare API

## 📝 Description du Projet

Ce dépôt contient l'API RESTful (Backend) du projet HospiCare. Il est responsable de la gestion des données, de la logique métier (authentification, gestion des ressources) et sert de point de communication principal avec l'application Frontend.

---

## 🚀 Démarrage Rapide

Ces instructions vous guideront pour configurer et lancer le projet sur votre machine locale.

### Pré-requis

Avant de commencer, assurez-vous que les outils suivants sont installés :

* **Node.js** (recommandé: version 18 ou supérieure)
* **npm** (gestionnaire de paquets de Node.js)
* **Git**

### Installation

1.  **Cloner le dépôt**
    Ouvrez votre terminal et clonez le projet :

    ```bash
    git clone [https://github.com/Delaure237/tp3331-backend.git](https://github.com/Delaure237/tp3331-backend.git)
    cd tp3331-backend
    ```

2.  **Installer les dépendances du projet**
    Installez toutes les librairies nécessaires au projet (dépendances de production et de développement) :

    ```bash
    npm install
    ```

3.  **Installer les outils d'exécution (nodemon et ts-node)**
    Puisque le script `start` utilise `nodemon` et `ts-node` pour exécuter le code TypeScript, vous devez les installer globalement ou localement pour garantir la bonne exécution :

    ```bash
    # Installation globale (recommandé si vous les utilisez souvent)
    npm install -g nodemon ts-node

    # OU installation locale si vous préférez rester dans le projet
    # npm install --save-dev nodemon ts-node
    ```

4.  **Configuration des variables d'environnement**

    Créez un fichier nommé **`.env`** à la racine de votre projet. Ce fichier contient les paramètres de configuration sensibles.

    ***Exemple de `.env` (à adapter selon votre configuration de BDD et clés secrètes) :***
    ```env
    # Configuration du Serveur
    PORT=3000

    # Configuration de la Base de Données
    DB_HOST=localhost
    DB_PORT=5432 # ou 3306 pour MySQL, 27017 pour MongoDB
    DB_USER=hospi_user
    DB_PASS=votre_mot_de_passe
    DB_NAME=hospi_db

    # Clé Secrète pour l'authentification (JWT)
    JWT_SECRET=VOTRE_CLE_SECRETE_ULTRA_LONGUE
    ```

## ▶️ Lancement

### Démarrer en Mode Développement

Le script `start` utilise `nodemon` pour relancer automatiquement le serveur lors des modifications de fichier, et `ts-node` pour exécuter le code TypeScript sans compilation préalable.

```bash
npm start