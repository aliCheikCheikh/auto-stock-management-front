# Cours frontend Angular — complet, du début à la fin

Ce fichier est le **cours détaillé** du frontend : chaque notion du projet (Angular 20), expliquée
simplement, avec un exemple du magasin, le code réel, les pièges, et une phrase à retenir.

Il suit l'**ordre réel de construction** d'un projet (0 → 10).

> On suppose la syntaxe TypeScript connue. On explique **l'enchaînement et les choix**.
> Pour s'entraîner : `quiz-frontend-angular.md`. Côté backend : `parcours-backend-spring.md` (dépôt
> backend).

**Comment réviser :** lire une étape, reformuler à voix haute chaque « phrase à retenir »,
répondre aux mini-questions sans regarder.

---

## Carte mentale du front

Le frontend = le **guichet** que voit le caissier. Il affiche des écrans, prend les saisies
(vendre, recevoir, transférer), les envoie au backend, et affiche la réponse.

Trois mots de base :

- **Composant** = un morceau d'écran (un formulaire, une page, un toast).
- **Service** = un objet **sans écran** qui fait un travail (appeler l'API, gérer les
  notifications).
- **Routing** = la carte « quelle URL → quel écran ».

**Phrase à retenir :** _le front affiche, saisit, envoie au backend, réaffiche la réponse._

---

# ÉTAPE 0 — Mise en place & structure

## 0.1 Standalone components (Angular moderne)

> **Mot expliqué — standalone component :** depuis Angular 14+, un composant **se suffit à
> lui-même** : il déclare ses propres `imports`, sans `NgModule`. Notre projet (Angular 20) est
> 100 % standalone.

Le démarrage se règle dans `app.config.ts`, où on **fournit** les grandes briques :

```ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),    // pour appeler le backend
    provideRouter(routes),  // pour la navigation
  ],
};
```

> **Mot expliqué — provider :** un branchement disponible dans toute l'app. `provideHttpClient()`
> rend `HttpClient` injectable partout ; `provideRouter(routes)` active les URLs.

## 0.2 La structure en 3 dossiers

```
src/app/
├── core/        ← le "moteur" transverse, chargé une fois (api, notifications)
├── features/    ← une fonctionnalité métier par dossier (products, sales, stock, ...)
└── shared/      ← briques réutilisables partout (pipes, petits composants ui)
```

Et chaque **feature** suit le même rangement :

```
features/sales/
├── data-access/   ← services qui parlent au backend (SalesApiService)
├── models/        ← types TypeScript (CreateSaleRequest, SaleResponse)
└── pages/         ← écrans (NewSalePage)
```

| Dossier | Rôle | Exemple |
|--------|------|---------|
| **core** | infra transverse, une seule fois | `core/api`, `core/notifications` |
| **features** | une capacité métier isolée | `products`, `sales`, `stock-receipts` |
| **shared** | réutilisable, sans logique métier | `shared/pipes`, `shared/ui` |

**Piège :** tout mettre dans un dossier géant. Quand le projet grossit, on ne retrouve plus rien.
Une feature doit pouvoir se lire seule.

**Phrase à retenir :** _core = moteur, features = métier, shared = briques réutilisables._

> **Mini-questions Étape 0**
> 1. C'est quoi un standalone component ?
> 2. À quoi servent les 3 dossiers core / features / shared ?
> 3. Que fait `provideHttpClient()` dans `app.config.ts` ?

---

# ÉTAPE 1 — Les modèles (types TypeScript)

**But :** décrire la **forme des données** échangées avec le backend **avant** de coder les écrans.
Ce sont des `interface`/`type` : aucun code, juste la structure. Le type est un **contrat** : le
compilateur prévient si on lit un champ qui n'existe pas.

Exemples réels (`core/api/`) :

