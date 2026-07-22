# Quiz frontend Angular — Stock Auto

Quiz d'auto-évaluation lié à `parcours-frontend-angular.md`. Objectif : **rappel actif** —
répondre de mémoire AVANT de regarder.

**Règle d'or :** questions en haut, réponses tout en bas. On ne descend voir la réponse
qu'**après** avoir formulé la sienne à voix haute. Si on bute → on relit la section
correspondante du parcours, puis on retente le lendemain.

Niveaux : **1 = bases**, **2 = compréhension/comparaisons**, **3 = pièges réels du projet**.

---

## QUESTIONS

### Niveau 1 — Bases

1. En une phrase, que fait le frontend ?
2. Différence entre un **composant** et un **service** ?
3. À quoi servent les 3 dossiers **core / features / shared** ?
4. Comment est rangée une **feature** à l'intérieur (3 sous-dossiers) ?
5. C'est quoi un **standalone component** ?
6. À quoi sert `app.config.ts` ? Cite 2 `provide...`.
7. À quoi sert `app.routes.ts` ?
8. C'est quoi un **modèle** (`models/`) et pourquoi le définir tôt ?
9. C'est quoi un **Observable** (RxJS) ? Quand l'appel HTTP part-il vraiment ?
10. C'est quoi les **Reactive Forms** ?

### Niveau 2 — Compréhension

11. Pourquoi un composant ne doit-il **pas** appeler `HttpClient` directement ?
12. C'est quoi l'**injection de dépendances** (`inject(...)`) et quel avantage pour les tests ?
13. Que fait une **route paramétrée** comme `products/:productId` ?
14. Pourquoi lire **`problem.code`** plutôt que `problem.detail` côté front ?
15. Différence entre **validation front** (`Validators`) et **validation back** ?
16. C'est quoi un **signal** et pourquoi c'est utile pour l'affichage ?
17. C'est quoi le **CORS** et pourquoi on utilise un **proxy** en dev ?
18. C'est quoi un **mock** dans un test de composant ?

### Niveau 3 — Pièges réels du projet

19. Pourquoi `isSubmitting` ne suffit-il pas à empêcher une double-vente ?
20. Pourquoi faut-il renvoyer **la même** `Idempotency-Key` lors d'un retry, et pas une nouvelle ?
21. Pourquoi notre `SaleResponse` montre-t-il le montant en **string** et pas en `number` ?
22. Que se passe-t-il si on oublie d'importer `ReactiveFormsModule` dans un composant qui utilise
    un `FormGroup` ?

### Mini cas pratiques — « qu'est-ce qui se passe si… »

23. **Vente.** Le caissier double-clique sur « Valider ». Qu'est-ce qui le bloque côté front, et
    qu'est-ce qui le bloque pour de vrai côté serveur ?
24. **Réseau qui coupe.** L'appel échoue, l'app retry automatiquement. Avec quelle stratégie
    évite-t-on une double réception de stock ?
25. **Stock insuffisant.** Le backend renvoie un 409 `STOCK_INSUFFICIENT`. Comment le composant
    doit-il réagir pour afficher un message clair ?
26. **Liste de produits.** Tu appelles `listProducts()` mais rien ne s'affiche, aucune erreur.
    Quelle est la cause la plus probable ?

### Repérer l'erreur (code ou raisonnement)

27. Un composant fait `this.http.get(...)` directement dans la page. Quel principe casse-t-on et
    comment corriger ?
28. Un développeur écrit `if (err.error.detail === 'Stock insufficient')`. Pourquoi c'est fragile ?
29. « La validation `Validators.min(1)` suffit, le backend n'a pas besoin de revalider. » Vrai ou
    faux ? Pourquoi ?
30. Un service génère une **nouvelle** `Idempotency-Key` à chaque retry. Quel est le problème ?

---

### Compléments — notions du cours détaillé

31. Pourquoi `Money.amount` voyage-t-il en **string** et pas en `number` ?
32. C'est quoi un **signal** ? Comment on le crée, le met à jour, et l'expose en lecture seule ?
33. Pourquoi un service expose-t-il `_toasts.asReadonly()` plutôt que le signal brut ?
34. Que veut dire `providedIn: 'root'` sur un service ?
35. À quoi sert `ngOnInit` dans une page ?
36. Que fait `markAllAsTouched()` sur un formulaire ?
37. C'est quoi le **CORS** et pourquoi les services appellent `/api/v1/...` (chemin relatif) ?
38. Pourquoi modifie-t-on l'état des toasts **immutablement** (`[...list, item]`, `filter`) ?
39. C'est quoi **TestBed** ?
40. Que se passe-t-il si tu génères une **nouvelle** idempotency-key à chaque retry ?

