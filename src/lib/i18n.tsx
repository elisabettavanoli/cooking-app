/**
 * Tiny i18n layer — no dependency, just a React context + string tables.
 *
 * `useI18n()` gives `{ lang, setLang, t }`. `t("some.key", { n: 3 })` looks the
 * key up in the active language, falls back to English, then to the key itself.
 * A value can be a plural pair `{ one, other }` picked by `params.n`.
 *
 * The chosen language is persisted in localStorage under `LANG_STORAGE_KEY`;
 * `src/lib/category/locales.ts` reads the same key so product→category
 * resolution follows the UI language.
 *
 * English + Italian are complete. de/fr/es cover the shell (navigation,
 * screen headers, common buttons, auth, settings) and fall back to English
 * for the rest — fill in the tables below to finish a language.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { LANG_STORAGE_KEY, isSupportedLang, type LangCode } from "./category/locales";

export type { LangCode };

type PluralForms = { one: string; other: string };
type Entry = string | PluralForms;
type Dict = Record<string, Entry>;

export const LANGUAGE_LABELS: Record<LangCode, string> = {
  en: "English",
  it: "Italiano",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
};

/**
 * Languages offered in the picker. Only `en`/`it` are content-complete, so the
 * others are hidden for now — the `de`/`fr`/`es` string tables and the
 * `src/lib/category` lexicons stay in place, and a stored `de`/`fr`/`es` choice
 * still works; add them back here when their translations are finished.
 */
export const LANGUAGE_ORDER: LangCode[] = ["en", "it"];

