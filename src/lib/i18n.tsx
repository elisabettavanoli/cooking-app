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

/** Order shown in the language picker. */
export const LANGUAGE_ORDER: LangCode[] = ["en", "it", "de", "fr", "es"];

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
  "common.showPassword": "Show password",
  "common.hidePassword": "Hide password",

  "nav.kitchen": "Kitchen",
  "nav.list": "List",
  "nav.cook": "Cook",
  "nav.nearby": "Nearby",

  "kitchen.title": "My Kitchen",
  "kitchen.itemsTracked": { one: "{n} item tracked", other: "{n} items tracked" },
  "kitchen.toUseSoon": "{n} to use soon",
  "kitchen.searchPlaceholder": "Search inventory…",
  "kitchen.addIngredient": "Add ingredient",
  "kitchen.enterSelect": "Select items to cook with",
  "kitchen.exitSelect": "Exit selection mode",
  "kitchen.hintDefault": "Tap to update quantity · long-press for details",
  "kitchen.hintSelect": "Tap items to cook with",
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

  "list.title": "Shopping List",
  "list.toBuy": { one: "{n} item to buy", other: "{n} items to buy" },
  "list.searchPlaceholder": "Search list…",
  "list.emptyTitle": "Your list is empty",
  "list.emptyText": "Add items manually or from a recipe.",
  "list.purchased": "Purchased",
  "list.inYourKitchen": "in your kitchen",
  "list.addPlaceholder": "Add an item…",
  "list.add": "Add",

  "nearby.title": "Community",
  "nearby.subtitle": "Share ingredients with people nearby",
  "nearby.privacy": "Privacy",
  "nearby.sharingLabel": "Enable sharing",
  "nearby.sharingHint": "Share your whole kitchen with your community",
  "nearby.requestsLabel": "Allow requests",
  "nearby.requestsHint": "Neighbors can ask to borrow your items",
  "nearby.inventoryLabel": "Show inventory",
  "nearby.inventoryHint": "Community sees your available items",
  "nearby.joinTitle": "Join a community",
  "nearby.joinHint": "Enter an invite code from friends, roommates, or neighbors.",
  "nearby.join": "Join",
  "nearby.comingSoonTitle": "Nearby discovery is coming soon",
  "nearby.comingSoonText":
    "Once you join a community, you can browse and request nearby ingredients without sharing your exact location.",
  "nearby.language": "Language",
  "nearby.languageHint": "Used across the app and for sorting ingredients into categories.",

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
  "sheet.addToList": "Add to shopping list",
  "sheet.addSubtitle": "Enter an ingredient, the category is filled in for you.",
  "sheet.modeKitchen": "Kitchen",
  "sheet.modeList": "Shopping list",
  "sheet.ingredientName": "Ingredient name",
  "sheet.ingredientPlaceholder": "e.g. 3 red tomatoes",
  "sheet.displayName": "Display name",
  "sheet.displayNamePlaceholder": "Name as shown in the app",
  "sheet.quantity": "Quantity",
  "sheet.unit": "Unit",
  "sheet.category": "Category",
  "sheet.notesOptional": "Notes (optional)",
  "sheet.notes": "Notes",
  "sheet.notesPlaceholder": "Brand, storage tip, etc.",
  "sheet.addToKitchenBtn": "Add to kitchen",
  "sheet.addToListBtn": "Add to list",
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
  "common.showPassword": "Mostra password",
  "common.hidePassword": "Nascondi password",

  "nav.kitchen": "Cucina",
  "nav.list": "Lista",
  "nav.cook": "Cucinare",
  "nav.nearby": "Vicino",

  "kitchen.title": "La mia cucina",
  "kitchen.itemsTracked": { one: "{n} prodotto in dispensa", other: "{n} prodotti in dispensa" },
  "kitchen.toUseSoon": "{n} da usare presto",
  "kitchen.searchPlaceholder": "Cerca nella dispensa…",
  "kitchen.addIngredient": "Aggiungi ingrediente",
  "kitchen.enterSelect": "Seleziona gli ingredienti da usare",
  "kitchen.exitSelect": "Esci dalla selezione",
  "kitchen.hintDefault": "Tocca per aggiornare la quantità · tieni premuto per i dettagli",
  "kitchen.hintSelect": "Tocca gli ingredienti da usare",
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

  "list.title": "Lista della spesa",
  "list.toBuy": { one: "{n} prodotto da comprare", other: "{n} prodotti da comprare" },
  "list.searchPlaceholder": "Cerca nella lista…",
  "list.emptyTitle": "La tua lista è vuota",
  "list.emptyText": "Aggiungi prodotti a mano o da una ricetta.",
  "list.purchased": "Comprati",
  "list.inYourKitchen": "nella tua cucina",
  "list.addPlaceholder": "Aggiungi un prodotto…",
  "list.add": "Aggiungi",

  "nearby.title": "Community",
  "nearby.subtitle": "Condividi ingredienti con chi ti sta vicino",
  "nearby.privacy": "Privacy",
  "nearby.sharingLabel": "Attiva la condivisione",
  "nearby.sharingHint": "Condividi tutta la cucina con la tua community",
  "nearby.requestsLabel": "Consenti richieste",
  "nearby.requestsHint": "I vicini possono chiederti in prestito i tuoi prodotti",
  "nearby.inventoryLabel": "Mostra la dispensa",
  "nearby.inventoryHint": "La community vede i prodotti che hai disponibili",
  "nearby.joinTitle": "Entra in una community",
  "nearby.joinHint": "Inserisci un codice invito di amici, coinquilini o vicini.",
  "nearby.join": "Entra",
  "nearby.comingSoonTitle": "La scoperta nelle vicinanze arriva presto",
  "nearby.comingSoonText":
    "Una volta entrato in una community, potrai sfogliare e richiedere ingredienti vicino a te senza condividere la posizione esatta.",
  "nearby.language": "Lingua",
  "nearby.languageHint": "Usata in tutta l'app e per classificare gli ingredienti in categorie.",

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
  "sheet.addToList": "Aggiungi alla lista della spesa",
  "sheet.addSubtitle": "Inserisci un ingrediente, la categoria viene compilata per te.",
  "sheet.modeKitchen": "Cucina",
  "sheet.modeList": "Lista della spesa",
  "sheet.ingredientName": "Nome dell'ingrediente",
  "sheet.ingredientPlaceholder": "es. 3 pomodori rossi",
  "sheet.displayName": "Nome visualizzato",
  "sheet.displayNamePlaceholder": "Nome come appare nell'app",
  "sheet.quantity": "Quantità",
  "sheet.unit": "Unità",
  "sheet.category": "Categoria",
  "sheet.notesOptional": "Note (facoltative)",
  "sheet.notes": "Note",
  "sheet.notesPlaceholder": "Marca, consiglio di conservazione, ecc.",
  "sheet.addToKitchenBtn": "Aggiungi in cucina",
  "sheet.addToListBtn": "Aggiungi alla lista",
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
  "nearby.title": "Community",
  "nearby.subtitle": "Teile Zutaten mit Leuten in der Nähe",
  "nearby.language": "Sprache",
  "nearby.languageHint": "Wird in der ganzen App verwendet und zum Einsortieren von Zutaten.",
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
  "nearby.title": "Communauté",
  "nearby.subtitle": "Partagez des ingrédients avec vos voisins",
  "nearby.language": "Langue",
  "nearby.languageHint": "Utilisée dans toute l'app et pour classer les ingrédients.",
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
  "nearby.title": "Comunidad",
  "nearby.subtitle": "Comparte ingredientes con gente cercana",
  "nearby.language": "Idioma",
  "nearby.languageHint": "Se usa en toda la app y para clasificar los ingredientes.",
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