---

## Planning de répétition espacée

| Jour | À faire | Cible |
|------|---------|-------|
| **Jour 1** | Niveau 1 (Q1–10) à voix haute | nommer les briques Angular |
| **Jour 3** | Niveaux 1 + 2 (Q1–18) | comprendre l'enchaînement |
| **Jour 7** | Niveau 2 + Niveau 3 (Q11–22) | tenir les pièges du projet |
| **Jour 14** | Tout : mini cas (Q23–30) + compléments (Q31–40) | savoir raconter un cas réel |
| **Jour 30** | Seulement les questions ratées avant | consolider les trous |

**Astuce mémoire :** une question répondue **sans hésiter** deux fois de suite → on la sort du
paquet. Une question ratée → elle revient le lendemain.

---

## RÉPONSES

<details>
<summary>Afficher les réponses (à n'ouvrir qu'après avoir répondu)</summary>

### Niveau 1

1. Le front **affiche** des écrans, **prend** les saisies, les **envoie** au backend, et
   **réaffiche** la réponse.
2. Un **composant** est un morceau d'écran (HTML + style + classe). Un **service** n'a pas d'écran ;
   il fait un travail (appeler l'API, notifier). Le composant utilise des services.
3. **core** = moteur transverse chargé une fois (API base, notifications). **features** = une
   capacité métier par dossier (products, sales…). **shared** = briques réutilisables (pipes, UI)
   sans logique métier.
4. `data-access/` (services qui parlent au backend), `models/` (types TypeScript), `pages/`
   (écrans).
5. Un composant qui **se suffit à lui-même** : il déclare ses propres `imports`, sans `NgModule`.
   C'est le style Angular moderne.
6. `app.config.ts` configure l'app au démarrage via des **providers**. Ex : `provideHttpClient()`
   (appels backend) et `provideRouter(routes)` (navigation).
7. À associer chaque **URL** à la **page** à afficher (la carte de navigation).
8. Un **modèle** est une `interface`/`type` décrivant la forme des données. Le définir tôt donne un
   **contrat** : le compilateur prévient si on lit un champ inexistant.
9. Un **Observable** est une « promesse de flux ». L'appel HTTP **ne part que quand on
   s'abonne** (`.subscribe(...)`). Sans abonnement, rien ne se passe.
10. Des formulaires **décrits en TypeScript** (`FormGroup`, `FormControl`, `Validators`), pas
    seulement dans le HTML. Plus contrôlables et testables.

### Niveau 2

11. Pour **séparer les responsabilités** : la page gère l'écran, le service gère le réseau. Ça rend
    le code réutilisable et testable (on peut mocker le service). On passe donc par un service
    `data-access`.
12. On **demande** une dépendance (`inject(HttpClient)`) au lieu de la fabriquer. Avantage tests :
    on peut fournir un **faux** à la place du vrai (mock) sans toucher le composant.
13. `:productId` est un **trou variable** dans l'URL : `/products/42` et `/products/99` mènent à la
    même page, qui lit l'id pour charger le bon produit.
14. `detail` est un **texte humain** variable (traduisible, contient parfois un nom de produit).
    `code` est une **constante stable** (`STOCK_INSUFFICIENT`), sûre à tester dans un `if`. Notre
    modèle définit un type `ProblemCode` exprès.
15. **Front** (`Validators`) = confort utilisateur, feedback immédiat. **Back** = vraie sécurité :
    le serveur ne fait jamais confiance au réseau. La front ne remplace jamais la back.
16. Un **signal** est une valeur réactive simple : quand elle change, Angular met à jour seulement
    les parties d'écran concernées. Plus simple et plus performant.
17. **CORS** = sécurité du navigateur qui bloque par défaut les appels vers un autre domaine/port.
    En dev, un **proxy** redirige `/api/v1/...` vers le backend (port 8080) pour contourner ça
    proprement.
18. Un **faux objet** qui imite une dépendance (ex : un faux `SalesApiService`) pour tester le
    composant **en isolation**, sans vrai backend.

### Niveau 3

19. `isSubmitting` ne bloque que le **double-clic** sur le même écran/session. Il ne protège pas
    contre un retry réseau, deux onglets, ou une coupure-renvoi. La vraie garantie vient de
    l'idempotency-key **appliquée par le backend**.
20. Parce que la **même clé** dit au serveur « c'est la même action » → il rejoue la réponse au
    lieu de créer un doublon. Une **nouvelle** clé serait vue comme une **nouvelle** action →
    double enregistrement.
21. Parce qu'en `number`, JavaScript perd de la précision sur les montants (flottants). En
    **string**, le montant est exact et le front le parse comme décimal sûr.
22. Le template ne reconnaît pas les directives de formulaire (`formGroup`, `formControlName`) →
    **erreur de compilation/template**. Il faut ajouter `ReactiveFormsModule` aux `imports` du
    composant standalone.

### Mini cas

23. Côté front : `isSubmitting = true` désactive le bouton pendant l'envoi (anti double-clic). Côté
    serveur : l'**idempotency-key** garantit qu'un même envoi (même clé) n'enregistre qu'une vente.
24. On génère **une** `Idempotency-Key` par tentative métier et on **renvoie la même** au retry.
    Le backend rejoue alors la réponse au lieu de créer une 2e réception.
25. Dans le bloc `error: (err: HttpErrorResponse)`, lire `err.error as ProblemDetail`, tester
    `problem.code === 'STOCK_INSUFFICIENT'`, et afficher un message clair (« stock insuffisant »).
26. La cause la plus probable : on **n'a pas appelé `.subscribe()`** sur l'Observable, donc l'appel
    HTTP n'est jamais parti. (Ou on n'a pas affecté la réponse à la variable du template.)

