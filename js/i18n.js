// Language switching for every page.
//
// Static page text is written in English directly in the HTML and tagged with
// data-i18n="key" (textContent) or data-i18n-aria-label="key" (aria-label). The English
// original is captured from the DOM the first time a page is translated, so English
// only lives in the HTML — the dictionaries below only need `en` entries for strings
// that JS renders itself (product cards, modal, filters).
//
// Product names/descriptions are translated via each product's optional
// `translations` field in js/data.js (falls back to English).

const LANGUAGES = ["en", "ru", "uk", "pl"];
const DEFAULT_LANGUAGE = "en";
const LANGUAGE_STORAGE_KEY = "belfegor-lang";

const TRANSLATIONS = {
  en: {
    "product.soldOut": "Sold Out",
    "product.order": "Order via Instagram",
    "product.viewDetails": "View details for {name}",
    "modal.photo": "Show photo {n}",
    "shop.empty": "No products match your filters.",
    "category.Necklace": "Necklaces",
    "category.Choker": "Chokers",
    "category.Charm": "Charms",
  },
  ru: {
    "title.shop": "Belfegor — украшения ручной работы",
    "title.about": "Belfegor — Обо мне",
    "title.custom": "Belfegor — Индивидуальные заказы",
    "title.shipping": "Belfegor — Доставка",
    "title.contact": "Belfegor — Контакты",
    "nav.label": "Основное меню",
    "nav.shop": "Магазин",
    "nav.about": "Обо мне",
    "nav.custom": "Индивидуальные заказы",
    "nav.shipping": "Доставка",
    "nav.contact": "Контакты",
    "brand.home": "Belfegor — на главную",
    "brand.subtitle": "Украшения ручной работы",
    "lang.label": "Язык",
    "hero.title": "Украшения ручной работы для тех, кто чувствует слишком сильно",
    "hero.tag1": "Уникальные",
    "hero.tag2": "Готические",
    "hero.tag3": "Тёмные",
    "hero.tag4": "Ручная работа",
    "hero.cta": "В магазин",
    "hero.city": "Краков",
    "categories.label": "Категории",
    "shop.title": "Все изделия",
    "shop.availability": "Наличие",
    "shop.availability.all": "Все",
    "shop.availability.inStock": "В наличии",
    "shop.availability.outOfStock": "Продано",
    "shop.sort": "Сортировка",
    "sort.relevant": "По умолчанию",
    "sort.priceAsc": "Цена: по возрастанию",
    "sort.priceDesc": "Цена: по убыванию",
    "sort.nameAsc": "Название: А–Я",
    "sort.nameDesc": "Название: Я–А",
    "shop.empty": "Нет товаров, подходящих под фильтры.",
    "product.soldOut": "Продано",
    "product.order": "Заказать в Instagram",
    "product.viewDetails": "Подробнее: {name}",
    "modal.close": "Закрыть",
    "modal.photo": "Фото {n}",
    "category.Necklace": "Ожерелья",
    "category.Choker": "Чокеры",
    "category.Charm": "Подвески",
    "features.label": "Почему Belfegor",
    "feat.handmade.title": "Ручная работа",
    "feat.handmade.text": "Каждое изделие сделано вручную с вниманием к деталям.",
    "feat.payments.title": "Безопасная оплата",
    "feat.payments.text": "Удобные и надёжные способы оплаты.",
    "feat.shipping.title": "Доставка по Европе",
    "feat.shipping.text": "Из Польши, с заботой.",
    "feat.script": "Больше, чем просто украшения...",
    "footer.orderThrough": "Заказать через:",
    "footer.questions": "Есть вопросы?",
    "footer.write": "Смело пишите",
    "about.title": "Обо мне",
    "about.photo": "Фото скоро появится",
    "about.photoLabel": "Фото мастера (скоро)",
    "about.bio":
      "Привет, я [Your Name] — руки, которые создают Belfegor. Я делаю украшения в готическом стиле уже [X years], превращая цепочки, проволоку и мелкие тёмные детали в уникальные вещи. Каждое изделие сделано вручную от начала до конца, звено за звеном, здесь, в [Your City].",
    "shipping.title": "Доставка",
    "shipping.p1":
      "Каждое изделие делается под заказ и отправляется из [City], Польша, через [Carrier — e.g. Poczta Polska / InPost]. На изготовление и упаковку заказа нужно [X] рабочих дней после того, как мы согласуем детали в Instagram DM.",
    "shipping.p2":
      "Доставка по Польше обычно занимает [A-B] рабочих дней. Международная доставка — как правило, [C-D] недель, в зависимости от страны назначения и таможенного оформления. После отправки вы получите трек-номер.",
    "shipping.p3a": "Не уверены, доставляем ли мы в вашу страну, или есть вопрос о стоимости? Напишите нам в",
    "shipping.p3b": "до оформления заказа — мы с радостью поможем.",
    "custom.title": "Индивидуальные заказы",
    "custom.intro":
      "Есть идея украшения, которого ещё не существует? Я делаю украшения на заказ — новый дизайн, вариацию существующего изделия или комплект.",
    "custom.step1.title": "Поделитесь идеей",
    "custom.step1.text": "Напишите нам в Instagram или Telegram: опишите идею, пришлите эскизы или фото-референсы.",
    "custom.step2.title": "Согласуем детали",
    "custom.step2.text": "Мы обсуждаем материалы, размер, цену и сроки до начала работы.",
    "custom.step3.title": "Сделано вручную для вас",
    "custom.step3.text": "Ваше украшение создаётся вручную, звено за звеном.",
    "custom.step4.title": "Отправка с заботой",
    "custom.step4.text": "Заказ упаковывается и отправляется из Польши.",
    "custom.cta": "Начать индивидуальный заказ",
    "contact.title": "Контакты",
    "contact.intro":
      "Вопросы об украшении, заказе или доставке? Пишите нам в любой из этих сервисов — мы с радостью поможем.",
    "contact.instagram": "Заказы и вопросы",
    "contact.telegram": "Сообщения и вопросы",
    "contact.vinted": "Наши объявления на Vinted",
    "contact.location": "Краков, Польша",
  },
  uk: {
    "title.shop": "Belfegor — прикраси ручної роботи",
    "title.about": "Belfegor — Про мене",
    "title.custom": "Belfegor — Індивідуальні замовлення",
    "title.shipping": "Belfegor — Доставка",
    "title.contact": "Belfegor — Контакти",
    "nav.label": "Головне меню",
    "nav.shop": "Магазин",
    "nav.about": "Про мене",
    "nav.custom": "Індивідуальні замовлення",
    "nav.shipping": "Доставка",
    "nav.contact": "Контакти",
    "brand.home": "Belfegor — на головну",
    "brand.subtitle": "Прикраси ручної роботи",
    "lang.label": "Мова",
    "hero.title": "Прикраси ручної роботи для тих, хто відчуває надто сильно",
    "hero.tag1": "Унікальні",
    "hero.tag2": "Готичні",
    "hero.tag3": "Темні",
    "hero.tag4": "Ручна робота",
    "hero.cta": "До магазину",
    "hero.city": "Краків",
    "categories.label": "Категорії",
    "shop.title": "Усі вироби",
    "shop.availability": "Наявність",
    "shop.availability.all": "Усі",
    "shop.availability.inStock": "В наявності",
    "shop.availability.outOfStock": "Продано",
    "shop.sort": "Сортування",
    "sort.relevant": "За замовчуванням",
    "sort.priceAsc": "Ціна: за зростанням",
    "sort.priceDesc": "Ціна: за спаданням",
    "sort.nameAsc": "Назва: А–Я",
    "sort.nameDesc": "Назва: Я–А",
    "shop.empty": "Немає товарів, що відповідають фільтрам.",
    "product.soldOut": "Продано",
    "product.order": "Замовити в Instagram",
    "product.viewDetails": "Детальніше: {name}",
    "modal.close": "Закрити",
    "modal.photo": "Фото {n}",
    "category.Necklace": "Намиста",
    "category.Choker": "Чокери",
    "category.Charm": "Підвіски",
    "features.label": "Чому Belfegor",
    "feat.handmade.title": "Ручна робота",
    "feat.handmade.text": "Кожен виріб зроблено вручну з увагою до деталей.",
    "feat.payments.title": "Безпечна оплата",
    "feat.payments.text": "Зручні та надійні способи оплати.",
    "feat.shipping.title": "Доставка по Європі",
    "feat.shipping.text": "З Польщі, з турботою.",
    "feat.script": "Більше, ніж просто прикраси...",
    "footer.orderThrough": "Замовити через:",
    "footer.questions": "Є питання?",
    "footer.write": "Сміливо пишіть",
    "about.title": "Про мене",
    "about.photo": "Фото незабаром",
    "about.photoLabel": "Фото майстра (незабаром)",
    "about.bio":
      "Привіт, я [Your Name] — руки, що створюють Belfegor. Я роблю прикраси в готичному стилі вже [X years], перетворюючи ланцюжки, дріт і дрібні темні деталі на унікальні речі. Кожен виріб зроблено вручну від початку до кінця, ланка за ланкою, тут, у [Your City].",
    "shipping.title": "Доставка",
    "shipping.p1":
      "Кожен виріб виготовляється на замовлення й надсилається з [City], Польща, через [Carrier — e.g. Poczta Polska / InPost]. На виготовлення й пакування замовлення потрібно [X] робочих днів після того, як ми узгодимо деталі в Instagram DM.",
    "shipping.p2":
      "Доставка по Польщі зазвичай триває [A-B] робочих днів. Міжнародна доставка — як правило, [C-D] тижнів, залежно від країни призначення та митного оформлення. Після відправлення ви отримаєте трек-номер.",
    "shipping.p3a": "Не впевнені, чи доставляємо ми у вашу країну, або маєте питання щодо вартості? Напишіть нам в",
    "shipping.p3b": "до оформлення замовлення — ми з радістю допоможемо.",
    "custom.title": "Індивідуальні замовлення",
    "custom.intro":
      "Маєте ідею прикраси, якої ще не існує? Я виготовляю прикраси на замовлення — новий дизайн, варіацію наявного виробу або комплект.",
    "custom.step1.title": "Поділіться ідеєю",
    "custom.step1.text": "Напишіть нам в Instagram або Telegram: опишіть ідею, надішліть ескізи чи фото-референси.",
    "custom.step2.title": "Узгодимо деталі",
    "custom.step2.text": "Ми обговорюємо матеріали, розмір, ціну та терміни до початку роботи.",
    "custom.step3.title": "Зроблено вручну для вас",
    "custom.step3.text": "Вашу прикрасу створюють вручну, ланка за ланкою.",
    "custom.step4.title": "Відправлення з турботою",
    "custom.step4.text": "Замовлення пакується та надсилається з Польщі.",
    "custom.cta": "Почати індивідуальне замовлення",
    "contact.title": "Контакти",
    "contact.intro":
      "Питання щодо прикраси, замовлення чи доставки? Пишіть нам у будь-який із цих сервісів — ми з радістю допоможемо.",
    "contact.instagram": "Замовлення та питання",
    "contact.telegram": "Повідомлення та питання",
    "contact.vinted": "Наші оголошення на Vinted",
    "contact.location": "Краків, Польща",
  },
  pl: {
    "title.shop": "Belfegor — biżuteria ręcznie robiona",
    "title.about": "Belfegor — O mnie",
    "title.custom": "Belfegor — Zamówienia indywidualne",
    "title.shipping": "Belfegor — Wysyłka",
    "title.contact": "Belfegor — Kontakt",
    "nav.label": "Menu główne",
    "nav.shop": "Sklep",
    "nav.about": "O mnie",
    "nav.custom": "Zamówienia indywidualne",
    "nav.shipping": "Wysyłka",
    "nav.contact": "Kontakt",
    "brand.home": "Belfegor — strona główna",
    "brand.subtitle": "Biżuteria ręcznie robiona",
    "lang.label": "Język",
    "hero.title": "Biżuteria ręcznie robiona dla tych, którzy czują za mocno",
    "hero.tag1": "Unikatowe",
    "hero.tag2": "Gotyckie",
    "hero.tag3": "Mroczne",
    "hero.tag4": "Ręcznie robione",
    "hero.cta": "Do sklepu",
    "hero.city": "Kraków",
    "categories.label": "Kategorie",
    "shop.title": "Wszystkie produkty",
    "shop.availability": "Dostępność",
    "shop.availability.all": "Wszystkie",
    "shop.availability.inStock": "Dostępne",
    "shop.availability.outOfStock": "Wyprzedane",
    "shop.sort": "Sortuj",
    "sort.relevant": "Domyślnie",
    "sort.priceAsc": "Cena: od najniższej",
    "sort.priceDesc": "Cena: od najwyższej",
    "sort.nameAsc": "Nazwa: A–Z",
    "sort.nameDesc": "Nazwa: Z–A",
    "shop.empty": "Brak produktów spełniających kryteria.",
    "product.soldOut": "Wyprzedane",
    "product.order": "Zamów przez Instagram",
    "product.viewDetails": "Szczegóły: {name}",
    "modal.close": "Zamknij",
    "modal.photo": "Zdjęcie {n}",
    "category.Necklace": "Naszyjniki",
    "category.Choker": "Chokery",
    "category.Charm": "Zawieszki",
    "features.label": "Dlaczego Belfegor",
    "feat.handmade.title": "Ręczna robota",
    "feat.handmade.text": "Każdy element jest wykonany ręcznie z dbałością o szczegóły.",
    "feat.payments.title": "Bezpieczne płatności",
    "feat.payments.text": "Wygodne i bezpieczne metody płatności.",
    "feat.shipping.title": "Wysyłka po całej Europie",
    "feat.shipping.text": "Z Polski, z troską.",
    "feat.script": "Więcej niż biżuteria...",
    "footer.orderThrough": "Zamów przez:",
    "footer.questions": "Masz pytania?",
    "footer.write": "Śmiało pisz",
    "about.title": "O mnie",
    "about.photo": "Zdjęcie wkrótce",
    "about.photoLabel": "Zdjęcie twórczyni (wkrótce)",
    "about.bio":
      "Cześć, jestem [Your Name] — to moje ręce tworzą Belfegor. Robię biżuterię inspirowaną gotykiem od [X years], zamieniając łańcuszki, drut i drobne mroczne detale w jedyne w swoim rodzaju przedmioty. Każdy element powstaje ręcznie od początku do końca, ogniwo po ogniwie, tutaj, w [Your City].",
    "shipping.title": "Wysyłka",
    "shipping.p1":
      "Każdy element jest wykonywany na zamówienie i wysyłany z [City] w Polsce przez [Carrier — e.g. Poczta Polska / InPost]. Na wykonanie i zapakowanie zamówienia potrzeba [X] dni roboczych od potwierdzenia szczegółów w wiadomości na Instagramie.",
    "shipping.p2":
      "Wysyłka na terenie Polski trwa zwykle [A-B] dni roboczych. Wysyłka zagraniczna trwa zazwyczaj [C-D] tygodni, w zależności od kraju docelowego i odprawy celnej. Po nadaniu paczki otrzymasz numer śledzenia.",
    "shipping.p3a": "Nie wiesz, czy wysyłamy do Twojego kraju, albo masz pytanie o koszt? Napisz do nas na",
    "shipping.p3b": "przed złożeniem zamówienia — chętnie pomożemy.",
    "custom.title": "Zamówienia indywidualne",
    "custom.intro":
      "Masz pomysł na biżuterię, która jeszcze nie istnieje? Wykonuję biżuterię na zamówienie — nowy projekt, wariant istniejącego wzoru lub pasujący komplet.",
    "custom.step1.title": "Podziel się pomysłem",
    "custom.step1.text": "Napisz do nas na Instagramie lub Telegramie — opisz pomysł, prześlij szkice lub zdjęcia inspiracji.",
    "custom.step2.title": "Ustalamy szczegóły",
    "custom.step2.text": "Przed rozpoczęciem pracy omawiamy materiały, rozmiar, cenę i termin.",
    "custom.step3.title": "Ręcznie robione dla Ciebie",
    "custom.step3.text": "Twoja biżuteria powstaje ręcznie, ogniwo po ogniwie.",
    "custom.step4.title": "Wysłane z troską",
    "custom.step4.text": "Zamówienie jest pakowane i wysyłane z Polski.",
    "custom.cta": "Złóż zamówienie indywidualne",
    "contact.title": "Kontakt",
    "contact.intro":
      "Pytania o biżuterię, zamówienie lub wysyłkę? Napisz do nas w dowolnym z tych miejsc — chętnie pomożemy.",
    "contact.instagram": "Zamówienia i pytania",
    "contact.telegram": "Wiadomości i pytania",
    "contact.vinted": "Nasze ogłoszenia na Vinted",
    "contact.location": "Kraków, Polska",
  },
};

