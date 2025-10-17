# SimplifIA : L'Agent d'Autonomie Administrative

## Vue d'ensemble

Le projet **SimplifIA** est un agent d'Intelligence Artificielle agentique conçu pour mettre fin à la surcharge administrative et à l'exclusion numérique en transformant le labyrinthe administratif en un service simple et conversationnel. Notre solution passe de l'information statique à l'action proactive et autonome, en se concentrant sur une IA éthique et transparente.

### Public cible

Le public cible est double et vise à maximiser l'impact :
- **Personnes en difficulté cognitive** : Pour lesquelles la navigation en ligne est une barrière invisible
- **Professionnels et individus pressés** : Qui cherchent à récupérer le temps perdu dans les démarches complexes

## L'État de l'Art et la Différenciation Agentique

Les solutions actuelles, qu'elles soient des chatbots administratifs ou des plateformes de téléservices, sont soit :
- **Informationnelles** : elles répondent à une question
- **Réactives** : elles nécessitent l'intervention constante de l'utilisateur

Les systèmes d'automatisation RPA classiques sont quant à eux trop rigides et s'effondrent à la moindre variation.

**SimplifIA** se distingue en incarnant le véritable concept d'IA agentique : il **raisonne, planifie, agit et se corrige** de manière autonome. L'innovation clé n'est pas de donner la bonne réponse, mais de garantir l'exécution complète de la démarche jusqu'à son succès, avec une emphase sur la résilience et la transparence humaine-dans-la-boucle.

## Fonctionnalités Exceptionnelles Détaillées

Le cœur de SimplifIA réside dans son moteur d'exécution agentique, qui garantit l'efficacité sans sacrifier le contrôle utilisateur :

### 1. Orchestration Proactive Multi-Organismes et Planification

L'agent utilise **Vertex AI** pour analyser la requête de l'utilisateur et décide immédiatement de la séquence optimale de 15 à 20 démarches à enclencher, en respectant l'ordre de priorité légale et les délais critiques. L'agent ne s'arrête pas à la première tâche, il gère l'orchestration complète entre plusieurs entités (municipalité, fiscalité, banque, sécurité sociale).

### 2. RPA Conversationnel et Correction d'Erreur Autonome

L'agent exécute l'action en utilisant son **Outil d'Interaction Web** (simulé via Cloud Functions/Run) pour naviguer, remplir les formulaires et télécharger les pièces justificatives. 

L'innovation majeure est sa **résilience** : si un document est rejeté par l'administration (format incorrect ou pièce obsolète), l'agent décide lui-même de l'action corrective à mener (conversion de format, demande automatique de la nouvelle pièce) et ré-agit en soumettant la correction sans solliciter l'utilisateur pour une tâche technique.

### 3. Tableau de Bord de Confiance (Journalisation et Validation Visuelle)

C'est le **centre du contrôle utilisateur**. L'utilisateur suit l'avancement via un tableau de bord clair qui journalise chaque action de l'agent. À tout moment, l'utilisateur peut cliquer sur une étape complétée pour visualiser une capture d'écran de ce que l'agent a soumis, permettant une validation visuelle et une transparence totale.

### 4. Points de Contrôle Critique et Reprise Manuelle

L'agent est programmé pour s'arrêter aux étapes nécessitant une **décision éthique ou irréversible** (ex: "Voulez-vous que je clique sur 'Confirmer la Résiliation' ?"). 

De plus, l'utilisateur peut, à n'importe quelle étape du processus, cliquer sur le lien et être redirigé vers l'interface web réelle de l'administration pour reprendre le contrôle manuellement ou modifier une étape déjà complétée par l'agent.

### 5. Gestion Sécurisée des Données et Pièces Justificatives

L'agent accède aux identifiants et aux documents récurrents de l'utilisateur (simulés dans un **Coffre-fort Sécurisé** basé sur Cloud Secret Manager). L'agent remplit automatiquement les champs mais garantit que l'utilisateur garde le contrôle total en étant sollicité uniquement pour l'approbation d'accès et l'authentification critique.

## Défense contre les Attaques du Jury (Critères de Succès)

Face aux questions dures du jury, la réponse doit être centrée sur la valeur différenciante et la préparation technique :

### L'Innovation : Ce n'est qu'un RPA amélioré ?

**Non.** Notre solution est un **Agent Autonome** qui utilise l'IA pour le raisonnement, la planification et la résilience (autocorrection d'erreur). Le RPA exécute un script fixe ; SimplifIA est adaptatif et décide.

### La Confiance : Peut-on faire confiance à l'Agent s'il agit de manière invisible ?

La confiance est garantie par la **transparence par design**. L'action est invisible au sens de la complexité technique, mais elle est journalisée et modifiable. 

L'utilisateur a un **Tableau de Bord de Confiance** pour suivre l'évolution, un droit de regard (validation visuelle) sur chaque étape complétée, et la possibilité de reprendre le contrôle à tout moment. L'agent gère l'exécution technique, l'humain gère la décision et la validation.

### Souveraineté des Données et Sécurité

La confiance passe par la maîtrise de l'hébergement. Nous garantissons que les données les plus sensibles de l'utilisateur (justificatifs, identifiants de connexion, historique de l'agent) seront stockées **exclusivement en Europe**, dans des zones géographiques sous souveraineté européenne (France ou UE), via l'utilisation de **Google Cloud Platform (GCP)**. 

Cela assure une conformité totale au **RGPD** et renforce la confiance dans notre solution.

### Monétisation et Entrée sur le Marché

Nous privilégions un modèle **B2B2C** : notre solution sera financée par des assurances, mutuelles ou banques désireuses d'offrir ce service premium à leurs clients lors d'événements de vie critiques.

## Faisabilité Technique et Format de Déploiement

Une telle solution peut être implémentée sous plusieurs formes, toutes compatibles avec notre stack GCP :

### 1. Application Web (Recommandée pour le Hackathon)

C'est le format le plus rapide à démontrer. L'interface (Tableau de Bord de Confiance et chat conversationnel) serait hébergée sur **Firebase Hosting** ou **Cloud Run**. Le cœur agentique (logique de décision sur Vertex AI) et l'outil d'exécution (simulation d'interaction via Cloud Functions/Run) restent sur le backend GCP.