```ts
// money.model.ts — l'argent arrive en STRING (précision), jamais en number
export interface Money { readonly amount: string; readonly currency: string; }

// page.model.ts — la pagination renvoyée par le backend
export interface Page<T> { readonly content: readonly T[]; readonly page: PageMeta; }

// problem-detail.model.ts — le format d'erreur (miroir du ProblemDetail backend)
export type ProblemCode =
  | 'VALIDATION_FAILED' | 'PRODUCT_NOT_FOUND' | 'STOCK_INSUFFICIENT' | 'INVALID_TRANSFER' | ...;
export interface ProblemDetail {
  readonly status: number;
  readonly detail?: string;
  readonly code?: ProblemCode;   // ← le champ FIABLE pour le front
  readonly errors?: readonly ProblemValidationError[];
}
```

**Pourquoi `Money.amount` est une string ?** Parce qu'un `number` JavaScript perd de la précision
sur les montants (flottants : `0.1 + 0.2 ≠ 0.3`). En string, le montant est exact. C'est le miroir
du `NUMERIC` / `BigDecimal` côté backend.

**Pourquoi un type `ProblemCode` énuméré ?** Pour forcer le front à comparer `problem.code` à des
constantes connues — voir Étape 6.

> **Mot expliqué — `readonly` :** le champ ne peut pas être modifié après réception. On traite les
> données du serveur comme **immuables** (on n'écrase pas une réponse par erreur).

**Phrase à retenir :** _on tape les données avant de coder l'écran ; le type est un garde-fou, et
l'argent voyage en string._

> **Mini-questions Étape 1**
> 1. Pourquoi définir les modèles tôt ?
> 2. Pourquoi `Money.amount` est une string et pas un number ?
> 3. À quoi sert le type `ProblemCode` ?

---

# ÉTAPE 2 — Les services data-access (parler au backend)

**But :** un **service** enveloppe les appels HTTP. Il est `@Injectable`, n'affiche rien, et c'est
le **seul** endroit qui connaît les URLs du backend.

Exemple réel — lecture (`ProductsApiService`) :

```ts
@Injectable({ providedIn: 'root' })
export class ProductsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = '/api/v1';

  listProducts(): Observable<Page<Product>> {
    return this.http.get<Page<Product>>(`${this.apiBaseUrl}/products`);
  }
}
```

Exemple réel — écriture avec idempotency (`SalesApiService`) :

```ts
sellProduct(request: CreateSaleRequest, idempotencyKey?: string): Observable<SaleResponse> {
  let headers = new HttpHeaders();
  if (idempotencyKey !== undefined) {
    headers = headers.set('Idempotency-Key', idempotencyKey);   // en-tête anti double-envoi
  }
  return this.http.post<SaleResponse>(`${this.apiBaseUrl}/sales`, request, { headers });
}
```

> **Mot expliqué — `inject(...)` / injection de dépendances :** au lieu de fabriquer `HttpClient`
> nous-mêmes, on le **demande** et Angular nous le fournit. Avantage : en test, on peut le
> remplacer par un faux.
>
> **Mot expliqué — `Observable` (RxJS) :** une « promesse de flux ». L'appel HTTP **ne part que
> quand on s'abonne** (`.subscribe(...)`). Tant que personne ne s'abonne, **rien ne se passe**.
>
> **Mot expliqué — `providedIn: 'root'` :** le service est un **singleton** : une seule instance
> partagée dans toute l'app.

**Phrase à retenir :** _le composant ne parle jamais directement au backend ; il passe par un
service data-access. Et un Observable ne part qu'au `.subscribe()`._

> **Mini-questions Étape 2**
> 1. Pourquoi un composant ne doit-il pas appeler `HttpClient` directement ?
> 2. Quand part vraiment l'appel HTTP d'un Observable ?
> 3. Que veut dire `providedIn: 'root'` ?

---

# ÉTAPE 3 — Les composants et les pages (les écrans)

**But :** un **composant** relie un template HTML, un style et une classe TypeScript. Une **page**
est un composant branché sur une URL.

Exemple réel (`NewSalePage`) :

```ts
@Component({
  selector: 'app-new-sale-page',
  imports: [ReactiveFormsModule],          // standalone : il déclare ses imports
  templateUrl: './new-sale-page.html',
})
export class NewSalePage implements OnInit {
  private readonly salesApi = inject(SalesApiService);
  products: readonly Product[] = [];
  isSubmitting = false;
  errorMessage = '';

  ngOnInit(): void { /* charger les produits au démarrage de l'écran */ }
  onSubmit(): void { /* réagir au clic "Valider" */ }
}
```

Le composant : récupère ses services (`inject`), tient l'**état de l'écran** (`isSubmitting`,
`errorMessage`, `products`), et réagit aux actions.

> **Mot expliqué — `selector` :** le nom de la balise HTML du composant (`<app-new-sale-page>`).
> **Mot expliqué — `ngOnInit` :** une méthode appelée **une fois** quand le composant apparaît.
> Idéale pour charger les données initiales (ex : la liste des produits).

**Piège :** oublier d'ajouter une directive utilisée (ex `ReactiveFormsModule`) aux `imports` du
composant → erreur de template.

> **Mini-questions Étape 3**
> 1. Différence entre un composant et une page ?
> 2. À quoi sert `ngOnInit` ?
> 3. Pourquoi `ReactiveFormsModule` doit-il être dans `imports` ?

---

# ÉTAPE 4 — Les formulaires (Reactive Forms)

**But :** saisir proprement une vente / réception / transfert, avec validation immédiate.

Exemple réel (`NewSalePage`) :

```ts
readonly form = new FormGroup({
  productId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  quantity:  new FormControl(1,  { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
});

onSubmit(): void {
  if (this.isSubmitting) return;            // anti double-clic
  if (this.form.invalid) { this.form.markAllAsTouched(); return; }
  const formValue = this.form.getRawValue(); // lire les valeurs typées
  // ... construire la requête et appeler le service
}
```

> **Mot expliqué — Reactive Forms :** le formulaire vit dans le **TypeScript** (`FormGroup`,
> `FormControl`, `Validators`), pas seulement dans le HTML. On contrôle la validation, l'état
> (touché/invalide) et les valeurs depuis le code. Plus testable que les « template-driven forms ».

- `Validators.required`, `Validators.min(1)` = **validation côté front** (confort utilisateur).
- `markAllAsTouched()` = afficher les erreurs sur tous les champs quand on tente d'envoyer un
  formulaire incomplet.
- `getRawValue()` = lire les valeurs (y compris champs désactivés), typées.

**Rappel crucial :** la validation front ne **remplace jamais** la validation backend. Un appel
hors UI, un bug, un autre client peuvent envoyer n'importe quoi.

**Phrase à retenir :** _la validation front rend l'écran agréable ; seule la validation back
protège vraiment._

> **Mini-questions Étape 4**
> 1. Où vit un Reactive Form, et quel avantage ?
> 2. Que fait `markAllAsTouched()` ?
> 3. La validation front suffit-elle ? Pourquoi ?

---

# ÉTAPE 5 — Le routing (la carte des URLs)

**But :** associer chaque URL à une page. Exemple réel (`app.routes.ts`) :

```ts
export const routes: Routes = [
  { path: 'products', component: ProductsPage },
  { path: 'products/:productId', component: ProductDetailPage },  // :productId = paramètre
  { path: 'sales/new', component: NewSalePage },
  { path: 'stock-receipts/new', component: NewStockReceiptPage },
  { path: 'stock-transfers/new', component: NewStockTransfersPage },
  { path: '', redirectTo: 'products', pathMatch: 'full' },         // page d'accueil
];
```

> **Mot expliqué — route paramétrée (`:productId`) :** une URL avec un trou variable.
> `/products/42` et `/products/99` mènent à la même page, qui **lit l'id** pour charger le bon
> produit.
> **Mot expliqué — `redirectTo` + `pathMatch: 'full'` :** la racine `''` redirige vers `products`
> (la page par défaut).

> **Mini-questions Étape 5**
> 1. Que fait `products/:productId` ?
> 2. À quoi sert la route `{ path: '', redirectTo: ... }` ?

---

# ÉTAPE 6 — Gérer les réponses et les erreurs

**But :** afficher le résultat en cas de succès, et un message clair en cas d'erreur.

Quand l'appel échoue, le backend renvoie un **`ProblemDetail`** (même format que côté Spring) :

```ts
this.salesApi.sellProduct(request, key).subscribe({
  next:  (sale) => { this.successMessage = 'Vente enregistrée'; },
  error: (err: HttpErrorResponse) => {
    const problem = err.error as ProblemDetail;
    if (problem.code === 'STOCK_INSUFFICIENT') {
      this.errorMessage = 'Stock insuffisant pour ce produit.';
    }
  },
});
```

> **Mot expliqué — `HttpErrorResponse` :** l'objet d'erreur d'un appel HTTP raté. Le corps renvoyé
> par le backend est dans `err.error`.

**Le réflexe à graver :** on teste **`problem.code`** (constante stable), **jamais**
`problem.detail` (texte humain qui peut changer / être traduit). C'est pour ça que le modèle
définit un type `ProblemCode` énuméré.

**Phrase à retenir :** _côté front aussi : `code` pour le `if`, `detail` pour l'affichage._

> **Mini-questions Étape 6**
> 1. Où se trouve le corps d'erreur renvoyé par le backend ?
> 2. Pourquoi tester `code` et pas `detail` ?

---

# ÉTAPE 7 — Idempotency côté client

**But :** participer à la protection anti double-envoi (la **vraie** garantie est côté backend).

Pour une mutation (vente, réception, transfert), le composant génère **une** `Idempotency-Key`
(UUID) par tentative métier et la passe au service. Si l'envoi échoue et qu'on **retry**, on
renvoie **la même clé** → le backend rejoue la réponse au lieu de créer un doublon.

À côté, `isSubmitting = true` désactive le bouton pendant l'envoi.

**Distinction clé :**
- `isSubmitting` empêche le **double-clic** (même écran, même session).
- l'idempotency-key empêche le **double-enregistrement** (retry réseau, deux appareils,
  coupure-renvoi). Appliquée par le **backend**.