let currentLanguage = DEFAULT_LANGUAGE;

// English originals captured from the HTML, keyed by element + attribute.
const originalText = new WeakMap();

function readStoredLanguage() {
  try {
    return localStorage.getItem(LANGUAGE_STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeLanguage(lang) {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch {
    // Storage can be unavailable (private mode, blocked site data) — switching still
    // works for this page view, it just won't be remembered.
  }
}

function detectLanguage() {
  const stored = readStoredLanguage();
  if (LANGUAGES.includes(stored)) return stored;

  const browser = (navigator.language || "").slice(0, 2).toLowerCase();
  if (LANGUAGES.includes(browser)) return browser;

  return DEFAULT_LANGUAGE;
}

function t(key, params = {}) {
  const dict = TRANSLATIONS[currentLanguage] || {};
  let text = dict[key] ?? TRANSLATIONS[DEFAULT_LANGUAGE][key] ?? key;
  for (const [name, value] of Object.entries(params)) {
    text = text.replace(`{${name}}`, value);
  }
  return text;
}

function categoryLabel(category) {
  const key = `category.${category}`;
  const text = t(key);
  return text === key ? category : text;
}

function localizedProduct(product) {
  const translation = (product.translations && product.translations[currentLanguage]) || {};
  return {
    ...product,
    name: translation.name || product.name,
    description: translation.description || product.description,
  };
}

function translateElement(el, attr, key) {
  let originals = originalText.get(el);
  if (!originals) {
    originals = {};
    originalText.set(el, originals);
  }

  const read = () => (attr === "text" ? el.textContent : el.getAttribute(attr));
  const write = (value) => (attr === "text" ? (el.textContent = value) : el.setAttribute(attr, value));

  if (!(attr in originals)) originals[attr] = read();

  const dict = TRANSLATIONS[currentLanguage] || {};
  write(currentLanguage !== DEFAULT_LANGUAGE && dict[key] ? dict[key] : originals[attr]);
}

function applyTranslations(root = document) {
  root.querySelectorAll("[data-i18n]").forEach((el) => translateElement(el, "text", el.dataset.i18n));
  root
    .querySelectorAll("[data-i18n-aria-label]")
    .forEach((el) => translateElement(el, "aria-label", el.dataset.i18nAriaLabel));

  document.querySelectorAll(".lang-select").forEach((select) => {
    select.value = currentLanguage;
  });
  document.querySelectorAll(".lang-option").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.lang === currentLanguage));
  });
}

function setLanguage(lang) {
  if (!LANGUAGES.includes(lang)) return;
  currentLanguage = lang;
  storeLanguage(lang);
  document.documentElement.lang = lang;
  applyTranslations();
  document.dispatchEvent(new CustomEvent("languagechange", { detail: { lang } }));
}

function getLanguage() {
  return currentLanguage;
}

function initI18n() {
  document.querySelectorAll(".lang-select").forEach((select) => {
    select.addEventListener("change", () => setLanguage(select.value));
  });
  document.addEventListener("click", (event) => {
    const button = event.target.closest(".lang-option");
    if (button) setLanguage(button.dataset.lang);
  });

  currentLanguage = detectLanguage();
  document.documentElement.lang = currentLanguage;
  applyTranslations();
}

if (typeof document !== "undefined") {
  initI18n();
}

if (typeof module !== "undefined") {
  module.exports = { TRANSLATIONS, LANGUAGES, DEFAULT_LANGUAGE };
}