// ─────────────────────────────────────────────────────────────
// English — the source of truth and the fallback for every key.
// ─────────────────────────────────────────────────────────────
const en: Dict = {
  "common.loadingKitchen": "Loading your kitchen…",
  "common.cancel": "Cancel",
  "common.save": "Save",
  "common.delete": "Delete",
  "common.clear": "Clear",
  "common.undo": "Undo",
  "common.remove": "Remove",
  "common.done": "Done",
  "common.showPassword": "Show password",
  "common.hidePassword": "Hide password",
  "common.pageInfo": "About this screen",

  "nav.kitchen": "Kitchen",
  "nav.list": "List",
  "nav.cook": "Cook",
  "nav.nearby": "Nearby",
  "nav.profile": "Profile",

  "category.fruit": "Fruit",
  "category.vegetables": "Vegetables",
  "category.dairy": "Dairy",
  "category.meat-fish": "Meat & Fish",
  "category.pantry": "Pantry",
  "category.sauces-condiments": "Sauces & Condiments",
  "category.spices-herbs": "Spices & Herbs",
  "category.baking": "Baking",
  "category.drinks": "Drinks",
  "category.breakfast-snacks": "Breakfast & Treats",
  "category.snacks": "Savoury Snacks",
  "category.other": "Other",

  "kitchen.title": "My Kitchen",
  "kitchen.itemsTracked": { one: "{n} item tracked", other: "{n} items tracked" },
  "kitchen.toUseSoon": "{n} to use soon",
  "kitchen.searchPlaceholder": "Search inventory…",
  "kitchen.addIngredient": "Add ingredient",
  "kitchen.enterSelect": "Select items to cook with",
  "kitchen.exitSelect": "Exit selection mode",
  "kitchen.hintSelect": "Tap items to cook with",
  "kitchen.infoText": "Everything you have at home. Tap an item to use some of it; long-press it to edit the details. Tap the utensils icon to pick specific ingredients and jump to Cook.",
  "kitchen.emptyTitle": "Your kitchen is empty",
  "kitchen.emptyText": "Tap + to add your first ingredient.",
  "kitchen.noMatchTitle": "Nothing matches that",
  "kitchen.noMatchText": "Try another name.",
  "kitchen.cookWith": { one: "Cook with {n} ingredient", other: "Cook with {n} ingredients" },

  "cook.titleDefault": "What can I cook?",
  "cook.titleSelected": "Cook with selected",
  "cook.subtitleItems": { one: "{n} item in your kitchen", other: "{n} items in your kitchen" },
  "cook.subtitleSelected": { one: "{n} ingredient selected", other: "{n} ingredients selected" },
  "cook.usingSelected": "Using selected ingredients",
  "cook.aiRecipe": "AI recipe",
  "cook.suggested": "Suggested recipes",
  "cook.noMatchTitle": "No catalog matches yet",
  "cook.noMatchText": "Add more ingredients or try an AI recipe.",
  "cook.minIngredientsTitle": "Add a few more ingredients",
  "cook.minIngredientsText": "You need at least {min} ingredients for recipe suggestions.",
  "cook.ready": "Ready",
  "cook.missing": "{n} missing",
  "cook.minutes": "{n} min",
  "cook.have": "{n} have",
  "cook.servings": "{n} servings",
  "cook.infoText": "Recipes you can make with what's in your kitchen, sorted by what's missing. Select specific ingredients first to cook with just those, or ask the AI for an idea.",

  "list.title": "Shopping List",
  "list.toBuy": { one: "{n} item to buy", other: "{n} items to buy" },
  "list.searchPlaceholder": "Search list…",
  "list.emptyTitle": "Your list is empty",
  "list.emptyText": "Add items manually or from a recipe.",
  "list.purchased": "Purchased",
  "list.inYourKitchen": "in your kitchen",
  "list.addPlaceholder": "Add an item…",
  "list.add": "Add",
  "list.infoText": "Things to buy. Add an item, then check it off when you get it — it moves straight into your kitchen.",

  "nearby.title": "Nearby",
  "nearby.subtitle": "Find ingredients near you",
  "nearby.signInPrompt": "Sign in to discover communities and nearby kitchens.",
  "nearby.searchLabel": "Search your communities",
  "nearby.searchPlaceholder": "Search an ingredient…",
  "nearby.searchEmpty": "Type an ingredient to see who has it.",
  "nearby.searchNoResults": "No one in your communities has that right now.",
  "nearby.searching": "Searching…",
  "nearby.hitMeta": "{owner} · {community}",
  "nearby.yourCommunities": "Your communities",
  "nearby.noCommunities": "You haven't joined a community yet.",
  "nearby.memberCount": { one: "{n} member", other: "{n} members" },
  "nearby.leave": "Leave",
  "nearby.inviteCode": "Invite code",
  "nearby.codeCopied": "Code copied",
  "nearby.addCommunity": "Add a community",
  "nearby.createTitle": "Create a community",
  "nearby.createSubtitle": "Pick a name — you'll get an invite code to share.",
  "nearby.createNameLabel": "Community name",
  "nearby.createNamePlaceholder": "e.g. Oak Street neighbours",
  "nearby.create": "Create",
  "nearby.createdCodeIntro": "Share this invite code:",
  "nearby.joinTitle": "Join a community",
  "nearby.joinHint": "Enter an invite code from friends, roommates, or neighbours.",
  "nearby.join": "Join",
  "nearby.joinError": "Invalid invite code.",
  "nearby.mapTitle": "Nearby kitchens",
  "nearby.mapLocateHint": "Turn on location to see kitchens near you.",
  "nearby.mapUseLocation": "Use my location",
  "nearby.mapNoKitchens": "No public kitchens near you yet.",
  "nearby.itemsCount": { one: "{n} item", other: "{n} items" },
  "nearby.infoText": "Search what your neighbours have available, and see public kitchens on the map. Join or create a community to start sharing.",

  "profile.title": "Profile",
  "profile.account": "Account",
  "profile.displayName": "Display name",
  "profile.displayNameHint": "How you appear to your communities.",
  "profile.language": "Language",
  "profile.languageHint": "Used across the app and for sorting ingredients into categories.",
  "profile.sharingSection": "Kitchen sharing",
  "profile.shareCommunitiesLabel": "Share with my communities",
  "profile.shareCommunitiesHint": "Co-members see the items you have available.",
  "profile.shareMapLabel": "Share on the public map",
  "profile.shareMapHint": "Any signed-in user can see your kitchen near your approximate location.",
  "profile.requestsLabel": "Allow requests",
  "profile.requestsHint": "Others can ask to borrow one of your items.",
  "profile.locationDenied": "Couldn't get your location — map sharing stays off.",
  "profile.logout": "Log out",

  "auth.signinHint": "Sign in with your email and password.",
  "auth.signupHint": "Create an account to share your pantry.",
  "auth.name": "Name",
  "auth.namePlaceholder": "What people call you",
  "auth.email": "Email",
  "auth.emailPlaceholder": "you@example.com",
  "auth.password": "Password",
  "auth.passwordPlaceholder": "at least 6 characters",
  "auth.wait": "Please wait…",
  "auth.signin": "Sign in",
  "auth.signup": "Create account",
  "auth.toSignup": "No account yet? Sign up",
  "auth.toSignin": "Already have an account? Sign in",
  "auth.notConfigured": "Backend not configured.",

  "sheet.addToKitchen": "Add to kitchen",
  "sheet.addSubtitle": "Enter an ingredient, the category is filled in for you.",
  "sheet.ingredientName": "Ingredient name",
  "sheet.ingredientPlaceholder": "e.g. Tomatoes",
  "sheet.quantity": "Quantity",
  "sheet.quantityOptional": "Optional",
  "sheet.unit": "Unit",
  "sheet.category": "Category",

  "unit.piece": { one: "piece", other: "pieces" },
  "unit.g": "g",
  "unit.kg": "kg",
  "unit.ml": "ml",
  "unit.l": "l",
  "unit.cup": { one: "cup", other: "cups" },
  "unit.tbsp": { one: "tbsp", other: "tbsp" },
  "unit.tsp": { one: "tsp", other: "tsp" },
  "unit.pack": { one: "pack", other: "packs" },
  "unit.bunch": { one: "bunch", other: "bunches" },
  "unit.can": { one: "can", other: "cans" },
  "unit.bottle": { one: "bottle", other: "bottles" },
  "sheet.notesOptional": "Notes (optional)",
  "sheet.notes": "Notes",
  "sheet.notesPlaceholder": "Brand, storage tip, etc.",
  "sheet.addToKitchenBtn": "Add to kitchen",
  "sheet.editTitle": "Edit ingredient",
  "sheet.editSubtitle": "Adjust name, quantity, or category.",
  "sheet.name": "Name",
  "sheet.useIntro": "Lower the amount as you use it — reaching zero clears it from your kitchen.",
  "sheet.decrease": "Decrease quantity",
  "sheet.increase": "Increase quantity",
  "sheet.addToShoppingList": "Add to shopping list",
  "sheet.aiSubtitleSelected": "Based on selected ingredients.",
  "sheet.aiSubtitleAvailable": "Based on available ingredients.",
  "sheet.aiMood": "What are you in the mood for? (optional)",
  "sheet.aiMoodPlaceholder": "e.g. something spicy, quick, breakfast",
  "sheet.aiUsing": { one: "Using {n} ingredient from your kitchen.", other: "Using {n} ingredients from your kitchen." },
  "sheet.aiClearSelection": "Clear selection",
  "sheet.aiOffline": "Offline mode: picks the closest catalog recipe. Real AI generation is wired up later.",
  "sheet.aiGenerate": "Generate recipe",
  "sheet.readyToCook": "Ready to cook",
  "sheet.youHave": "You have ({n})",
  "sheet.missingCount": "Missing ({n})",
  "sheet.nothingYet": "Nothing from this recipe yet.",
  "sheet.haveEverything": "You have everything you need.",
  "sheet.instructions": "Instructions",
  "sheet.addedToList": "Added to list",

  "update.available": "A new version is available.",
  "update.offlineReady": "Ready to work offline.",
  "update.reload": "Reload",
  "update.dismiss": "Dismiss",
};