**Piège :** générer une **nouvelle** clé à chaque retry → le serveur croit à une **nouvelle**
action → doublon. Il faut **conserver et réutiliser** la même clé pendant le retry.

**Phrase à retenir :** _`isSubmitting` = confort anti double-clic ; même clé réutilisée = vraie
garantie anti-doublon._

> **Mini-questions Étape 7**
> 1. Pourquoi renvoyer la **même** clé lors d'un retry ?
> 2. `isSubmitting` suffit-il à empêcher une double-vente ? Pourquoi ?

---

# ÉTAPE 8 — État réactif avec les signals

**But :** gérer un état qui change et rafraîchir l'écran **automatiquement**.

> **Mot expliqué — signal :** une valeur réactive simple. Quand elle change, Angular met à jour
> **seulement** les parties d'écran qui en dépendent. Plus simple et plus rapide que l'ancienne
> détection de changement globale.

Exemple réel (`NotificationService`) — un store de toasts en signals :

```ts
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly _toasts = signal<Toast[]>([]);     // état privé modifiable
  readonly toasts = this._toasts.asReadonly();         // exposé en lecture seule

  success(message: string): void { this.show('success', message); }
  error(message: string): void   { this.show('error', message); }

  private show(type: ToastType, message: string): void {
    const id = this.nextId++;
    this._toasts.update(list => [...list, { id, type, message }]);  // mise à jour immuable
    setTimeout(() => this.dismiss(id), 5000);                       // auto-disparition
  }
  dismiss(id: number): void {
    this._toasts.update(toasts => toasts.filter(t => t.id !== id));
  }
}
```

