# Master Prompt & Spécifications - Refonte Cinehub V2 (2026)

**Contexte pour Claude Code :**
Tu es chargé de développer la V2 de l'application web "Cinehub". La V1 était un simple fichier HTML/CSS/JS utilisant l'API OMDb. L'objectif de cette V2 est de créer un catalogue consultatif de films ultra-moderne, performant, immersif et sécurisé, en utilisant des technologies actuelles (Next.js) et l'API TMDB. Agis en tant que développeur Senior Full-Stack et UI/UX Engineer.

---

## 1. Stack Technique
- **Framework :** Next.js (App Router, Server Components privilégiés)
- **Styling :** Tailwind CSS
- **Animations :** Framer Motion (Transitions de pages, modales, effets de survol)
- **Gestionnaire de paquets :** pnpm
- **API :** The Movie Database (TMDB) via `fetch` côté serveur
- **Déploiement :** Docker (Nginx pour servir la version exportée ou buildée)

## 2. Direction Artistique (UI/UX)
- **Thème :** "Dark Mode" profond par défaut (ex: `bg-gray-950`).
- **Couleur d'accentuation :** Bleu marine premium (ex: `text-blue-600` ou `bg-blue-700`).
- **Composants :** 
  - Effets "Glassmorphism" (fonds semi-transparents avec blur) pour les cartes au survol et les modales.
  - Bords subtilement arrondis (`rounded-xl` ou `rounded-2xl`).
- **Layout :** Grille asymétrique (Bento UI) pour le catalogue, mettant en évidence les films tendances avec des tuiles plus grandes.
- **Typographie :** Display géométrique pour les titres, sans-serif lisible (Inter/Roboto) pour les métadonnées.

## 3. User Stories
1. **En tant qu'utilisateur**, je veux voir un grand "Hero banner" immersif avec le film tendance du jour en arrière-plan pour être immédiatement plongé dans l'ambiance.
2. **En tant qu'utilisateur**, je veux parcourir une grille de films dynamique et esthétique pour découvrir de nouveaux contenus.
3. **En tant qu'utilisateur**, je veux survoler l'affiche d'un film pour voir apparaître instantanément sa note, son année et ses genres (effet glassmorphism).
4. **En tant qu'utilisateur**, je veux cliquer sur un film pour ouvrir une vue détaillée (modale ou page de détails fluide) contenant le synopsis complet et le casting.
5. **En tant qu'utilisateur**, je veux pouvoir regarder la bande-annonce YouTube directement depuis la fiche du film sans quitter la plateforme.
6. **En tant qu'utilisateur**, je veux utiliser un raccourci clavier (Cmd+K) ou une barre de recherche fluide pour trouver un film instantanément en tapant son titre.

## 4. User Flows
- **Flow Principal :** Arrivée sur la Home -> Visionnage du Hero -> Scroll sur la grille des tendances -> Survol d'une carte (aperçu rapide des infos) -> Clic sur la carte -> Ouverture de la page/modale détails.
- **Flow de Recherche :** Appui sur barre de recherche (ou Cmd+K) -> Ouverture de la Command Palette modale -> Frappe du nom du film (ex: "Inception") -> Apparition des résultats avec miniatures en temps réel -> Clic sur le résultat -> Ouverture des détails.
- **Flow Vidéo :** Depuis la page de détails -> Clic sur "Bande-annonce" -> Ouverture d'une modale vidéo (iframe YouTube) au centre de l'écran avec fond assombri.

## 5. Instructions d'exécution étape par étape (Pour Claude Code)

Claude, merci d'exécuter ces étapes de manière séquentielle. Attends ma validation entre les grandes phases ou si tu as besoin de clarifier une implémentation.

### Phase 1 : Initialisation et Sécurité
1. Initialise un nouveau projet Next.js avec Tailwind CSS et App Router en utilisant `pnpm`.
2. Installe `framer-motion` et `lucide-react` (pour les icônes).
3. Crée un fichier `.env.local` (ajoute-le au `.gitignore`) pour y stocker `TMDB_ACCESS_TOKEN`, `TMDB_BASE_URL` (https://api.themoviedb.org/3) et `TMDB_IMAGE_BASE_URL` (https://image.tmdb.org/t/p).
4. Configure le `next.config.js` pour autoriser les images provenant de `image.tmdb.org`.

### Phase 2 : Services API (TMDB)
1. Crée un dossier `lib/` ou `services/`.
2. Implémente un fichier `tmdb.js/ts` contenant les fonctions `fetch` configurées avec le header Authorization (Bearer Token).
3. Crée les méthodes suivantes : `getTrendingMovies()`, `searchMovies(query)`, `getMovieDetails(id)`, et `getMovieVideos(id)`. Assure-toi d'utiliser `language=fr-FR`.

### Phase 3 : Interface Globale & Hero Section
1. Configure le layout principal (`app/layout.tsx`) avec un fond global sombre et la configuration de la typographie.
2. Développe le composant `Hero` qui affiche le film #1 des tendances avec son image "backdrop" en plein écran (fondu dégradé vers le noir en bas) et le titre/synopsis superposé.

### Phase 4 : Grille Bento et Cartes de Films
1. Crée un composant `MovieCard` utilisant `next/image`. Ajoute un overlay `absolute` en glassmorphism (`backdrop-blur`) qui apparaît au `hover` (utilise Tailwind ou Framer Motion).
2. Dans la page d'accueil, implémente une grille (`display: grid`) qui affiche les résultats de `getTrendingMovies()`. Rends certaines cartes plus grandes (span-2) pour un style "Bento" asymétrique.

### Phase 5 : Recherche & Modales
1. Implémente une barre de recherche ou un bouton qui ouvre une "Command Palette".
2. Fais en sorte que la recherche interroge la route API interne de Next.js (ou directement la fonction serveur si possible) avec un *debounce* pour ne pas surcharger l'API TMDB.
3. Implémente la page de détails (Route dynamique `/movie/[id]`) ou une modale (Interception route) affichant les informations complètes et le bouton de lecture vidéo.
4. Intègre la modale de lecture de la bande-annonce YouTube.

### Phase 6 : Finalisation & Déploiement
1. Mets à jour le fichier existant `CLAUDE.md` pour refléter la nouvelle architecture (Next.js, TMDB, variables d'environnement, pnpm).
2. Mets à jour le `Dockerfile` pour permettre le build de l'application Next.js (soit en mode "standalone" soit en "static export" selon la stratégie choisie) et son hébergement.