// ─────────────────────────────────────────────────────────────
// Italian — complete.
// ─────────────────────────────────────────────────────────────
const it: Dict = {
  "common.loadingKitchen": "Carico la tua cucina…",
  "common.cancel": "Annulla",
  "common.save": "Salva",
  "common.delete": "Elimina",
  "common.clear": "Pulisci",
  "common.undo": "Annulla",
  "common.remove": "Rimuovi",
  "common.done": "Fatto",
  "common.showPassword": "Mostra password",
  "common.hidePassword": "Nascondi password",
  "common.pageInfo": "Informazioni su questa schermata",

  "nav.kitchen": "Cucina",
  "nav.list": "Spesa",
  "nav.cook": "Ricette",
  "nav.nearby": "Vicini",
  "nav.profile": "Profilo",

  "category.fruit": "Frutta",
  "category.vegetables": "Verdura",
  "category.dairy": "Latticini",
  "category.meat-fish": "Carne e pesce",
  "category.pantry": "Dispensa",
  "category.sauces-condiments": "Salse e condimenti",
  "category.spices-herbs": "Spezie ed erbe",
  "category.baking": "Prodotti da forno",
  "category.drinks": "Bevande",
  "category.breakfast-snacks": "Colazione e dolci",
  "category.snacks": "Snack salati",
  "category.other": "Altro",

  "kitchen.title": "La mia cucina",
  "kitchen.itemsTracked": { one: "{n} prodotto in dispensa", other: "{n} prodotti in dispensa" },
  "kitchen.toUseSoon": "{n} da usare presto",
  "kitchen.searchPlaceholder": "Cerca nella dispensa…",
  "kitchen.addIngredient": "Aggiungi ingrediente",
  "kitchen.enterSelect": "Seleziona gli ingredienti da usare",
  "kitchen.exitSelect": "Esci dalla selezione",
  "kitchen.hintSelect": "Tocca gli ingredienti da usare",
  "kitchen.infoText": "Tutto quello che hai in casa. Tocca un prodotto per usarne un po'; tieni premuto per modificarne i dettagli. Tocca l'icona delle posate per scegliere ingredienti specifici e passare a Cucina.",
  "kitchen.emptyTitle": "La tua cucina è vuota",
  "kitchen.emptyText": "Tocca + per aggiungere il primo ingrediente.",
  "kitchen.noMatchTitle": "Nessun risultato",
  "kitchen.noMatchText": "Prova con un altro nome.",
  "kitchen.cookWith": { one: "Cucina con {n} ingrediente", other: "Cucina con {n} ingredienti" },

  "cook.titleDefault": "Cosa posso cucinare?",
  "cook.titleSelected": "Cucina con la selezione",
  "cook.subtitleItems": { one: "{n} prodotto nella tua cucina", other: "{n} prodotti nella tua cucina" },
  "cook.subtitleSelected": { one: "{n} ingrediente selezionato", other: "{n} ingredienti selezionati" },
  "cook.usingSelected": "Uso gli ingredienti selezionati",
  "cook.aiRecipe": "Ricetta AI",
  "cook.suggested": "Ricette suggerite",
  "cook.noMatchTitle": "Ancora nessuna ricetta compatibile",
  "cook.noMatchText": "Aggiungi altri ingredienti o prova una ricetta AI.",
  "cook.minIngredientsTitle": "Aggiungi qualche ingrediente",
  "cook.minIngredientsText": "Servono almeno {min} ingredienti per i suggerimenti di ricette.",
  "cook.ready": "Pronta",
  "cook.missing": "{n} mancanti",
  "cook.minutes": "{n} min",
  "cook.have": "{n} disponibili",
  "cook.servings": "{n} porzioni",
  "cook.infoText": "Ricette che puoi fare con quello che hai in cucina, ordinate per quanto ti manca. Seleziona ingredienti specifici per cucinare solo con quelli, oppure chiedi un'idea all'AI.",

  "list.title": "Lista della spesa",
  "list.toBuy": { one: "{n} prodotto da comprare", other: "{n} prodotti da comprare" },
  "list.searchPlaceholder": "Cerca nella lista…",
  "list.emptyTitle": "La tua lista è vuota",
  "list.emptyText": "Aggiungi prodotti a mano o da una ricetta.",
  "list.purchased": "Comprati",
  "list.inYourKitchen": "nella tua cucina",
  "list.addPlaceholder": "Aggiungi un prodotto…",
  "list.add": "Aggiungi",
  "list.infoText": "Le cose da comprare. Aggiungi un prodotto, poi spuntalo quando lo compri: passa subito in cucina.",

  "nearby.title": "Vicino",
  "nearby.subtitle": "Trova ingredienti vicino a te",
  "nearby.signInPrompt": "Accedi per scoprire le community e le cucine vicine.",
  "nearby.searchLabel": "Cerca nelle tue community",
  "nearby.searchPlaceholder": "Cerca un ingrediente…",
  "nearby.searchEmpty": "Scrivi un ingrediente per vedere chi ce l'ha.",
  "nearby.searchNoResults": "Al momento nessuno nelle tue community ce l'ha.",
  "nearby.searching": "Ricerca…",
  "nearby.hitMeta": "{owner} · {community}",
  "nearby.yourCommunities": "Le tue community",
  "nearby.noCommunities": "Non fai ancora parte di nessuna community.",
  "nearby.memberCount": { one: "{n} membro", other: "{n} membri" },
  "nearby.leave": "Esci",
  "nearby.inviteCode": "Codice invito",
  "nearby.codeCopied": "Codice copiato",
  "nearby.addCommunity": "Aggiungi una community",
  "nearby.createTitle": "Crea una community",
  "nearby.createSubtitle": "Scegli un nome — otterrai un codice invito da condividere.",
  "nearby.createNameLabel": "Nome della community",
  "nearby.createNamePlaceholder": "es. Vicini di via Roma",
  "nearby.create": "Crea",
  "nearby.createdCodeIntro": "Condividi questo codice invito:",
  "nearby.joinTitle": "Entra in una community",
  "nearby.joinHint": "Inserisci un codice invito di amici, coinquilini o vicini.",
  "nearby.join": "Entra",
  "nearby.joinError": "Codice invito non valido.",
  "nearby.mapTitle": "Cucine vicine",
  "nearby.mapLocateHint": "Attiva la posizione per vedere le cucine vicino a te.",
  "nearby.mapUseLocation": "Usa la mia posizione",
  "nearby.mapNoKitchens": "Ancora nessuna cucina pubblica vicino a te.",
  "nearby.itemsCount": { one: "{n} prodotto", other: "{n} prodotti" },
  "nearby.infoText": "Cerca cosa hanno disponibile i tuoi vicini e guarda le cucine pubbliche sulla mappa. Entra o crea una community per iniziare a condividere.",

  "profile.title": "Profilo",
  "profile.account": "Account",
  "profile.displayName": "Nome visualizzato",
  "profile.displayNameHint": "Come appari alle tue community.",
  "profile.language": "Lingua",
  "profile.languageHint": "Usata in tutta l'app e per classificare gli ingredienti in categorie.",
  "profile.sharingSection": "Condivisione della cucina",
  "profile.shareCommunitiesLabel": "Condividi con le mie community",
  "profile.shareCommunitiesHint": "Chi è nelle tue community vede i prodotti che hai disponibili.",
  "profile.shareMapLabel": "Mostra sulla mappa pubblica",
  "profile.shareMapHint": "Chiunque abbia un account può vedere la tua cucina vicino alla tua posizione approssimativa.",
  "profile.requestsLabel": "Consenti richieste",
  "profile.requestsHint": "Gli altri possono chiederti in prestito un tuo prodotto.",
  "profile.locationDenied": "Impossibile ottenere la posizione — la mappa resta disattivata.",
  "profile.logout": "Esci",

  "auth.signinHint": "Accedi con email e password.",
  "auth.signupHint": "Crea un account per condividere la dispensa.",
  "auth.name": "Nome",
  "auth.namePlaceholder": "Come ti chiamano",
  "auth.email": "Email",
  "auth.emailPlaceholder": "tu@esempio.it",
  "auth.password": "Password",
  "auth.passwordPlaceholder": "almeno 6 caratteri",
  "auth.wait": "Attendi…",
  "auth.signin": "Entra",
  "auth.signup": "Crea account",
  "auth.toSignup": "Non hai un account? Registrati",
  "auth.toSignin": "Hai già un account? Accedi",
  "auth.notConfigured": "Backend non configurato.",

  "sheet.addToKitchen": "Aggiungi in cucina",
  "sheet.addSubtitle": "Inserisci un ingrediente, la categoria viene compilata per te.",
  "sheet.ingredientName": "Nome dell'ingrediente",
  "sheet.ingredientPlaceholder": "es. Pomodori",
  "sheet.quantity": "Quantità",
  "sheet.quantityOptional": "Facoltativa",
  "sheet.unit": "Unità",
  "sheet.category": "Categoria",

  "unit.piece": { one: "pezzo", other: "pezzi" },
  "unit.g": "g",
  "unit.kg": "kg",
  "unit.ml": "ml",
  "unit.l": "l",
  "unit.cup": { one: "tazza", other: "tazze" },
  "unit.tbsp": { one: "cucchiaio", other: "cucchiai" },
  "unit.tsp": { one: "cucchiaino", other: "cucchiaini" },
  "unit.pack": { one: "confezione", other: "confezioni" },
  "unit.bunch": { one: "mazzo", other: "mazzi" },
  "unit.can": { one: "lattina", other: "lattine" },
  "unit.bottle": { one: "bottiglia", other: "bottiglie" },
  "sheet.notesOptional": "Note (facoltative)",
  "sheet.notes": "Note",
  "sheet.notesPlaceholder": "Marca, consiglio di conservazione, ecc.",
  "sheet.addToKitchenBtn": "Aggiungi in cucina",
  "sheet.editTitle": "Modifica ingrediente",
  "sheet.editSubtitle": "Cambia nome, quantità o categoria.",
  "sheet.name": "Nome",
  "sheet.useIntro": "Riduci la quantità man mano che lo usi — a zero sparisce dalla cucina.",
  "sheet.decrease": "Riduci la quantità",
  "sheet.increase": "Aumenta la quantità",
  "sheet.addToShoppingList": "Aggiungi alla lista della spesa",
  "sheet.aiSubtitleSelected": "In base agli ingredienti selezionati.",
  "sheet.aiSubtitleAvailable": "In base agli ingredienti disponibili.",
  "sheet.aiMood": "Cosa ti va di mangiare? (facoltativo)",
  "sheet.aiMoodPlaceholder": "es. qualcosa di piccante, veloce, colazione",
  "sheet.aiUsing": { one: "Uso {n} ingrediente della tua cucina.", other: "Uso {n} ingredienti della tua cucina." },
  "sheet.aiClearSelection": "Cancella selezione",
  "sheet.aiOffline": "Modalità offline: sceglie la ricetta più simile dal catalogo. La vera generazione AI arriverà più avanti.",
  "sheet.aiGenerate": "Genera ricetta",
  "sheet.readyToCook": "Pronta da cucinare",
  "sheet.youHave": "Hai ({n})",
  "sheet.missingCount": "Mancano ({n})",
  "sheet.nothingYet": "Ancora niente da questa ricetta.",
  "sheet.haveEverything": "Hai tutto quello che serve.",
  "sheet.instructions": "Preparazione",
  "sheet.addedToList": "Aggiunto alla lista",

  "update.available": "È disponibile una nuova versione.",
  "update.offlineReady": "Pronta per l'uso offline.",
  "update.reload": "Ricarica",
  "update.dismiss": "Chiudi",
};