Points à retenir :
- **`signal(initial)`** crée la valeur ; **`.update(fn)`** la change à partir de l'ancienne ;
  **`.asReadonly()`** expose une version non modifiable de l'extérieur (les composants lisent, seul
  le service écrit).
- On modifie **immutablement** (`[...list, item]`, `filter(...)`), comme côté backend pour les
  value objects.

**Phrase à retenir :** _le service détient le signal (écriture), les composants le lisent via
`asReadonly()`._

> **Mini-questions Étape 8**
> 1. C'est quoi un signal et pourquoi c'est utile pour l'affichage ?
> 2. Pourquoi exposer `asReadonly()` plutôt que le signal brut ?

---

# ÉTAPE 9 — Les tests

**But :** vérifier les composants et services sans dépendre du vrai backend.

- **Tests de composant** (`.spec.ts` avec `TestBed`) : monter le composant, simuler une saisie,
  vérifier l'affichage.
- **Services mockés** : remplacer le vrai `HttpClient`/service par un faux qui renvoie une réponse
  toute prête.

> **Mots expliqués :** *TestBed* = l'outil Angular qui assemble un composant pour le test ;
> *mock* = faux objet qui imite une dépendance pour tester en isolation.

**Phrase à retenir :** _on teste le composant en isolation, avec des services mockés, sans backend._

