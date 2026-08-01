# Créances : détail d'une vente, historique des règlements, forme de la vente

## Ce que ça règle pour le commerçant

Jusqu'ici, l'écran des créances affichait une liste de soldes et rien d'autre. Le patron voyait
qu'un client lui devait 100 000 F CFA, sans savoir **pourquoi** : ni quels produits, ni qui avait
vendu, ni ce qui avait déjà été versé. Un solde qu'on ne peut pas justifier devant son client ne
sert à rien.

Pire : dès qu'une créance était payée, elle disparaissait de l'écran. Plus aucune trace du
règlement, au moment précis où un client peut contester avoir payé.

Trois manques comblés :

1. **Ouvrir une créance** et voir la vente entière — produits, vendeur, date, versements.
2. **Consulter les créances soldées**, y compris longtemps après, comme preuve de règlement.
3. **Lire dans le journal du stock** si une vente est partie payée ou à crédit.

S'y ajoute une **fiche client** qui répond à la question posée avant chaque nouvelle vente à
crédit : « est-ce que je peux encore lui faire crédit ? »

Tous ces écrans sont réservés au propriétaire.

## Les écrans

### Liste des créances — `/debts`

Un filtre à trois positions : **En cours** (défaut), **Soldées**, **Toutes**. Chaque créance affiche
le client, son téléphone, la date de la vente, le total, le versé, le restant dû, et son ancienneté
formulée en toutes lettres. Chaque ligne est un lien : ouvrable dans un nouvel onglet.

### Détail d'une créance — `/creances/:saleId`

Le client et son téléphone, la date et l'heure, le vendeur. Puis, séparés : ce qui a été vendu (avec
la mention que les prix sont ceux du jour de la vente), où en est le règlement, et l'échéancier des
versements. Un bouton **Enregistrer un versement** n'apparaît que si la créance est ouverte.

Reste consultable après règlement complet : le restant dû cède alors la place à la date de solde.

### Fiche client — `/clients/:customerId/creances`

Deux sections, ce qu'il doit encore et ce qu'il a déjà réglé, construites sur les mêmes composants
que la liste globale.

### Journal des mouvements

Chaque vente porte un repère : **Payée**, ou **À crédit — reste X**. Sur une vente à crédit, il mène
au détail de la créance. Réceptions et transferts n'affichent rien.

## Décisions d'interface qui méritent un regard

**Le filtre vit dans l'URL** (`?status=SETTLED`). Un rafraîchissement ou un lien envoyé par message
retombe sur le même écran. Sans cela, le patron qui recharge sa page perd son filtre sans comprendre
pourquoi.

**Le restant dû n'est affiché que sur « En cours ».** Additionner des dettes éteintes produirait un
nombre qui ressemble à un encours mais n'en est pas un, et personne ne s'en méfierait.

**L'ancienneté change de mots selon l'état, parce que les champs du serveur changent de sens.**
`daysOutstanding` s'arrête au jour du règlement pour une créance éteinte : une dette réglée en huit
jours il y a six mois vaut 8, pas 180. Et `overdue` sur une créance soldée ne veut pas dire « en
retard aujourd'hui » mais « réglée au-delà du délai toléré ». D'où deux vocabulaires disjoints :
`Ouverte depuis 12 jours` / `En retard` d'un côté, `Réglée en 8 jours` / `Réglée hors délai` de
l'autre. C'est le point le plus facile à casser en modifiant cet écran.

**Aucun état n'est porté par la seule couleur.** Retard comme règlement se lisent en texte ; la
couleur ne fait que confirmer.

**Le repère « Payée / À crédit » est un composant unique**, partagé par le journal et les listes de
créances. Deux implémentations du même état auraient fini par diverger. Son état se déduit du seul
champ qui le porte (`saleAmountDue`, ou `amountDue` sur une créance) : aucun booléen local ne le
double, faute de quoi deux sources finiraient par se contredire.

**L'encaissement se fait depuis le détail, plus depuis la liste.** La liste redevient une liste ; le
versement se saisit là où l'on peut vérifier ce qu'on encaisse. Un clic de plus, une erreur de moins.

**L'acompte du jour de la vente n'est pas distingué** dans l'échéancier : c'est un versement comme
un autre, et la liste se lit comme une seule histoire.

**Les dates sont passées en français.** Le `DatePipe` rendait « 20 Jul 2026 » au milieu d'une
interface francophone : la locale `fr-FR` est désormais enregistrée pour toute l'application.

## La rupture de contrat sur `/debts`

