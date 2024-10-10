# Jeu du Maillon Faible


## Architecture générale

L'application est construite sur une architecture client-serveur utilisant Node.js pour le backend, avec une base de données SQLite pour le stockage des données. La communication en temps réel est gérée via Socket.IO.

### Composants principaux :

1. **server.js** : Point d'entrée de l'application, gère les connexions HTTP et WebSocket.
2. **gameLogic.js** : Contient la logique principale du jeu.
3. **database.js** : Gère les interactions avec la base de données SQLite.

## Détails des composants

### 1. server.js

Ce fichier configure le serveur Express et Socket.IO. Il gère les connexions des clients et fait le lien entre les événements Socket.IO et la logique du jeu.

Principales fonctionnalités :
- Configuration du serveur Express et Socket.IO
- Gestion des connexions et déconnexions des clients
- Routage des événements Socket.IO vers les méthodes appropriées de la classe MaillonFaibleGame
- Endpoints API REST pour certaines fonctionnalités (création de partie, ajout de joueur, etc.)

### 2. gameLogic.js

Contient la classe `MaillonFaibleGame` qui encapsule toute la logique du jeu.

Principales méthodes :
- `demarrerPartie()` : Initialise une nouvelle partie
- `ajouterJoueur()` : Ajoute un nouveau joueur à une partie
- `demarrerManche()` : Commence une nouvelle manche
- `jouerTour()` : Gère un tour de jeu (réponse à une question)
- `terminerManche()` : Finalise une manche et gère le processus d'élimination
- `demarrerFaceAFace()` : Initialise la phase finale entre les deux derniers joueurs
- `jouerMortSubite()` : Gère la phase de mort subite en cas d'égalité

La classe utilise EventEmitter pour gérer certains événements asynchrones.

### 3. database.js

Gère la connexion à la base de données SQLite et fournit des fonctions pour interagir avec celle-ci.

Principales fonctionnalités :
- Création et initialisation des tables (questions, joueurs, parties, manches, tours)
- Fonctions CRUD pour chaque entité du jeu
- Requêtes spécifiques comme la récupération de questions aléatoires

## Flux de jeu

1. Création d'une partie
2. Ajout des joueurs
3. Début de la première manche
4. Séquence de questions/réponses
5. Fin de manche et élimination d'un joueur
6. Répétition des étapes 3-5 jusqu'à ce qu'il ne reste que deux joueurs
7. Face-à-face final
8. Potentielle mort subite
9. Fin de la partie et déclaration du gagnant

## Gestion des événements

La communication entre le serveur et les clients se fait principalement via des événements Socket.IO. Les principaux événements incluent :

- `creerPartie`
- `rejoindrePartie`
- `demarrerManche`
- `jouerTour`
- `voter`
- `demarrerFaceAFace`
- `repondreFaceAFace`
- `repondreMortSubite`

## Gestion des déconnexions

Le système gère les déconnexions inattendues des joueurs, permettant la continuité du jeu si possible ou terminant la partie si nécessaire.

## Base de données

Structure des principales tables :
- `questions` : Stocke toutes les questions du jeu
- `joueurs` : Informations sur les joueurs
- `parties` : Détails des parties en cours ou terminées
- `manches` : Informations sur chaque manche d'une partie
- `tours` : Enregistre chaque tour de jeu

## Points d'attention pour le développement futur

1. Gestion des erreurs : Implémenter une gestion plus robuste des erreurs, notamment pour les cas limites.
2. Tests : Développer une suite de tests unitaires et d'intégration.
3. Optimisation des performances : Surveiller les performances, notamment pour les requêtes à la base de données.
4. Sécurité : Implémenter des mesures de sécurité pour prévenir la triche et les attaques.

Cette documentation fournit une vue d'ensemble du système actuel et servira de base pour le développement futur, notamment pour l'implémentation du frontend.