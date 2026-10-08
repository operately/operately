# Russian glossary

Locale: `ru` (Gettext: `ru`). Use standard Russian for a general professional audience. Apply these terms consistently in the UI, activity feeds, emails, exports, and documentation. See the [internationalization guide](../../internationalization.md) for the translation workflow.

## Russian usage

- Address the user with **вы**, **вам**, **ваш**, lowercase except at the start of a sentence. Use the same respectful, direct tone in onboarding, errors, billing, and emails; do not alternate with **ты** or ceremonial **Вы**.
- Use sentence casing: **Родительская цель**, **Подтвердить прочтение**, not English title case. Role names are lowercase in sentences. Use perfective infinitives for actions (**Создать проект**, **Сохранить изменения**) and polite imperatives for instructions (**Выберите пространство**).
- Use **ё** consistently in system copy: **отчёт**, **учётная запись**, **завершён**. Use Russian quotation marks **«…»** and **и**, including in named sections where English uses **&**. Keep established abbreviations such as **KPI**, **API**, **MCP**, and product names unchanged; write compounds such as **API-токен**, **MCP-подключение**, **чек-лист**, **канбан-доска**.
- Inflect full sentences, not independently translated fragments: **в пространстве**, **участники проекта**, **к родительской цели**. Dictionary forms in the tables are not suitable for every case. A generic “None” also depends on the noun: **Нет цели**, **Нет задач**, **Никто не назначен**.
- Russian counts need more than singular/plural: **1 задача**, **2 задачи**, **5 задач**, **11 задач**, **21 задача**, **22 задачи**, **0 задач**. Agreement changes too: **1 открытая задача**, **2 открытые задачи**, **5 открытых задач**. Fractions need their own handling, for example **1,5 дня**. Use the shared plural infrastructure; Russian has `one`, `few`, `many`, and `other` cardinal categories, not the Portuguese mapping. See [Unicode CLDR's Russian rules](https://www.unicode.org/cldr/charts/48/supplemental/language_plural_rules.html#ru).
- Distinguish grammatical gender from a person's gender. A role label such as **Ответственный** does not establish how to address its holder. Do not infer gender from names or append **(а)** to every event verb. Prefer gender-neutral attribution and passive phrasing where needed: **{{author}}: проект приостановлен.** Retain the actor when rephrasing.
- Agree status text with its object in sentences: **проект завершён**, **задача выполнена**, **цель достигнута**. Impersonal badge forms such as **Завершено** are standalone labels, not sentence fragments to append to every noun.
- Keep user-authored names, titles, statuses, units, and content unchanged. Place names after a label or keep resource titles in quotes: **Автор: {{name}}**, **в проекте «{{projectName}}»**. Do not programmatically decline names or attach endings to placeholders. Reorder complete translated phrases around rich-text tags without changing the tags themselves.

## Organization, people, and roles

Unlike the [Portuguese](pt-BR.md) and [German](de.md) choices, use Russian names for Champion and Reviewer. **Ответственный** states accountability more clearly than **Чемпион**; **Куратор** describes ongoing oversight and feedback without suggesting a literary reviewer or a mandatory approval gate. Keep these roles distinct from **Исполнитель** on a task, **Руководитель** in the org chart, and **Владелец** in company administration.

| English | Meaning/context | Русский | Capitalization and usage |
| --- | --- | --- | --- |
| company / organization | Organization using Operately | Компания | Use consistently for the product entity; do not alternate with Организация or Рабочее пространство. |
| account | Person's sign-in identity across companies | Учётная запись | Distinct from company membership and a billing **счёт**. Do not alternate with Аккаунт. |
| person / people | People directory or generic person | Человек / Люди | Do not label everyone Сотрудники: outside collaborators are also people in the product. |
| member / team member | Company or team membership | Участник / Участник команды | **Участник компании**, **участник пространства** where scope matters. Not necessarily an employee. |
| outside collaborator / guest | Person invited to specific work | Внешний участник | Also use for the internal guest type. Does not imply company-wide access, employment, or a customer relationship. |
| former member / deactivated member | Historical membership / disabled access | Бывший участник / Деактивированный участник | Deactivation and removal are different; access can be restored where supported. |
| manager | Person who manages another person | Руководитель | People-management relationship, not a project role or space administrator. |
| peers | People with the same manager | Коллеги с тем же руководителем | Preserve the shared-manager meaning; Коллеги alone is broader. |
| reports (people) / direct reports | People reporting directly to someone | Прямые подчинённые | Never Отчёты. In prose **сотрудники в прямом подчинении** can clarify the relationship. |
| title in company | Person's professional position | Должность | Content titles are **Название** or **Заголовок**; a product role is **Роль**. Preserve user-authored job titles. |
| responsibility | Contributor's assigned area of work | Зона ответственности | Not an access level or job title. |
| champion | Person accountable for a goal/project or KPI upkeep | Ответственный | **Ответственный за проект / за цель / за KPI**. Use **назначить ответственным**, not a transliterated чемпион. |
| reviewer | Person following progress, giving feedback, and confirming reading | Куратор | **Куратор проекта / цели**. Actual final-deliverable approval, where described by the source, still needs accurate wording; routine acknowledgement is not approval. |
| contributor | Person participating in project delivery | Участник проекта | Short **Участник** inside project context. Distinct from a task's Исполнитель; avoid Соавтор unless authorship is meant. |
| assignee / assignees / assigned to | Person or people assigned a task | Исполнитель / Исполнители | Field **Исполнители** when several can be assigned. Do not reuse Ответственный for every assignment. |
| unassigned / not assigned | Missing assignment | Не назначен | Agree with the role: **исполнитель не назначен**; generic empty state **Никто не назначен**. Unknown identity is a different state. |
| owner / account owner | Highest company access role | Владелец | **Владелец компании**. Existing company “account owner” copy refers to this role, not a separate personal-account ownership role. |
| goal owner / project owner | Descriptive reference to a Champion | Ответственный | Not Владелец: owning company access and accountability for work are different. |
| administrator / admin | Company administrative role | Администратор | Use the full word consistently instead of alternating with Админ. |
| space manager | Person administering a space | Администратор пространства | Distinct from Руководитель and Куратор; administering a space does not grant company administrator rights. |
| email / emails | Electronic mail or individual messages | Электронная почта / Письма | Address field **Электронная почта** or **Адрес электронной почты**; count messages as **1 письмо / 2 письма / 5 писем**, not почты. |

## Navigation and work structure

| English | Meaning/context | Русский | Capitalization and usage |
| --- | --- | --- | --- |
| home | Main navigation destination | Главная | Named navigation destination. |
| my work | Personal work destination | Моя работа | Includes goals, projects, and other work; do not narrow to Мои задачи. |
| review | Personal queue of work and reviews | На контроле | Includes writing reports, upcoming work, and reviewing others' updates. Avoid Согласования, which implies approval requests. Review as an action is **Проверить**. |
| work map | Overview of goals, projects, and their hierarchy | Карта целей и проектов | Keep the full scope; not Карта задач or a geographic map. |
| overview | Summary within a page | Обзор | Distinct from the named На контроле and Карта целей и проектов destinations. |
| org chart | Reporting hierarchy | Структура компании | Use consistently instead of alternating with Оргсхема or Органиграмма. |
| lobby / switch company | Company chooser / switching action | Выбор компании / Сменить компанию | Does not switch only a space. |
| company admin / company administration | Company management destination | Управление компанией | Distinct from instance-wide administration. |
| team & access | Named team and permission section | Команда и доступ | Use **и**, not an ampersand. |
| space | Shared area within a company | Пространство | **Пространства** in lists. Do not alternate with Воркспейс, Раздел, or company-level Рабочее пространство. |
| general space | Default company-wide space | Общее пространство | System-authored label only; do not translate or rename a stored space name. |
| project | Concrete delivery work | Проект | Distinct from Цель and Задача. |
| goal | Outcome being pursued | Цель | Plural **цели**; genitive plural **целей**. Not a numeric target value. |
| parent goal | Goal above another goal/project | Родительская цель | Use for the hierarchy, not Основная цель, which can imply priority. |
| subgoal | Goal below another goal | Подцель | One word. **Подцели и проекты** for the combined section. |
| top-level goal / company-wide goal | Hierarchy root / company scope | Цель верхнего уровня / Цель компании | A root goal does not necessarily have company-wide scope. |
| task | Unit of work | Задача | Prefer to Таск or Задание for this product object. |
| project task / space task | Task attached to a project or directly to a space | Задача проекта / Задача пространства | Not a subtask just because it belongs to a project. |
| milestone | Project delivery checkpoint | Веха | Plural **вехи**. A checkpoint, not a whole project phase (**этап**). |
| task list / board | Task views | Список задач / Доска | **Канбан-доска** when specifying the view type. |
| timeline (view) | Time-based visualization | Временная шкала | Not the project's schedule or a history of past events. |
| timeline (planning) / timeframe | Planned schedule / bounded date range | График / Период | **График проекта** versus **период цели**. Keep both distinct from Длительность. |
| template / project template | Reusable project structure | Шаблон / Шаблон проекта | Not Образец or Темплейт. |
| relative due date | Template date relative to project start | Срок относительно начала проекта | Explain with **через … дней после начала проекта**; not a completion timestamp. |
| next step | Next incomplete tracker item or upcoming milestone | Следующий шаг | Can be a target, checklist item, or milestone; do not automatically call it a task. |

## Progress reports and collaboration

Use **Отчёт о ходе работы** for a check-in and **Итоги** for the reflection at closure. These explain the content without requiring familiarity with “check-ins” or Scrum retrospectives. Reading confirmation, assessment, and approval remain separate actions.

| English | Meaning/context | Русский | Capitalization and usage |
| --- | --- | --- | --- |
| check-in | Recurring written progress report | Отчёт о ходе работы | Short **Отчёт** only where the reporting context is clear. Not Чекин, meeting attendance, or sign-in. |
| project check-in / goal progress update | Reports on a project or goal | Отчёт по проекту / Отчёт по цели | Same check-in object; goal progress update is not a separate workflow. |
| check in / submit check-in | Publish a progress report | Опубликовать отчёт | Weekly/monthly only when specified by the source. Publication is not submission for mandatory approval. |
| review check-in | Read and assess the report | Проверить отчёт | Does not automatically confirm reading or approve the result. |
| acknowledge | Explicitly confirm reading | Подтвердить прочтение | More direct than Принять к сведению. Not Одобрить, Согласовать, or simply viewing the page. |
| acknowledgement | Recorded reading confirmation | Подтверждение прочтения | Applies to reports and retrospectives. A reaction or notification read state is different. |
| acknowledged / not yet acknowledged | Reading-confirmation state | Прочтение подтверждено / Ожидает подтверждения прочтения | Do not shorten to Подтверждено if it could mean the content was approved. |
| approve / approval | Actual approval where explicitly described | Одобрить / Одобрение | **Приёмка результатов** for formal acceptance of deliverables when that is the source meaning. Not acknowledgement. |
| retrospective | Written reflection at goal/project closure | Итоги | **Итоги проекта / Итоги работы над целью**; **Подвести итоги** as an action. Plural agreement: **итоги опубликованы**. Not a separate retrospective meeting. |
| acknowledge retrospective | Confirm reading the closing reflection | Подтвердить прочтение итогов | Does not approve the project's outcome. |
| wins / obstacles / needs | Progress-report prompts | Достижения / Препятствия / Необходимая помощь | Avoid literal Победы or bureaucratic Потребности when asking what help is needed. |
| blockers | Problems preventing progress | Препятствия | Qualify as **препятствия, мешающие работе** when needed. Блокировка can instead imply an access restriction. |
| feedback | Response to progress or work | Обратная связь | Count individual responses as **комментарии** or **отзывы** when appropriate; no invented plural обратные связи. |
| discussion | Titled conversation with replies | Обсуждение | Distinct from a single comment. |
| post / message | Published contribution or communication | Сообщение | **Сообщение в обсуждении** where context is needed; avoid switching between Пост and Публикация for the same object. |
| update (posted content) | Generic progress/change report | Обновление | Prefer the specific **Отчёт** or **Запись показателя** when known. A software update is an **обновление приложения**. |
| update (verb) | Modify stored information | Обновить | Specific actions can use **Записать значение** or **Опубликовать отчёт**; do not use Апдейт. |
| activity / activity feed | Recorded actions | Действия / История действий | Use **Действия** for a feed heading; not Активность when this means specific events rather than an engagement measure. |
| Comments & Activity | Combined comments and events section | Комментарии и действия | Named section; keep **и**. |
| mention / direct mention | @ reference to a person | Упоминание / Прямое упоминание | **@-упоминание** when explaining the interaction. |
| notification | In-app or emailed notification | Уведомление | Not Сообщение interchangeably; a notification can point to a message. |
| mark as read / mark all read | Notification read-state actions | Отметить как прочитанное / Отметить всё как прочитанное | Does not confirm reading of the underlying report. |
| subscribe / unsubscribe | Receive/stop content notifications | Подписаться на уведомления / Отписаться от уведомлений | Name the object so it cannot be confused with a paid subscription. |
| subscribers / always notified | Notification subscribers / automatic recipients | Подписчики / Всегда получают уведомления | Not every recipient subscribed manually. Access and notification delivery are separate. |
| audience / people to notify | Intended notification recipients | Получатели / Кого уведомить | Does not change who can access the underlying content. |
| daily summary / assignments email | Digest / personal action email | Ежедневная сводка / Письмо с предстоящими делами | The latter includes tasks, reminders, and reviews; do not reduce it to task assignments. |
| batched notifications / batch window | Grouped delivery / grouping interval | Сгруппированные уведомления / Интервал группировки | A duration, unlike a chosen **время отправки**. |
| outstanding item | Review-page action needing attention | Незавершённый пункт | **1 незавершённый пункт / 2 незавершённых пункта / 5 незавершённых пунктов**. Not every item is a task. |

## Goals, measurements, and KPIs

Distinguish **Цель** (outcome), **Показатель** (its quantitative tracker), **Целевое значение** (the desired number), and **KPI** (the separate ongoing space metric). Do not impose OKR terminology such as Ключевой результат on every goal tracker.

| English | Meaning/context | Русский | Capitalization and usage |
| --- | --- | --- | --- |
| target / targets (goal item) | Named tracker with baseline, current value, and target value | Показатель / Показатели | Also use for older measure/measurement references to the whole tracker. Not another Цель. |
| target (numeric field) / target value | Desired numeric destination | Целевое значение | Distinct from the whole Показатель; **изменить целевое значение**. |
| start / starting from (numeric baseline) | Initial value | Начальное значение | Not Дата начала or Начать. |
| current value / new value | Recorded measurement | Текущее значение / Новое значение | Lower numbers can represent progress too; do not equate improvement with growth. |
| progress | Advancement toward the outcome | Прогресс | **Прогресс по цели / проекту**. Not a workflow status or elapsed time alone. |
| checklist | Qualitative/binary tracker | Чек-лист | Hyphenated; plural **чек-листы**. Not a separate task list. |
| check / checklist item | Individual checklist entry | Пункт чек-листа | Action **Отметить как выполненный**, reversal **Снять отметку**. Check as an assessment is **Проверить**. |
| KPI / KPIs | Ongoing space metric | KPI | Keep Latin uppercase, unchanged in plural. Explain as **ключевой показатель эффективности**; KPI records do not have goal-target fields. |
| cadence | Recording/update frequency | Периодичность | **Еженедельно / Ежемесячно**. Not Каденция or a payment period. |
| log update / record update (KPI) | Record a value for a date | Записать значение | A **запись показателя**, not a check-in. History heading **Записанные значения**. |
| annotation / note | Chart event marker / supporting text | Примечание / Заметка | Keep dated chart annotations distinct from comments and a value's optional note. |
| period (KPI) | Period/date represented by a record | Период | Use **Дата** for a single-date field; do not imply a range the form does not collect. |
| history / previous values | Historical data / edited values | История / Предыдущие значения | **История значений** versus **История изменений**; prior edits need not be earlier measurement periods. |

## Status, lifecycle, and dates

Translate system statuses according to their meaning; keep user-authored statuses unchanged. Badge forms below are standalone labels. In prose, use the appropriate noun and agreement rather than concatenating a badge label.

| English | Meaning/context | Русский | Capitalization and usage |
| --- | --- | --- | --- |
| status / task status | Health/workflow field | Статус / Статус задачи | Plural **статусы**, not Состояние interchangeably. |
| on track | Progressing as planned | По плану | Not merely within the deadline. |
| caution / needs attention (health) | Emerging risks or delays | Под угрозой | Yellow health state. A generic caution notice is **Внимание**, not automatically Под угрозой. |
| off track | Serious problems affecting success | Критично | Red health state. Broader than Отстаёт: problems can concern results, not only timing. |
| pending / not started (work) | Work has not begun | Не начато | Sentence **работа ещё не начата**. Pending invitations or confirmations use **Ожидает…**, not this work state. |
| in progress | Work actively underway | В работе | Separate from the health assessment. |
| paused | Temporarily stopped work | Приостановлено | **Проект приостановлен**, **цель приостановлена** in sentences. Not canceled or finished. |
| outdated | Progress information is stale | Данные устарели | Does not imply that the work itself is overdue. |
| achieved / accomplished | Goal outcome attained | Достигнута | Feminine, referring to **цель**; **цель достигнута**. Not generic completion. |
| missed / not accomplished | Goal outcome not attained | Не достигнута | Not Пропущена, which suggests a missed event. |
| completed (project/milestone) | Work finished | Завершено | In sentences **проект завершён / веха завершена**. Does not prove the goal was achieved or every task was done. |
| done / completed (task/checklist) | Task/checklist work finished | Выполнено | **Задача выполнена / пункт выполнен**. Distinct from canceling the work. |
| open / closed (task status category) | Categories keeping work open or ending it | Открытые / Закрытые | Category labels for statuses. Closed can include canceled; do not translate all closed statuses as Выполнено. |
| canceled (task) | Work intentionally abandoned | Отменено | **Задача отменена** in prose. Distinct from Приостановлено. |
| close goal / close project | End active work | Закрыть цель / Завершить проект | Outcome-neutral; an unsuccessful goal can be closed. **Проверить и закрыть цель** for Review & Close Goal. |
| reopen | Make closed work active again | Открыть снова | **Снова открыть цель**. Distinct from restoring archived content. |
| pause / resume | Temporarily stop/restart work | Приостановить / Возобновить | Keep these verbs consistent in page actions, feed entries, and emails. |
| archive / unarchive | Remove from/return to active views | Архивировать / Вернуть из архива | State **В архиве**. Retains content; not deletion or proof of successful completion. |
| delete / remove / unlink | Delete content / remove a relationship | Удалить / Убрать / Удалить связь | **Удалить навсегда** for permanent deletion; **убрать из проекта** preserves the relationship's scope. |
| due date | Planned completion deadline | Срок выполнения | Short field **Срок** where context is clear; `Срок: <date/>` in dated labels. Never Дата завершения for a planned deadline. |
| overdue | Deadline has passed | Просрочено | Use for date-based badges and reminders. In prose **задача просрочена на 2 дня**. Do not soften to Задерживается; separate from project health. |
| delayed / running late | Work is delayed; the final deadline may still be ahead | Задерживается | In prose **выполнение задачи задерживается**. Use when the source describes a delay, not as an alternative for overdue or the broader Критично health state. |
| completed date / completed on | Actual completion | Дата завершения / Завершено | Agree with the object in sentences; a task can use **Дата выполнения**. Planned beginning is **Дата начала**. |
| schedule (publication) | Select a future publishing time | Запланировать публикацию | State **Публикация запланирована**; distinct from **Опубликовать сейчас**. |

## Documents and content

| English | Meaning/context | Русский | Capitalization and usage |
| --- | --- | --- | --- |
| Docs & Files / Documents & Files | Named content tool | Документы и файлы | Same name for both variants. Never expose the internal Resource Hub name. |
| document / doc | Rich-text document | Документ | Distinct from an uploaded **файл**, a **папка**, a **ссылка**, or a comment **вложение**. |
| resource / item | Generic content entry | Материал / Элемент | Prefer the specific type when known. Resources here are not personnel or computing capacity. |
| key resource / support material | Supporting project/goal content | Важный материал / Вспомогательный материал | Can be a link as well as a document or file. |
| draft / save as draft / discard draft | Unpublished content and its lifecycle | Черновик / Сохранить черновик / Удалить черновик | Removing the draft is distinct from **Отмена** in a dialog. |
| publish / published | Make content available to its audience | Опубликовать / Опубликовано | Publication does not necessarily grant internet-wide access. |
| public sharing | Allow public-link access | Публичный доступ | **Включить / отключить публичный доступ**. Separate from publishing a draft. |
| version / version history | Saved revision / revision list | Версия / История версий | Restore action **Восстановить эту версию**; not a promise to erase later history. |
| duplicate / create copy | Create another content item | Создать копию | Clipboard action is **Копировать**; distinguish it from duplicating a document or template. |

## Access and account terminology

| English | Meaning/context | Русский | Capitalization and usage |
| --- | --- | --- | --- |
| access / access level / permissions | Access and allowed operations | Доступ / Уровень доступа / Права доступа | Distinct from the person's delivery role. |
| full access | Highest item access level | Полный доступ | Does not automatically grant company ownership. |
| edit access | Permission to modify content | Редактирование | Use **Доступ на редактирование** in explanatory prose; does not imply managing permissions. |
| comment access | Permission to view and comment | Комментирование | Not content editing. |
| view access / read-only | Read without modifying | Только просмотр / Только чтение | **Только просмотр** in content-sharing controls; **Только чтение** for a restricted company or API token. |
| general access | Broad membership/public access settings | Общий доступ | Different from the default Общее пространство. |
| company-wide / space-wide access | Access through membership | Доступ для участников компании / пространства | Spell out membership; company-wide does not mean public internet access. |
| direct access | Access granted individually | Прямой доступ | Different from inherited company/space membership. |
| public access / anyone with the link | Internet/public-link audience | Публичный доступ / Все, у кого есть ссылка | An unlisted link is still public access; do not call it private. |
| invite-only | Only explicitly invited people can access | Только по приглашению | Does not mean the invitation has been accepted. |
| privacy / privacy settings | Who can see this work | Видимость / Настройки видимости | Конфиденциальность is appropriate for a privacy policy, not this visibility picker. |
| grant access / remove access | Give/withdraw permissions | Предоставить доступ / Отозвать доступ | Withdrawing access does not delete the person's account. |
| trusted email domains | Allowed joining domains | Доверенные почтовые домены | Preserve the actual domains; not every address at a domain is an existing member. |
| deactivate / reactivate account | Disable/restore access in the stated scope | Деактивировать / Восстановить доступ | If only company membership is affected, state that scope; do not imply global account deletion. |
| sign in / sign out / sign up | Authentication and registration | Войти / Выйти / Зарегистрироваться | Distinct from a report check-in and notification subscription. |
| verification code / activation code | Email verification | Код подтверждения / Код активации | A six-character code is **код из шести символов**, not necessarily six digits. |
| API token / API key | Programmatic credentials | API-токен / API-ключ | Keep token and key distinct; access revocation is **Отозвать**, deletion **Удалить**. |
| MCP connection / connected client | External AI client connection | MCP-подключение / Подключённый клиент | Client is software here, not a customer. Consent action **Разрешить доступ**. |

## Billing and administration

| English | Meaning/context | Русский | Capitalization and usage |
| --- | --- | --- | --- |
| billing | Company payment management | Оплата | Named settings section; use **платёжные данные** for billing details, not Учётная запись or Счёт for the entire section. |
| plan (billing) | Pricing/service tier | Тариф | A work plan is **План**. Preserve supplied branded tariff names; generic free/paid is **бесплатный / платный тариф**. |
| subscription (paid) | Paid service subscription | Подписка | Qualify as **платная подписка** when it could be confused with notifications. |
| billing cycle / billing period | Recurrence / current paid interval | Периодичность оплаты / Расчётный период | Frequency and the dates of a particular period are different. |
| checkout / continue to checkout | Payment flow | Оформление оплаты / Перейти к оплате | Does not say payment is already complete. |
| upgrade / downgrade | Move to a higher/lower tier | Перейти на более высокий / более низкий тариф | Avoid Улучшить план or Понизить учётную запись. |
| cancel plan / cancellation scheduled | End the subscription / future end arranged | Отменить подписку / Отмена подписки запланирована | Preserve the effective date. **Отписаться от уведомлений** stops content notifications; **Отмена** exits a dialog. |
| member limit / storage limit | Capacity included in the plan | Лимит участников / Лимит хранилища | Not Штат or job positions; these are product usage limits. |
| package / ZIP file | Import/export artifact | Пакет данных / ZIP-архив | Not a pricing tariff. |
| site admin / SaaS admin panel | Instance-wide operator role/screen | Администратор системы / Управление системой | Distinct from company or space administration. |
| support session / support mode | Operator access for customer assistance | Сеанс поддержки / Режим поддержки | Does not make the operator the account owner. |
| feature flag | Experimental-feature control | Переключатель функции | Group **Экспериментальные функции**; preserve keys such as `i18n`. |
| site message / update badge | Operator banner / new-version indicator | Системное сообщение / Уведомление о новой версии | Neither is a progress report. |

## Context and sentence patterns

Shared English words such as **Target**, **Start**, **Review**, **Update**, **Close**, **Reports**, **Title**, and **Plan** need their contextual meanings above. If a shared source key cannot express both Russian meanings or the necessary grammatical agreement, add translation context or specific source wording during implementation. Do not force one Russian form into every use.

These examples illustrate natural case agreement and attribution without changing user-authored names. Preserve the actual source placeholders, actors, and rich-text tags.

| Situation | Russian pattern |
| --- | --- |
| Gender-neutral event attribution | **{{author}}: проект «{{projectName}}» приостановлен.** |
| Reading confirmation without approval | **{{author}}: прочтение отчёта подтверждено.** |
| Explain the acknowledgement action | **Вы подтверждаете, что прочитали отчёт.** |
| Role assignment with an unchanged name | **Роль «Куратор» назначена. Участник: {{personName}}. Автор изменения: {{author}}.** |
| Separate closure from success | **Цель закрыта. Результат: не достигнута.** |
| Count after a preposition | **Просрочено на 1 день / на 2 дня / на 5 дней.** |

## Research references

Official Russian pages consulted on 2026-10-08 for familiar product terminology.

| Reference | Terminology observed |
| --- | --- |
| [Asana: project progress and status](https://asana.com/ru/guide/help/projects/progress) | **Вехи**, **Цели**, **Срок выполнения**, **По плану**, **Под угрозой**, **Отстаёт**. |
| [Asana: status-report guidance](https://asana.com/ru/resources/how-project-status-reports) | Report terminology for written progress updates. |
| [Wrike: project scheduling](https://www.wrike.com/ru/templates/project-scheduling/), [Asana: Gantt charts](https://asana.com/ru/resources/gantt-chart-basics) | **Просроченные задачи** (Wrike); **задерживается** for delays that may affect a later deadline (Asana). |
| [monday.com: workdocs](https://monday.com/lang/ru/docsmobile), [Russian product page](https://monday.com/lang/ru) | **Чек-лист**, **Комментарии**, **Итоги совещаний**, **Тариф**. |
| [Wrike: work items](https://help.wrike.com/hc/ru/articles/6900556197015-%D0%9F%D0%BB%D0%B0%D0%BD-Team-%D0%9F%D0%BE%D0%BD%D1%8F%D1%82%D0%B8%D0%B5-%D0%BE-%D1%80%D0%B0%D0%B1%D0%BE%D1%87%D0%B8%D1%85-%D0%BE%D0%B1%D1%8A%D0%B5%D0%BA%D1%82%D0%B0%D1%85) | **Пространства**, **Проекты**, **Задачи**, space administrators. |
| [Kaiten: people and dates on task cards](https://kaiten.ru/blog/card-facade/) | **Исполнитель**, **Ответственный**, **Участники**. |