> **Mini-questions Étape 9**
> 1. C'est quoi un mock dans un test de composant ?
> 2. Pourquoi mocker le service plutôt qu'appeler le vrai backend ?

---

# ÉTAPE 10 — Build & lien avec le backend

**But :** produire l'app et la faire dialoguer avec l'API.

- `ng build` génère des fichiers statiques (HTML/JS/CSS).
- En dev, un **proxy** redirige les appels `/api/v1/...` vers le backend Spring (port 8080) pour
  éviter les soucis de **CORS**.

> **Mot expliqué — CORS :** une sécurité du navigateur qui bloque par défaut les appels vers un
> autre domaine/port. Le proxy (ou une config backend) autorise le front à parler à l'API. C'est
> pour ça que les services utilisent `/api/v1` (chemin relatif), pas `http://localhost:8080`.

> **Mini-questions Étape 10**
> 1. C'est quoi le CORS, et pourquoi un proxy en dev ?
> 2. Pourquoi les services appellent `/api/v1/...` et pas l'URL complète du backend ?

---

# ÉTAPE 11 — Une déroulante alimentée par l'API (les catégories)

**Le besoin.** À la réception d'un nouveau produit, la « Catégorie » était un **champ texte libre** : on envoyait le texte tapé dans `categoryId`, mais le backend attend un **UUID** de catégorie existante → **HTTP 400**. Solution : une **liste déroulante** qui affiche les **noms** et envoie l'**id** en coulisse.

## 11.1 Le service data-access + le modèle

Un modèle `Category` (interface plate) qui décrit le JSON du back :

```ts
export interface Category {
  readonly id: string;   // un UUID, mais côté TS c'est une chaîne
  readonly name: string;
}
```

Les noms de champs doivent **coller exactement** aux clés JSON, sinon la valeur est `undefined`. Puis un `CategoriesApiService` (`@Injectable({ providedIn: 'root' })`) avec `listCategories(): Observable<Category[]>` qui fait `http.get<Category[]>('/api/v1/categories')`.

Rappel **Observable** : `http.get(...)` ne renvoie **pas** la donnée, il renvoie un **flux**. Rien ne part tant que personne ne **`subscribe`**.

> **Phrase à retenir :** un service renvoie un `Observable` ; la requête part au `subscribe`, pas avant.

## 11.2 Charger la liste dans le composant

Dans la page de réception : on injecte le service, on garde une propriété `categories: Category[] = []`, et on charge **au démarrage** (constructor) :

```ts
this.categoriesApi.listCategories()
    .pipe(takeUntilDestroyed())
    .subscribe(categories => this.categories = categories);
```

L'affectation se fait **dans le callback** de `subscribe` (la donnée n'existe qu'à l'arrivée de la réponse). `takeUntilDestroyed()` **désabonne** automatiquement à la destruction du composant (évite les fuites mémoire).

## 11.3 Le `<select>` (HTML) branché sur le formulaire

Le `FormControl categoryId` existait déjà (avec `Validators.required`). On ne change que l'affichage : un `<select formControlName="categoryId">` avec le control-flow Angular 20 :

```html
<select formControlName="categoryId">
  <option value="" disabled>Choisir une famille</option>
  @for (category of categories; track category.id) {
    <option [value]="category.id">{{ category.name }}</option>
  }
</select>
```

