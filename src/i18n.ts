// Two languages, plain dictionaries. Pure (no store import) so the service worker can write reminders in the user's language.
import { signal } from '@preact/signals';
import type { Lang } from './types';

type Dict = Record<string, string>;

const en: Dict = {
  googleTitle: 'Sign in with Google', googleExplain: 'Reopen this household on any phone with your Google account, no invite needed. Trade-off: the server then keeps the household key sealed, so it could technically read the data. Invite-only is more private.',
  googleOn: 'Google sign-in is on for {email}.', googleOff: 'Turn off Google sign-in', googleConfirmOff: 'Confirm with Google to turn it off.',
  or: 'or', haveOther: 'Already use Pet Care on another device?', 'err.nolink': 'No household is linked to that Google account yet. On the device that has your data, open Settings and turn on Google sign-in.', 'err.google': 'Google sign-in could not load. Check your connection.',
  viewPhoto: 'View photo', photoUnavailable: 'The full photo is not available yet. Showing the preview.', 'err.photoUpload': 'The full photo could not be uploaded, so only the preview was saved. Try again with a connection.',
  addPhoto: 'Add a photo', changePhoto: 'Change photo', removePhoto: 'Remove', 'err.photo': 'Could not read that image.',
  kg: 'kg', weightKg: 'Weight, kg', measureWeight: 'Record weight (kg) with each entry', forPet: 'Pet',
  'species.dog': 'Dog', 'species.cat': 'Cat', 'species.fish': 'Fish', 'species.bird': 'Bird', 'species.rabbit': 'Rabbit', 'species.hamster': 'Hamster', 'species.reptile': 'Reptile', 'species.other': 'Other', 'species.any': 'Any animal',
  speciesLabel: 'Kind of animal', seedRoutines: 'Add the standard routines for this animal',
  'preset.litter': 'Litter box change', 'preset.waterchange': 'Water change', 'preset.watertest': 'Water test', 'preset.filter': 'Filter cleaning', 'preset.cage': 'Cage cleaning', 'preset.uvb': 'UVB lamp replacement',

  app: 'Pet Care',
  'tab.today': 'Today', 'tab.plan': 'Plan', 'tab.history': 'History', 'tab.settings': 'Settings',
  undo: 'Undo', close: 'Close', all: 'All', add: 'Add', save: 'Save', delete: 'Delete', today: 'today', yesterday: 'yesterday', ago: '{d} ago',
  'sync.live': 'Live', 'sync.idle': 'Connected', 'sync.off': 'Offline', 'sync.bad': 'Signed out',
  last: 'Last: {when} by {by}', never: 'Not done yet', done: 'Mark done',
  'sec.overdue': 'Overdue', 'sec.today': 'Today', 'sec.soon': 'Coming up', 'sec.later': 'Later',
  attention: '{n} need attention', allGood: 'All caught up 🎉',
  noTasks: 'Nothing to track yet', noTasksText: 'Add vaccines, treatments, grooming… anything that repeats.', addTask: 'Add a routine',
  skipped: 'Skipped', doneOn: 'Done on', nextDue: 'Next due', nextDueHint: 'Optional, e.g. a booster in 3 weeks', note: 'Note', notePlaceholder: 'Vaccine brand, how it went…',
  pickDate: 'Pick a date', weekAgo: 'A week ago', inWeek: 'In a week', inMonth: 'In a month', in3Months: 'In 3 months', clear: 'Clear', markDone: 'Done', skip: 'Skip', recent: 'Recent', editEntryHint: 'Tap an entry to change its date. The next due date follows the latest entry.',
  'due.overdue': 'Overdue by {d}', 'due.today': 'Today', 'due.tomorrow': 'Tomorrow', 'due.in': 'In {d}',
  'digest.title': '🐾 {n} for your pets today', 'digest.more': '+{n} more', 'digest.generic': '🐾 Pet care reminder',
  every1: 'every {u}', every: 'every {x}',
  'u.day': 'day', 'u.week': 'week', 'u.month': 'month', 'u.year': 'year',
  'units.day': 'days', 'units.week': 'weeks', 'units.month': 'months', 'units.year': 'years',
  'n.day.one': '{n} day', 'n.day.other': '{n} days', 'n.week.one': '{n} week', 'n.week.other': '{n} weeks',
  'n.month.one': '{n} month', 'n.month.other': '{n} months', 'n.year.one': '{n} year', 'n.year.other': '{n} years',
  'plan.sub': 'What repeats, and how often', remindBefore: 'remind {d} d before', paused: 'Paused',
  custom: 'Custom routine', customHint: 'Anything else', editTask: 'Edit routine', name: 'Name', taskNamePlaceholder: 'e.g. Ear cleaning',
  repeatEvery: 'Repeat every', remindDays: 'Remind (days before)', remindDaysHint: '0 = on the day',
  forDogs: 'For which pets', forDogsHint: 'None selected = every pet of this kind',
  season: 'Only in these months', seasonHint: 'None selected = all year. Good for ticks and fleas.',
  firstDue: 'First due', firstDueHint: 'For a dog that never had it. Empty = today.',
  notes: 'Notes', notesPlaceholder: 'Dose, product, vet phone…',
  deleteTaskConfirm: 'Delete “{name}” and its history?',
  'history.sub': 'Everything that was done, and by whom', noHistory: 'No history yet', noHistoryText: 'Mark something done on the Today tab.', doneBy: 'Done by',
  welcome: 'Welcome to Pet Care', welcomeText: 'Track vaccines, treatments and grooming for your pets, and share it with the other person who looks after them.',
  yourName: 'Your name', yourNameHint: 'Shown next to what you log', yourNamePlaceholder: 'e.g. Ivan',
  invited: 'You were invited', invitedText: 'Join the shared household to see and log care together. Your data will be merged with the shared data.',
  joinHousehold: 'Join household', dogName: 'Pet’s name', dogNamePlaceholder: 'e.g. Rex', whatToTrack: 'What do you want to track?', start: 'Start',
  haveInvite: 'I have an invite link', inviteLink: 'Invite link',
  noServerHint: 'Set the sync server address in Settings first.',
  'err.invite': 'That invite link is not valid.', 'err.used': 'This invite was already used or has expired. Ask for a new one.', inviteOnce: 'Open this link on the phone or computer you want to add, or send it to your partner. It works once and expires in 7 days. Send it only to someone you trust. To invite someone else, make a new one.', copyLink: 'Copy link', shareLink: 'Share…', 'err.sync': 'Could not reach the sync server.', 'err.auth': 'The server no longer accepts this device. Leave the household and join again with a new invite.',
  'err.denied': 'Notifications are blocked. Allow them in your browser or phone settings.', 'err.vapid': 'The server has no push keys set up yet.', 'err.backup': 'That file is not a Pet Care backup.',
  you: 'You', dogs: 'Pets', household: 'Shared household', householdOn: 'Everything you and your partner log appears on both phones within a second. It is end-to-end encrypted: the server cannot read it.',
  householdOff: 'Track together with someone else. You both see changes instantly.', invitePartner: 'Invite partner or add a device', syncNow: 'Sync now', leave: 'Leave', leaveConfirm: 'Stop syncing on this phone? Your data stays here.',
  server: 'Sync server', serverHint: 'Address of your Cloudflare Worker', createHousehold: 'Create shared household', syncedAt: 'synced {time}',
  inviteMessage: 'Join me in tracking our pets’ care', copied: 'Invite link copied',
  reminders: 'Reminders', noNotifications: 'This browser does not support notifications. Use the calendar export below.', notifyMe: 'Remind me', remindAt: 'Remind at', remindAtHint: 'Local time of day',
  testReminder: 'Send a test reminder', iosInstall: 'On iPhone, add the app to your Home Screen (Share → Add to Home Screen) to get reminders.',
  localOnly: 'Reminders arrive while the app is open. Join a household to also get them when it is closed.',
  exportIcs: 'Add to calendar (.ics)', icsHint: 'Repeating calendar events with alerts. Works even if notifications do not. Export again after a late completion.',
  data: 'Your data', exportJson: 'Export backup', importJson: 'Import backup', imported: 'Backup imported', privacy: 'Data lives on this phone. Sync is encrypted end-to-end.',
  appearance: 'Appearance', language: 'Language', theme: 'Theme', 'theme.auto': 'Auto', 'theme.light': 'Light', 'theme.dark': 'Dark', accent: 'Accent colour',
  addDog: 'Add a pet', editDog: 'Edit pet', breed: 'Breed', birthday: 'Birthday', deleteDogConfirm: 'Delete {name} and all their history?',
  'preset.rabies': 'Rabies vaccine', 'preset.vaccine': 'Core vaccine', 'preset.deworm': 'Deworming', 'preset.tick': 'Flea & tick', 'preset.brush': 'Brushing',
  'preset.teeth': 'Teeth brushing', 'preset.nails': 'Nail trimming', 'preset.bath': 'Bath', 'preset.ears': 'Ear cleaning', 'preset.vet': 'Vet check-up', 'preset.weigh': 'Weigh-in',
};