// ─────────────────────────────────────────────────────────────
// German / French / Spanish — shell only, fall back to English.
// ─────────────────────────────────────────────────────────────
const de: Dict = {
  "common.loadingKitchen": "Küche wird geladen…",
  "common.cancel": "Abbrechen",
  "common.save": "Speichern",
  "common.delete": "Löschen",
  "common.clear": "Leeren",
  "common.showPassword": "Passwort anzeigen",
  "common.hidePassword": "Passwort verbergen",
  "nav.kitchen": "Küche",
  "nav.list": "Liste",
  "nav.cook": "Kochen",
  "nav.nearby": "In der Nähe",
  "nav.profile": "Profil",
  "kitchen.title": "Meine Küche",
  "kitchen.itemsTracked": { one: "{n} Artikel erfasst", other: "{n} Artikel erfasst" },
  "kitchen.searchPlaceholder": "Vorrat durchsuchen…",
  "kitchen.emptyTitle": "Deine Küche ist leer",
  "kitchen.emptyText": "Tippe auf +, um deine erste Zutat hinzuzufügen.",
  "cook.titleDefault": "Was kann ich kochen?",
  "cook.subtitleItems": { one: "{n} Artikel in deiner Küche", other: "{n} Artikel in deiner Küche" },
  "cook.suggested": "Vorgeschlagene Rezepte",
  "cook.minIngredientsTitle": "Füge noch ein paar Zutaten hinzu",
  "cook.minIngredientsText": "Du brauchst mindestens {min} Zutaten für Rezeptvorschläge.",
  "list.title": "Einkaufsliste",
  "list.emptyTitle": "Deine Liste ist leer",
  "list.addPlaceholder": "Artikel hinzufügen…",
  "nearby.title": "In der Nähe",
  "nearby.subtitle": "Finde Zutaten in deiner Nähe",
  "profile.title": "Profil",
  "profile.language": "Sprache",
  "profile.languageHint": "Wird in der ganzen App verwendet und zum Einsortieren von Zutaten.",
  "auth.signinHint": "Mit E-Mail und Passwort anmelden.",
  "auth.signupHint": "Erstelle ein Konto, um deinen Vorrat zu teilen.",
  "auth.signin": "Anmelden",
  "auth.signup": "Konto erstellen",
  "auth.toSignup": "Noch kein Konto? Registrieren",
  "auth.toSignin": "Schon ein Konto? Anmelden",
};