Le point clé : `[value]="category.id"` → c'est l'**id** (UUID) qui part dans le formulaire ; `{{ category.name }}` → c'est le **nom** que voit l'utilisateur. **Nom affiché, id envoyé** : le bug 400 disparaît sans toucher à `onSubmit`.

> **Phrase à retenir :** un `<select formControlName>` stocke la **valeur de l'`<option>` choisie** ; on met l'**id** en `[value]` et le **nom** en texte.

## 11.4 La devise codée en dur (contexte métier)

Le client est au **Tchad** → franc CFA, code ISO **`XAF`**. On corrige la valeur envoyée (`currency: 'XAF'`) **et** le libellé affiché (`<span>XAF</span>`). On la code en dur volontairement : dans **ce** magasin la devise ne change jamais — inutile de la demander au magasinier (anti-sur-ingénierie).

> **Phrase à retenir :** une constante métier stable (la devise du magasin) se code en dur ; on ne demande à l'utilisateur que ce qui varie.

## 11.5 Piège de test : fournir les dépendances au TestBed

La CI a cassé sur `ProductEditPage should create` : `NG0201: No provider found for HttpClient`. En vrai, `HttpClient`/`Router`/`ActivatedRoute` sont fournis **globalement** au démarrage de l'appli ; mais un **TestBed** démarre un contexte **isolé** qui ne charge pas cette config → il faut fournir soi-même ce que le composant injecte :

```ts
providers: [
  provideHttpClient(),
  provideHttpClientTesting(),   // HTTP simulé, aucun vrai appel réseau
  provideRouter([]),            // fournit Router ET la ActivatedRoute racine
]
```

`NotificationService` est `providedIn: 'root'` → auto-fourni, rien à faire.

> **Phrase à retenir :** un test isolé ne « voit » pas la config globale ; on **fournit explicitement** au TestBed tout ce que le composant injecte.

## 11.6 La CI front (rappel livraison)

Un workflow GitHub Actions (`on: pull_request`) : `npm ci` + `npm run build` + `npm test -- --watch=false --browsers=ChromeHeadless`. Les tests Angular tournent dans un **vrai navigateur** (Karma lance Chrome) ; en CI, pas d'écran → **Chrome headless** (le runner l'a déjà). `--watch=false` = exécuter **une fois** puis se terminer (sinon le job ne finit jamais).

> **Phrase à retenir :** en CI, les tests front tournent dans un **Chrome headless**, en un seul passage (`--watch=false`).

---

## La carte finale (à mémoriser)

```
  UTILISATEUR (clique, saisit)
     │
     ▼
  Page / Composant ──(Reactive Form + Validators)── valide la saisie
     │  inject(...)
     ▼
  Service data-access ──HTTP (HttpClient, Idempotency-Key)──►  Backend /api/v1
     ▲                                                            │
     │  Observable .subscribe()                                   ▼
  succès → affiche  /  erreur → lit ProblemDetail.code → message clair (NotificationService, signals)
```

**Le récit en une phrase :** _l'utilisateur saisit dans un formulaire réactif d'une page ; la page
appelle un service data-access qui poste vers `/api/v1` avec une idempotency-key ; au retour, on
s'abonne à l'Observable et on affiche le résultat, ou on lit `ProblemDetail.code` pour un message
clair via le service de notifications (signals)._

## Les 8 réflexes d'entrée de projet (front)

1. **3 dossiers** : core / features / shared.
2. **Une feature = data-access + models + pages.**
3. **Modèles (types) d'abord** ; l'argent en string.
4. **Le composant ne parle pas au backend** : il passe par un service.
5. **Reactive Forms + Validators** pour les saisies importantes.
6. **`code` plutôt que `detail`** pour gérer les erreurs.
7. **`isSubmitting` + même idempotency-key au retry** sur les mutations.
8. **Signals** pour l'état réactif ; le service écrit, les composants lisent.

---

_Lié à `quiz-frontend-angular.md`. Côté backend : `parcours-backend-spring.md` et
`quiz-backend-spring.md` (dépôt backend). Relire une étape par jour, reformuler à voix haute._
