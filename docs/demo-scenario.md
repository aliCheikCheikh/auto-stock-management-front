# Démonstration Auto Stock Management

Parcours vérifié manuellement le 17 septembre 2026 sur Angular et l’API Java locaux, avec PostgreSQL 17 dans le conteneur dédié `auto-stock-demo-db` (port 15432). Aucun service public n’est déployé.

Toutes les identités et opérations sont fictives. Le numéro de téléphone sert uniquement à satisfaire le format du formulaire : ne pas l’appeler ni lui envoyer de message.

## Scénario reproductible sur une base initialisée vide

Suivre les instructions SQL et de démarrage du README backend, puis remplacer le mot de passe temporaire au premier accès.

1. Ouvrir **Réception de stock**, choisir l’import CSV et sélectionner `docs/demo/produits.csv` du backend. Prévisualiser puis confirmer : deux lignes valides, deux produits créés et 36 unités reçues.
2. Ouvrir **Nouvelle vente**, ajouter deux `DEMO-FILTRE-001` à 5 000 FCFA chacun. Choisir **Crédit**, créer un client fictif et saisir 4 000 FCFA payés immédiatement. Enregistrer la vente.
3. Ouvrir **Créances** : la vente totalise 10 000 FCFA, dont 6 000 FCFA restent dus.
4. Ouvrir son détail et encaisser un remboursement fictif de 2 000 FCFA. Vérifier les deux versements : 4 000 et 2 000 FCFA. Le solde est maintenant de 4 000 FCFA.
5. Ouvrir le catalogue et le détail du filtre : 18 unités restantes, dont 6 en surface et 12 en réserve. La plaquette conserve ses 16 unités.
6. Revenir au tableau de bord : une vente, deux articles, 10 000 FCFA de ventes et 4 000 FCFA de créances ouvertes.

Ce scénario a déjà été exécuté dans la base locale actuelle. Ne pas réimporter le CSV pour simplement consulter la démo : cela ajouterait du stock. De nouvelles ventes modifieraient également les chiffres ci-dessus.

## Présentation en deux minutes

- **20 secondes — besoin métier :** suivre les pièces, les ventes et les règlements différés d’un magasin.
- **30 secondes — catalogue :** montrer les quantités consolidées et la séparation surface/réserve.
- **40 secondes — créance :** montrer la vente d’origine, les deux versements et le solde restant.
- **30 secondes — tableau de bord :** retrouver les chiffres et les opérations, puis expliquer un choix technique concret, par exemple la transaction qui lie vente et sortie de stock.

Les captures `docs/screenshots/*-clair.webp` du README ont été prises le même jour sur un jeu de données fictif plus complet (34 références, trois clients). Elles couvrent la zone visible du navigateur ; certains tableaux se consultent par défilement horizontal à cette largeur. Cette vérification manuelle ne couvre pas tous les navigateurs, rôles, erreurs ou accès concurrents.