const fr: Dict = {
  "common.loadingKitchen": "Chargement de votre cuisine…",
  "common.cancel": "Annuler",
  "common.save": "Enregistrer",
  "common.delete": "Supprimer",
  "common.clear": "Effacer",
  "common.showPassword": "Afficher le mot de passe",
  "common.hidePassword": "Masquer le mot de passe",
  "nav.kitchen": "Cuisine",
  "nav.list": "Liste",
  "nav.cook": "Cuisiner",
  "nav.nearby": "À proximité",
  "nav.profile": "Profil",
  "kitchen.title": "Ma cuisine",
  "kitchen.itemsTracked": { one: "{n} article suivi", other: "{n} articles suivis" },
  "kitchen.searchPlaceholder": "Rechercher dans le garde-manger…",
  "kitchen.emptyTitle": "Votre cuisine est vide",
  "kitchen.emptyText": "Touchez + pour ajouter votre premier ingrédient.",
  "cook.titleDefault": "Que puis-je cuisiner ?",
  "cook.subtitleItems": { one: "{n} article dans votre cuisine", other: "{n} articles dans votre cuisine" },
  "cook.suggested": "Recettes suggérées",
  "cook.minIngredientsTitle": "Ajoutez quelques ingrédients",
  "cook.minIngredientsText": "Il faut au moins {min} ingrédients pour les suggestions de recettes.",
  "list.title": "Liste de courses",
  "list.emptyTitle": "Votre liste est vide",
  "list.addPlaceholder": "Ajouter un article…",
  "nearby.title": "À proximité",
  "nearby.subtitle": "Trouvez des ingrédients près de chez vous",
  "profile.title": "Profil",
  "profile.language": "Langue",
  "profile.languageHint": "Utilisée dans toute l'app et pour classer les ingrédients.",
  "auth.signinHint": "Connectez-vous avec votre e-mail et votre mot de passe.",
  "auth.signupHint": "Créez un compte pour partager votre garde-manger.",
  "auth.signin": "Se connecter",
  "auth.signup": "Créer un compte",
  "auth.toSignup": "Pas encore de compte ? S'inscrire",
  "auth.toSignin": "Vous avez déjà un compte ? Se connecter",
};