`GET /api/v1/debts` et `GET /api/v1/customers/{customerId}/debts` ne renvoient plus un tableau nu
mais une page (`{ content, page }`). Absorbée ainsi :

- le service d'API renvoie `Page<DebtResponse>` et construit les paramètres `status`, `customerId`,
  `page`, `size` en un seul endroit, réutilisé par les deux endpoints ;
- **aucun paramètre de tri n'est envoyé** : l'ordre appartient au serveur et dépend du statut — les
  créances en cours de la plus ancienne à la plus récente (celles qu'on relance), les soldées du
  règlement le plus récent au plus ancien. Le tri local « par montant dû » de l'ancienne version a
  été supprimé : il aurait contredit cet ordre ;
- la pagination locale (découpage côté client) cède la place à la pagination serveur ;
- la recherche par nom, qui filtrait la page chargée, disparaît avec elle — filtrer 20 lignes sur
  plusieurs pages donnait un résultat faux. Le filtre par client passe désormais par la fiche client.

Un store à signaux par écran porte le filtre, la page et l'état de chargement. Les requêtes passent
par un `switchMap` : changer de filtre rapidement **annule** la précédente au lieu d'empiler deux
réponses dont la plus lente gagnerait.

## Montants

`amount` est une chaîne, jamais un nombre : le franc CFA se manipule à l'unité et la précision
JavaScript ne tient pas sur les gros montants. Rien n'est recalculé côté front — `amountDue`,
`settled` et `daysOutstanding` viennent du serveur et sont affichés tels quels. Les seules
opérations sur des montants passent par `shared/utils/money-math` (arithmétique en `BigInt` sur
chaînes), et le formatage par un `MoneyPipe` unique qui rend `"50000.00"` en `50 000 FCFA`.

## Accès refusé

Cacher l'entrée de menu ne suffisait pas : un vendeur qui colle une URL de créances, ou dont le rôle
a changé depuis sa connexion, tombait sur une page en erreur. Un intercepteur ramène désormais tout
`403` au catalogue, en disant pourquoi.

## Couverture de tests

`ng build` et `ng test --watch=false` passent — **104 tests**.

Nouveaux tests, alignés sur les critères d'acceptation :

| Critère | Où |
|---|---|
| Filtre par défaut sur les créances en cours, sans paramètre de tri | `debts-page.spec.ts` |
| Le filtre survit à un rafraîchissement (lu depuis l'URL) | `debts-page.spec.ts` |
| Restant dû masqué hors « En cours » | `debts-page.spec.ts` |
| `Réglée en 8 jours` / `Réglée hors délai`, jamais `En retard` ni `180` | `debt-age.spec.ts`, `debts-page.spec.ts` |
| États vides distincts selon le filtre | `debts-page.spec.ts` |
| Aucun montant recalculé côté front | `debts-page.spec.ts` |
| Requête en vol annulée au changement de filtre | `debts-page.spec.ts` |
| Détail : produits, montants, échéancier, vendeur | `debt-detail-page.spec.ts` |
| Détail consultable après règlement complet | `debt-detail-page.spec.ts` |
| Vente au comptant → message clair, pas d'erreur brute | `debt-detail-page.spec.ts` |
| Auteur supprimé → repli neutre, jamais « null » | `debt-detail-page.spec.ts` |
| Repère `Payée` / `À crédit` / rien sur un transfert | `movement-group.spec.ts` |
| Fiche client : deux statuts sur le bon périmètre | `customer-debts-page.spec.ts` |
| `403` → retour sur un écran autorisé | `forbidden.interceptor.spec.ts` |

## Points laissés ouverts

- **Total des créances** : le serveur n'expose pas d'agrégat, seulement des pages. Le total affiché
  porte donc sur la page courante et le dit explicitement. Un `totalAmountDue` dans la réponse
  paginée permettrait d'afficher l'encours réel.
- **Incohérence d'URL** : la liste est sur `/debts`, le détail sur `/creances/:saleId` et la fiche
  client sur `/clients/:customerId/creances`. Deux langues cohabitent ; à unifier lors d'un passage
  dédié, puisque ce sont des URL publiques.
- **Le vendeur n'a toujours aucun accès** aux créances : il encaisse au comptoir mais ne peut ni
  consulter une dette ni ouvrir un détail. Ouvrir `GET /customers/{id}/debts` au rôle `SELLER`
  suffirait à débloquer la fiche client de son côté.
- **Aucun lien vers la fiche client** depuis la liste des créances pour l'instant : on y accède par
  URL. Une colonne cliquable vers le client est le prolongement naturel.
- Vérifié par tests unitaires uniquement — le rendu visuel reste à confirmer contre le backend réel.