const uk: Dict = {
  googleTitle: 'Вхід через Google', googleExplain: 'Відкривайте цей спільний доступ на будь-якому телефоні зі своїм акаунтом Google, без запрошення. Компроміс: сервер тоді зберігає ключ у запечатаному вигляді, тож технічно міг би читати дані. Лише за запрошенням приватніше.',
  googleOn: 'Вхід через Google увімкнено для {email}.', googleOff: 'Вимкнути вхід через Google', googleConfirmOff: 'Підтвердьте через Google, щоб вимкнути.',
  or: 'або', haveOther: 'Уже користуєтесь Pet Care на іншому пристрої?', 'err.nolink': 'До цього акаунта Google ще не привʼязано спільного доступу. На пристрої з вашими даними відкрийте Налаштування й увімкніть вхід через Google.', 'err.google': 'Не вдалося завантажити вхід через Google. Перевірте зʼєднання.',
  viewPhoto: 'Переглянути фото', photoUnavailable: 'Повне фото поки недоступне. Показано мініатюру.', 'err.photoUpload': 'Не вдалося завантажити повне фото, збережено лише мініатюру. Спробуйте ще раз із зʼєднанням.',
  addPhoto: 'Додати фото', changePhoto: 'Змінити фото', removePhoto: 'Прибрати', 'err.photo': 'Не вдалося прочитати зображення.',
  kg: 'кг', weightKg: 'Вага, кг', measureWeight: 'Записувати вагу (кг) з кожним записом', forPet: 'Улюбленець',
  'species.dog': 'Собака', 'species.cat': 'Кіт', 'species.fish': 'Рибка', 'species.bird': 'Птах', 'species.rabbit': 'Кролик', 'species.hamster': 'Хом\'як', 'species.reptile': 'Рептилія', 'species.other': 'Інше', 'species.any': 'Будь-яка тварина',
  speciesLabel: 'Вид тварини', seedRoutines: 'Додати стандартні процедури для цієї тварини',
  'preset.litter': 'Заміна наповнювача', 'preset.waterchange': 'Підміна води', 'preset.watertest': 'Тест води', 'preset.filter': 'Чистка фільтра', 'preset.cage': 'Прибирання клітки', 'preset.uvb': 'Заміна UVB-лампи',

  app: 'Догляд за улюбленцем',
  'tab.today': 'Сьогодні', 'tab.plan': 'План', 'tab.history': 'Історія', 'tab.settings': 'Налаштування',
  undo: 'Скасувати', close: 'Закрити', all: 'Усі', add: 'Додати', save: 'Зберегти', delete: 'Видалити', today: 'сьогодні', yesterday: 'вчора', ago: '{d} тому',
  'sync.live': 'Наживо', 'sync.idle': 'Підключено', 'sync.off': 'Офлайн', 'sync.bad': 'Відʼєднано',
  last: 'Востаннє: {when}, {by}', never: 'Ще не робили', done: 'Позначити виконаним',
  'sec.overdue': 'Прострочено', 'sec.today': 'Сьогодні', 'sec.soon': 'Незабаром', 'sec.later': 'Пізніше',
  attention: 'Потребує уваги: {n}', allGood: 'Усе зроблено 🎉',
  noTasks: 'Поки нічого не відстежується', noTasksText: 'Додайте щеплення, обробки, догляд… усе, що повторюється.', addTask: 'Додати процедуру',
  skipped: 'Пропущено', doneOn: 'Дата', nextDue: 'Наступного разу', nextDueHint: 'Необовʼязково, напр. ревакцинація через 3 тижні', note: 'Нотатка', notePlaceholder: 'Назва вакцини, як минуло…',
  pickDate: 'Оберіть дату', weekAgo: 'Тиждень тому', inWeek: 'Через тиждень', inMonth: 'Через місяць', in3Months: 'Через 3 місяці', clear: 'Очистити', markDone: 'Зроблено', skip: 'Пропустити', recent: 'Нещодавно', editEntryHint: 'Торкніться запису, щоб змінити дату. Наступний термін рахується від останнього запису.',
  'due.overdue': 'Прострочено на {d}', 'due.today': 'Сьогодні', 'due.tomorrow': 'Завтра', 'due.in': 'Через {d}',
  'digest.title': '🐾 Для улюбленців сьогодні: {n}', 'digest.more': '+ ще {n}', 'digest.generic': '🐾 Нагадування про догляд',
  every1: 'кожен {u}', every: 'кожні {x}',
  'u.day': 'день', 'u.week': 'тиждень', 'u.month': 'місяць', 'u.year': 'рік',
  'units.day': 'днів', 'units.week': 'тижнів', 'units.month': 'місяців', 'units.year': 'років',
  'n.day.one': '{n} день', 'n.day.few': '{n} дні', 'n.day.many': '{n} днів', 'n.day.other': '{n} дня',
  'n.week.one': '{n} тиждень', 'n.week.few': '{n} тижні', 'n.week.many': '{n} тижнів', 'n.week.other': '{n} тижня',
  'n.month.one': '{n} місяць', 'n.month.few': '{n} місяці', 'n.month.many': '{n} місяців', 'n.month.other': '{n} місяця',
  'n.year.one': '{n} рік', 'n.year.few': '{n} роки', 'n.year.many': '{n} років', 'n.year.other': '{n} року',
  'plan.sub': 'Що повторюється і як часто', remindBefore: 'нагадати за {d} дн.', paused: 'На паузі',
  custom: 'Своя процедура', customHint: 'Будь-що інше', editTask: 'Редагувати процедуру', name: 'Назва', taskNamePlaceholder: 'напр. Чистка вух',
  repeatEvery: 'Повторювати кожні', remindDays: 'Нагадати (за скільки днів)', remindDaysHint: '0 = у день процедури',
  forDogs: 'Для яких улюбленців', forDogsHint: 'Нічого не вибрано = усі такого виду',
  season: 'Лише в ці місяці', seasonHint: 'Нічого не вибрано = цілий рік. Зручно для кліщів і бліх.',
  firstDue: 'Перший раз', firstDueHint: 'Для собаки, якій цього ще не робили. Порожньо = сьогодні.',
  notes: 'Нотатки', notesPlaceholder: 'Дозування, препарат, телефон ветеринара…',
  deleteTaskConfirm: 'Видалити «{name}» разом з історією?',
  'history.sub': 'Усе, що зроблено, і ким', noHistory: 'Історії ще немає', noHistoryText: 'Позначте щось виконаним на вкладці «Сьогодні».', doneBy: 'Хто зробив',
  welcome: 'Вітаємо у Догляді за улюбленцем', welcomeText: 'Відстежуйте щеплення, обробки та догляд за вашими улюбленцями й діліться з тим, хто доглядає разом з вами.',
  yourName: 'Ваше імʼя', yourNameHint: 'Показується біля того, що ви відмічаєте', yourNamePlaceholder: 'напр. Іван',
  invited: 'Вас запросили', invitedText: 'Приєднайтесь до спільного домогосподарства, щоб бачити й вести догляд разом. Ваші дані обʼєднаються зі спільними.',
  joinHousehold: 'Приєднатися', dogName: 'Імʼя улюбленця', dogNamePlaceholder: 'напр. Рекс', whatToTrack: 'Що ви хочете відстежувати?', start: 'Почати',
  haveInvite: 'У мене є запрошення', inviteLink: 'Посилання-запрошення',
  noServerHint: 'Спершу вкажіть адресу сервера синхронізації в налаштуваннях.',
  'err.invite': 'Це посилання-запрошення недійсне.', 'err.used': 'Це запрошення вже використано або воно прострочене. Попросіть нове.', inviteOnce: 'Відкрийте це посилання на телефоні чи комп’ютері, який хочете додати, або надішліть партнеру. Воно працює один раз і діє 7 днів. Надсилайте лише тому, кому довіряєте. Щоб запросити ще когось, створіть нове.', copyLink: 'Копіювати посилання', shareLink: 'Поділитися…', 'err.sync': 'Не вдалося звʼязатися із сервером синхронізації.', 'err.auth': 'Сервер більше не приймає цей пристрій. Вийдіть зі спільного доступу й приєднайтесь за новим запрошенням.',
  'err.denied': 'Сповіщення заблоковані. Дозвольте їх у налаштуваннях браузера чи телефону.', 'err.vapid': 'На сервері ще не налаштовані ключі push.', 'err.backup': 'Цей файл не є резервною копією Догляду за улюбленцем.',
  you: 'Ви', dogs: 'Улюбленці', household: 'Спільний доступ', householdOn: 'Усе, що відмічаєте ви і партнер, зʼявляється на обох телефонах за секунду. Дані наскрізно зашифровані: сервер їх не читає.',
  householdOff: 'Ведіть догляд разом. Ви обоє бачите зміни миттєво.', invitePartner: 'Запросити партнера або додати пристрій', syncNow: 'Синхронізувати', leave: 'Вийти', leaveConfirm: 'Зупинити синхронізацію на цьому телефоні? Дані залишаться тут.',
  server: 'Сервер синхронізації', serverHint: 'Адреса вашого Cloudflare Worker', createHousehold: 'Створити спільний доступ', syncedAt: 'синхронізовано о {time}',
  inviteMessage: 'Долучайся до догляду за нашими улюбленцями', copied: 'Посилання скопійовано',
  reminders: 'Нагадування', noNotifications: 'Цей браузер не підтримує сповіщень. Скористайтесь експортом у календар нижче.', notifyMe: 'Нагадувати', remindAt: 'Нагадувати о', remindAtHint: 'Місцевий час',
  testReminder: 'Надіслати тестове нагадування', iosInstall: 'На iPhone додайте застосунок на екран «Додому» (Поділитися → На екран «Додому»), щоб отримувати нагадування.',
  localOnly: 'Нагадування приходять, поки застосунок відкритий. Приєднайтесь до спільного доступу, щоб отримувати їх і коли він закритий.',
  exportIcs: 'Додати в календар (.ics)', icsHint: 'Календарні події, що повторюються, зі сповіщеннями. Працюють і без сповіщень застосунку. Після запізнілого виконання експортуйте знову.',
  data: 'Ваші дані', exportJson: 'Експорт копії', importJson: 'Імпорт копії', imported: 'Копію імпортовано', privacy: 'Дані зберігаються на цьому телефоні. Синхронізація наскрізно зашифрована.',
  appearance: 'Вигляд', language: 'Мова', theme: 'Тема', 'theme.auto': 'Авто', 'theme.light': 'Світла', 'theme.dark': 'Темна', accent: 'Акцентний колір',
  addDog: 'Додати улюбленця', editDog: 'Редагувати улюбленця', breed: 'Порода', birthday: 'День народження', deleteDogConfirm: 'Видалити {name} разом з усією історією?',
  'preset.rabies': 'Щеплення від сказу', 'preset.vaccine': 'Комплексна вакцина', 'preset.deworm': 'Глисти (дегельмінтизація)', 'preset.tick': 'Блохи та кліщі', 'preset.brush': 'Вичісування',
  'preset.teeth': 'Чистка зубів', 'preset.nails': 'Підрізання кігтів', 'preset.bath': 'Купання', 'preset.ears': 'Чистка вух', 'preset.vet': 'Огляд у ветеринара', 'preset.weigh': 'Зважування',
};

const DICTS: Record<Lang, Dict> = { en, uk };

/** The language the interface is showing; screens that call `t` re-render when it changes. */
export const lang = signal<Lang>('en');

export function translate(l: Lang, key: string, params?: Record<string, string>): string {
  const s = DICTS[l][key] ?? en[key] ?? key;
  return params ? s.replace(/\{(\w+)\}/g, (_, k: string) => params[k] ?? `{${k}}`) : s;
}

export const t = (key: string, params?: Record<string, string>) => translate(lang.value, key, params);

/** A routine still carrying a preset's stock name is shown in the current language; renamed ones are left alone. */
export function taskName(l: Lang, name: string): string {
  for (const k of Object.keys(en)) {
    if (k.startsWith('preset.') && (name === en[k] || name === uk[k])) return DICTS[l][k];
  }
  return name;
}

/** "3 days" / "3 дні": picks the plural form of `key` for this language and number. */
export function pluralize(l: Lang, key: string, n: number): string {
  const form = new Intl.PluralRules(l === 'uk' ? 'uk' : 'en').select(n);
  const s = DICTS[l][`${key}.${form}`] ?? DICTS[l][`${key}.other`] ?? en[`${key}.other`];
  return s.replace('{n}', String(n));
}