const es: Dict = {
  "common.loadingKitchen": "Cargando tu cocina…",
  "common.cancel": "Cancelar",
  "common.save": "Guardar",
  "common.delete": "Eliminar",
  "common.clear": "Limpiar",
  "common.showPassword": "Mostrar contraseña",
  "common.hidePassword": "Ocultar contraseña",
  "nav.kitchen": "Cocina",
  "nav.list": "Lista",
  "nav.cook": "Cocinar",
  "nav.nearby": "Cerca",
  "nav.profile": "Perfil",
  "kitchen.title": "Mi cocina",
  "kitchen.itemsTracked": { one: "{n} artículo registrado", other: "{n} artículos registrados" },
  "kitchen.searchPlaceholder": "Buscar en la despensa…",
  "kitchen.emptyTitle": "Tu cocina está vacía",
  "kitchen.emptyText": "Toca + para añadir tu primer ingrediente.",
  "cook.titleDefault": "¿Qué puedo cocinar?",
  "cook.subtitleItems": { one: "{n} artículo en tu cocina", other: "{n} artículos en tu cocina" },
  "cook.suggested": "Recetas sugeridas",
  "cook.minIngredientsTitle": "Añade algunos ingredientes más",
  "cook.minIngredientsText": "Necesitas al menos {min} ingredientes para las sugerencias de recetas.",
  "list.title": "Lista de la compra",
  "list.emptyTitle": "Tu lista está vacía",
  "list.addPlaceholder": "Añadir un artículo…",
  "nearby.title": "Cerca",
  "nearby.subtitle": "Encuentra ingredientes cerca de ti",
  "profile.title": "Perfil",
  "profile.language": "Idioma",
  "profile.languageHint": "Se usa en toda la app y para clasificar los ingredientes.",
  "auth.signinHint": "Inicia sesión con tu correo y contraseña.",
  "auth.signupHint": "Crea una cuenta para compartir tu despensa.",
  "auth.signin": "Entrar",
  "auth.signup": "Crear cuenta",
  "auth.toSignup": "¿Aún no tienes cuenta? Regístrate",
  "auth.toSignin": "¿Ya tienes cuenta? Inicia sesión",
};