### Repérer l'erreur

27. On casse la **séparation des responsabilités** (la page fait du réseau). Corriger : déplacer
    l'appel dans un service `data-access` et faire `inject(...)` ce service dans la page.
28. `detail` est un texte libre qui peut changer/être traduit → le `if` cassera silencieusement.
    Corriger : tester `err.error.code === 'STOCK_INSUFFICIENT'`.
29. **Faux.** `Validators.min(1)` est du confort UX ; un appel hors UI, un bug ou un autre client
    peuvent envoyer n'importe quoi. Le backend doit toujours revalider.
30. Une nouvelle clé à chaque retry est vue comme une **nouvelle action** par le serveur → on perd
    toute protection → **doublon**. Il faut conserver et réutiliser la même clé pendant le retry.

### Compléments

31. Un `number` JavaScript perd de la précision sur les montants (flottants : `0.1 + 0.2 ≠ 0.3`).
    En **string**, le montant est exact ; c'est le miroir du `NUMERIC`/`BigDecimal` côté backend.
32. Un **signal** est une valeur réactive. On le crée avec `signal(initial)`, on le met à jour avec
    `.update(fn)` (ou `.set(v)`), et on l'expose en lecture seule avec `.asReadonly()`.
33. Pour que **seul le service écrive** l'état et que les composants ne fassent que **lire**. Ça
    évite qu'un composant modifie l'état des notifications dans le dos du service.
34. Le service est un **singleton** : une seule instance partagée dans toute l'app.
35. `ngOnInit` est appelée **une fois** quand le composant apparaît ; on y charge les données
    initiales (ex : la liste des produits avant d'afficher le formulaire de vente).
36. Elle marque tous les champs comme « touchés » pour **afficher les messages d'erreur** quand on
    tente d'envoyer un formulaire incomplet.
37. **CORS** = sécurité du navigateur qui bloque les appels vers un autre domaine/port. En appelant
    un **chemin relatif** `/api/v1/...`, l'appel part vers la même origine que le front ; un
    **proxy** dev le redirige vers le backend (port 8080), sans déclencher CORS.
38. Pour traiter l'état comme **immuable** : on crée un nouveau tableau au lieu de modifier
    l'ancien. C'est ce qui permet aux signals/à Angular de détecter proprement le changement et
    évite les bugs d'effet de bord.
39. **TestBed** est l'outil Angular qui **assemble** un composant (avec ses dépendances, souvent
    mockées) pour pouvoir le tester.
40. Le serveur voit chaque retry comme une **nouvelle action** → plus aucune protection → **doublon**
    (ex : double vente). Il faut **réutiliser la même clé** pendant toute la tentative.

</details>

---

## QUESTIONS — Étape 11 (déroulante catégories, devise, tests, CI)

