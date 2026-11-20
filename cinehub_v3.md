Master Prompt & Spécifications - Refonte Cinehub V2 (IA Sommelier)

Contexte pour Claude Code :
Tu es chargé de développer la V2 de l'application web "Cinehub". Fini le simple catalogue classique : Cinehub V2 devient un "Sommelier de films propulsé par l'IA". L'utilisateur décrit son envie (scénario, ambiance, acteurs) en langage naturel, et l'application lui propose une sélection sur-mesure de 3 à 5 films, en lui indiquant où les regarder gratuitement. Agis en tant que développeur Senior Full-Stack et UI/UX Engineer.

1. Stack Technique

Framework : Next.js (App Router, Server Actions)

Styling : Tailwind CSS

Animations : Framer Motion (Transitions fluides, états de chargement)

IA (Le Cerveau) : Vercel AI SDK (avec OpenAI, Anthropic ou Google Gemini - à configurer via .env) pour analyser la requête et retourner un JSON structuré.

Données (L'Enrichissement) : L'API The Movie Database (TMDB) pour récupérer les affiches, synopsis, et les fournisseurs de streaming (via l'intégration JustWatch de TMDB).

Déploiement : Docker (Nginx ou Node standalone)

2. Direction Artistique (UI/UX)

Approche "Search-First" : Une page d'accueil minimaliste, sombre et immersive (bg-gray-950).

Composant Central : Une grande barre de recherche textuelle/textarea dynamique, avec un design "Glassmorphism" et une lueur (glow) bleue marine au focus.

Résultats : Affichage vertical ou en grille de 3 à 5 cartes premium. Chaque carte explique brièvement pourquoi le film a été choisi, ses métadonnées, et met en évidence un bouton "Regarder gratuitement".

3. User Stories

En tant qu'utilisateur dans l'incertitude, je veux arriver sur une page épurée qui m'invite à décrire le type de scénario ou l'ambiance que je recherche (ex: "Un huis clos psychologique avec une fin inattendue").

En tant qu'utilisateur, pendant que l'IA cherche, je veux voir une belle animation de chargement qui me fait patienter.

En tant qu'utilisateur, je veux recevoir une sélection ultra-ciblée de 3 à 5 films correspondant exactement à mon texte, avec les affiches en haute qualité.

En tant qu'utilisateur, je veux voir pour chaque proposition sur quelle plateforme je peux regarder le film gratuitement en streaming légal (ex: France.tv, Pluto TV, YouTube, etc.).

4. Architecture de la Solution (Logique Backend)

Lorsqu'un utilisateur soumet sa requête :

Server Action (Next.js) : Reçoit le texte.

Appel LLM : Demande à l'IA : "Trouve 5 films qui correspondent à cette description : [TEXTE]. Retourne un JSON avec un tableau d'objets contenant : titre, annee, raison_du_choix."

Appel TMDB (Recherche) : Pour chaque titre du JSON, chercher le film sur l'API TMDB pour obtenir son id.

Appel TMDB (Providers) : Avec l' id, appeler l'endpoint /movie/{id}/watch/providers pour extraire les options de streaming gratuites (catégories "free" ou "ads" pour la région FR ou globale).

Rendu : Retourner les données complètes au client pour affichage.

5. Instructions d'exécution étape par étape (Pour Claude Code)

Claude, merci d'exécuter ces étapes de manière séquentielle. Attends la validation de l'humain entre les grandes phases.

Phase 1 : Initialisation & Configuration

Initialise Next.js avec Tailwind CSS, App Router et pnpm.

Installe framer-motion, lucide-react, et les paquets nécessaires pour l'IA (ex: ai, @ai-sdk/openai).

Crée le fichier .env.local pour les clés : TMDB_ACCESS_TOKEN, et la clé API pour le LLM (ex: OPENAI_API_KEY).

Phase 2 : Services et Utilitaires (Backend)

Crée un service tmdb.js pour gérer : la recherche d'un film par titre exact, la récupération de ses détails, et la récupération de ses watch/providers (filtre les résultats pour ne garder que les flatrate, free ou ads).

Crée une Server Action generateRecommendations(userPrompt) qui utilise le LLM pour transformer la demande textuelle en une liste de 3-5 titres de films avec une courte phrase d'explication pour chacun.

Combine les deux : la Server Action appelle le LLM, puis boucle sur les résultats pour les enrichir avec les données TMDB (Affiche, Note, Providers).

Phase 3 : UI - Page d'accueil et Prompt

Développe le composant HeroSearch : Un grand champ de texte centré au milieu de l'écran avec un bouton d'envoi.

Gère les états : idle, loading (avec une belle animation Framer Motion de type "Analyse de vos goûts en cours..."), et success.

Phase 4 : UI - Affichage des Résultats

Crée le composant RecommendationCard. Il doit afficher : l'affiche du film (via next/image), le titre, l'année, la "raison du choix" générée par l'IA, et les logos/liens des plateformes de streaming gratuites trouvées via TMDB.

Si aucune plateforme gratuite n'est trouvée, affiche un message élégant type "Non disponible gratuitement pour le moment".

Phase 5 : Finalisation

Mets à jour le fichier CLAUDE.md avec cette nouvelle architecture IA.

Mets à jour le Dockerfile pour permettre le déploiement du projet Next.js avec ses Server Actions actives (nécessite un serveur Node.js, donc build standalone recommandé plutôt que export statique).