const DICTS: Record<LangCode, Dict> = { en, it, de, fr, es };

function readStoredLang(): LangCode | null {
  try {
    const v = localStorage.getItem(LANG_STORAGE_KEY);
    return v && isSupportedLang(v) ? v : null;
  } catch {
    return null;
  }
}

function detectInitialLang(): LangCode {
  const stored = readStoredLang();
  if (stored) return stored;
  const nav = typeof navigator !== "undefined" ? navigator.language : "";
  const base = (nav || "").slice(0, 2).toLowerCase();
  return isSupportedLang(base) ? base : "en";
}

export type TranslateParams = Record<string, string | number>;
export type Translate = (key: string, params?: TranslateParams) => string;

function interpolate(template: string, params?: TranslateParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, k: string) =>
    k in params ? String(params[k]) : `{${k}}`,
  );
}

function translate(lang: LangCode, key: string, params?: TranslateParams): string {
  const entry = DICTS[lang]?.[key] ?? en[key];
  if (entry === undefined) return key;
  if (typeof entry === "string") return interpolate(entry, params);
  const n = typeof params?.n === "number" ? params.n : 0;
  return interpolate(Math.abs(n) === 1 ? entry.one : entry.other, params);
}

interface I18nValue {
  lang: LangCode;
  setLang: (lang: LangCode) => void;
  t: Translate;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<LangCode>(detectInitialLang);

  useEffect(() => {
    if (typeof document !== "undefined") document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: LangCode) => {
    setLangState(next);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {
      // ignore — the choice still applies for this session
    }
  }, []);

  const value = useMemo<I18nValue>(
    () => ({ lang, setLang, t: (key, params) => translate(lang, key, params) }),
    [lang, setLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within an I18nProvider");
  return ctx;
}