### Niveau 1 — Bases

41. Dans le modèle `Category`, pourquoi le champ doit-il s'appeler **`id`** (et pas `categoryId`) ?
42. `listCategories()` renvoie un `Observable<Category[]>` — à quel moment la requête HTTP part-elle vraiment ?
43. Dans un `<select formControlName="categoryId">`, qu'est-ce qui est **envoyé** dans le formulaire, et qu'est-ce qui est **affiché** ?

### Niveau 2 — Compréhension

44. Pourquoi l'affectation `this.categories = ...` doit-elle se faire **dans le callback** de `subscribe` ?
45. À quoi sert `takeUntilDestroyed()` dans l'abonnement ?
46. Pourquoi a-t-on le droit de **coder en dur** la devise `'XAF'` au lieu de la demander à l'utilisateur ?

### Niveau 3 — Pièges réels du projet

47. Un test échoue avec `NG0201: No provider found for HttpClient`. Pourquoi, et comment corriger ?
48. Pourquoi faut-il fournir `HttpClient`/`Router` **dans le test** alors qu'on ne l'a jamais fait dans les composants de l'appli ?
49. En CI, pourquoi les tests Angular tournent-ils en **Chrome headless** et avec `--watch=false` ?

### Mini cas — « qu'est-ce qui se passe si… »

50. …dans l'interface `Category`, tu nommes le champ `categoryId` alors que le JSON renvoie `id` ?
51. …tu écris `this.categories = this.categoriesApi.listCategories()` (sans `subscribe`) ?

---

## RÉPONSES — Étape 11

<details>
<summary>Voir les réponses de l'Étape 11</summary>

41. Parce qu'Angular **désérialise le JSON par correspondance de nom de clé**. Le back renvoie `{ "id": "...", "name": "..." }` ; si le champ s'appelle `categoryId`, il vaudra `undefined`.

42. Au moment du **`subscribe`**. Un `Observable` est **paresseux** : tant que personne ne s'abonne, aucune requête ne part.

43. **Envoyé** : la `[value]` de l'`<option>` choisie, ici `category.id` (l'UUID). **Affiché** : le texte de l'option, ici `{{ category.name }}` (le nom). Nom affiché, id envoyé.

44. Parce que `listCategories()` renvoie un **flux asynchrone**, pas la donnée. La liste n'existe qu'**à l'arrivée** de la réponse HTTP → on ne peut la ranger que **dans** le callback déclenché à ce moment-là.

45. À se **désabonner automatiquement** quand le composant est détruit → évite les **fuites mémoire** (un abonnement qui survivrait au composant).

46. Parce que c'est une **constante métier stable** : dans ce magasin (Tchad), la devise est **toujours** le franc CFA `XAF`. Demander une info qui ne change jamais serait de la sur-ingénierie.

47. Le composant injecte `HttpClient` (via son service) mais le **TestBed** est un contexte **isolé** qui ne charge pas la config globale de l'appli. On corrige en ajoutant les providers : `provideHttpClient()`, `provideHttpClientTesting()` (et `provideRouter([])` si le composant utilise le routeur).

48. Parce que dans l'appli qui tourne, `HttpClient`/`Router` sont fournis **une fois globalement** au démarrage. Le TestBed, lui, monte un **mini-contexte** qui ne connaît que ce qu'on lui déclare → il faut lui **fournir explicitement** ce dont le composant a besoin.

49. Les tests Angular s'exécutent dans un **vrai navigateur** (Karma lance Chrome). Un serveur CI n'a **pas d'écran** → **Chrome headless** (sans interface). `--watch=false` fait que la commande **s'exécute une fois puis se termine** (sinon `ng test` reste ouvert et le job CI ne finit jamais).

50. Le champ `categoryId` restera **`undefined`** (aucune clé `categoryId` dans le JSON), et l'`<option>`/le formulaire enverra une valeur vide → bug silencieux.

51. Ça ne **compile même pas** (types incompatibles : un `Observable<Category[]>` n'est pas un `Category[]`), et surtout **aucune requête ne partirait** sans `subscribe`. Il faut s'abonner et ranger le résultat dans le callback.

</details>

---

_Lié à `parcours-frontend-angular.md`. Côté backend : `parcours-backend-spring.md` et
`quiz-backend-spring.md` dans le dépôt backend. Mettre à jour à chaque nouvelle feature._
