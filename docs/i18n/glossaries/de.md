# German glossary

Locale: `de` (Gettext: `de`). Use standard German spelling as used in Germany, avoiding regional idioms. Apply these terms consistently in the UI, activity feeds, emails, exports, and documentation. See the [internationalization guide](../../internationalization.md) for the translation workflow.

## German usage

- Address the user with **du**, **dir**, **dich**, **dein**, lowercase except at the start of a sentence. Use the same voice in onboarding, errors, billing, and emails.
- Use German sentence casing: **Übergeordnetes Ziel**, not English title case. Use infinitives for actions (**Projekt erstellen**) and direct imperatives for instructions (**Wähle einen Arbeitsbereich aus.**).
- Prefer neutral people terms such as **Person**, **Mitglied**, **Führungskraft**, and **Mitwirkende**. Treat retained role names as labels: **Person mit der Rolle „Reviewer“**. Do not infer gender from names.
- Use German compounds and spelling: **Projektvorlage**, **Messgröße**, **Lesebestätigung**, **Check-in-Erinnerung**, **E-Mail-Adresse**, **API-Token**, **MCP-Verbindung**. Preserve umlauts and **ß**. Use **und** in prose and **&** only in the named sections below.
- Inflect complete sentences rather than joining translated fragments: **im Arbeitsbereich**, **für das Ziel**, **mit den Mitgliedern**. Counts also affect adjective endings: **1 offener Eintrag**, **2 offene Einträge**, **keine offenen Einträge**. Articles and plural forms in the tables are guidance, not part of every label.
- Keep user-authored names, titles, status labels, units, and content unchanged. Use **das Projekt „{{name}}“** or **von {{name}}** to avoid attaching case endings or English possessives to names. Preserve product/protocol names and technical identifiers.

## Organization, people, and roles

Retain **Champion** and **Reviewer**, as in the [Portuguese glossary](pt-BR.md), and explain their responsibilities in German. **Projektleitung** does not cover goal and KPI ownership; **Prüfer**, **Gutachter**, and **Genehmiger** suggest an audit or approval gate. These are product roles, distinct from company ownership, people management, and task assignment.

| English | Meaning/context | Deutsch | Capitalization and usage |
| --- | --- | --- | --- |
| company / organization | Organization using Operately | Unternehmen | **das Unternehmen / die Unternehmen**. Use consistently instead of alternating with Firma, Organisation, or Workspace. |
| account | Person's sign-in identity across companies | Konto | **das Konto / die Konten**. Distinct from Unternehmen and company membership. |
| person / people | People directory or a generic person | Person / Personen | **die Person / die Personen**. Directory label **Personen**; not all people shown are employees or company members. |
| member | Company or space membership | Mitglied | **das Mitglied / die Mitglieder**; compounds **Unternehmensmitglied**, **Mitglied des Arbeitsbereichs**. |
| team member | Member of the internal team | Teammitglied | **das Teammitglied / die Teammitglieder**. Do not use for every outside collaborator. |
| outside collaborator | Person invited to specific work without internal member access | Externe Person | **die externe Person / die externen Personen**. Also use for the internal guest type. Do not imply employment or company-wide membership. |
| former member | Historical person who no longer belongs to the company | Ehemaliges Mitglied | Plural **ehemalige Mitglieder**. Distinct from **deaktiviertes Mitglied**, whose access can be restored. |
| manager | Person who manages another person | Führungskraft | **die Führungskraft / die Führungskräfte**. Distinct from space management and project roles. |
| peers | People with the same manager | Personen mit derselben Führungskraft | Use this precise phrase, including section headings; **Teammitglieder** alone loses the reporting relationship. |
| reports (people) / direct reports | People managed directly by someone | Direkt unterstellte Personen | Singular **direkt unterstellte Person**. Reports as documents are **Berichte**; avoid the noun Untergebene for people. |
| title in company | Person's professional position | Position im Unternehmen | Short field **Position**. Distinct from a document title and an access role. Preserve user-authored job titles. |
| responsibility | Description of a contributor's work | Verantwortungsbereich | **der Verantwortungsbereich / die Verantwortungsbereiche**. Free text is user content. |
| champion | Accountable person for a goal/project; responsible person for a KPI | Champion | Retained label, plural **Champions**; **Projekt-Champion / Ziel-Champion / KPI-Champion**. Explain responsibility for delivery or upkeep in German. |
| reviewer | Person who reviews progress and confirms reading | Reviewer | Retained label, plural **Reviewer**; **Projekt-Reviewer / Ziel-Reviewer**. Final deliverable approval is mentioned in project-role guidance; preserve that meaning there without treating check-in acknowledgement as approval. |
| contributor | Person participating in project delivery | Mitwirkende Person | Singular with article **die mitwirkende Person**; group heading **Mitwirkende**. Distinct from a task assignment. |
| assignee / assignees / assigned to | Task assignment field | Zugewiesen an | Person picker and list label. In prose **zugewiesene Person / zugewiesene Personen**. Tasks may have multiple assignees. |
| unassigned / not assigned | Missing task assignment or product role | Nicht zugewiesen | Do not use **Unbekannt**, which means the identity is unavailable. |
| owner / account owner | Highest company access role | Inhaber | Role label, plural **Inhaber**; prose **Person mit Inhaberrechten**. In company administration, “account owner” means this company role. |
| goal owner / project owner | Descriptive reference to a Champion | Champion | Use the product role or **verantwortliche Person** in its explanation. Never turn this into the company role Inhaber. |
| administrator / admin | Company administrative role | Admin | **Admin / Admins**, **Adminrechte**. In sentences use **Person mit Adminrechten** when needed. |
| space manager | Person administering a space | Arbeitsbereichsverwaltung | Role/group label; prose **Person, die den Arbeitsbereich verwaltet**. Not Führungskraft. |
| email / emails | Electronic mail | E-Mail / E-Mails | **die E-Mail / die E-Mails**. Address field **E-Mail-Adresse**; work email **geschäftliche E-Mail-Adresse**. |

## Navigation and work structure

| English | Meaning/context | Deutsch | Capitalization and usage |
| --- | --- | --- | --- |
| home | Main navigation destination | Startseite | Named navigation destination. |
| my work | Personal work destination | Meine Arbeit | Includes more than tasks. |
| review | Navigation destination and routine review of work | Durchsicht | **die Durchsicht**. The page includes writing updates, upcoming work, and reviewing others’ work, so avoid Freigaben. As a verb use **Prüfen**. |
| work map | Overview of goals/projects and their relationships | Arbeitsübersicht | **die Arbeitsübersicht**; **Arbeitsübersicht des Unternehmens**. Covers goals and projects, not just a task board. |
| overview | Summary within a page | Übersicht | Distinct from the named Arbeitsübersicht destination. |
| org chart | Reporting hierarchy | Organigramm | **das Organigramm / die Organigramme**. |
| lobby / switch company | Company selection destination/action | Unternehmensauswahl / Unternehmen wechseln | Lobby is a chooser, not an Arbeitsbereich. |
| company admin / company administration | Company settings and management | Unternehmensverwaltung | Distinct from instance-wide administration. |
| team & access | Team and permission management section | Team & Zugriff | Named section. |
| space | Shared area within a company | Arbeitsbereich | **der Arbeitsbereich / die Arbeitsbereiche**. Not a room, company, project, or team itself. |
| general space | Default company-wide space | Allgemeiner Arbeitsbereich | Use only for system-authored labels/descriptions; do not rewrite the stored space name. |
| project | Concrete work with deliverables | Projekt | **das Projekt / die Projekte**. Use consistently in compound terms such as **Projektvorlage**. |
| goal | Outcome being pursued | Ziel | **das Ziel / die Ziele**. Distinct from the numeric **Zielwert**; section **Ziele & Projekte**. |
| parent goal | Goal above another goal/project | Übergeordnetes Ziel | **das übergeordnete Ziel / die übergeordneten Ziele**. Avoid literal *Elternziel*. |
| subgoal | Goal below another goal | Teilziel | **das Teilziel / die Teilziele**. Do not alternate with Unterziel; section **Teilziele & Projekte**. |
| top-level goal | Goal without a parent | Oberstes Ziel | Plural **oberste Ziele**. Does not necessarily mean a company-wide goal. |
| company-wide goal | Goal at company scope | Unternehmensweites Ziel | Describes scope, not hierarchy or unrestricted internet access. |
| task | Unit of work | Aufgabe | **die Aufgabe / die Aufgaben**. Avoid alternating with *Task* or *To-do*. |
| project task / space task | Task attached to a project or directly to a space | Projektaufgabe / Aufgabe im Arbeitsbereich | Not a subtask merely because it belongs to a project. |
| milestone | Project delivery checkpoint | Meilenstein | **der Meilenstein / die Meilensteine**. Unattached tasks: **Aufgaben ohne Meilenstein**. |
| task list / board | Task view | Aufgabenliste / Board | **die Aufgabenliste / die Aufgabenlisten**; **das Board / die Boards**. Use **Kanban-Board** when the board type matters. |
| list / timeline (view) | Work presentation mode | Liste / Zeitleiste | **Listenansicht / Zeitleistenansicht** in prose about views. |
| timeline (project planning) / timeframe | Planned span of work | Zeitplan / Zeitraum | **Zeitplan** for project scheduling; **Zeitraum** for a start/end interval. Neither means actual duration already worked. |
| template / project template | Reusable project structure | Vorlage / Projektvorlage | **die Vorlage / die Vorlagen**. Do not keep English *Template*. |
| relative due date | Template date relative to project start | Relatives Fälligkeitsdatum | Explain with **Tage nach Projektbeginn**. No actual completion date is implied. |
| next step | Next incomplete target/checklist item or upcoming milestone | Nächster Schritt | Not always an Aufgabe; the Work Map combines several types. |

## Check-ins and collaboration

Reading confirmation, review, and approval are separate actions. Keep these distinctions in buttons, activity feeds, and emails.

| English | Meaning/context | Deutsch | Capitalization and usage |
| --- | --- | --- | --- |
| check-in | Recurring written progress report | Check-in | **der Check-in / die Check-ins**. A recurring written progress update, not a meeting or sign-in. **Projekt-Check-in / Ziel-Check-in** where qualification is needed. |
| goal progress update | Goal check-in, including Review assignments | Ziel-Check-in | Same object as goal check-in; do not invent a second workflow. |
| check in / submit check-in / post check-in | Publish a check-in | Check-in veröffentlichen | Not **Anmelden** or **Einchecken**. Qualify with weekly/monthly only when the source does. |
| review check-in | Read and assess progress | Check-in prüfen | Does not itself confirm reading or approve outcomes. |
| acknowledge | Explicitly confirm reading | Als gelesen bestätigen | Explicit reading confirmation, not approval, agreement, or merely opening the page. Prefer this plain action to anerkennen, quittieren, or Kenntnisnahme bestätigen. |
| acknowledgement | Recorded confirmation of reading | Lesebestätigung | **die Lesebestätigung / die Lesebestätigungen**. Applies to check-ins and retrospectives; a reaction does not count as one. |
| acknowledged / not yet acknowledged | Reading-confirmation state | Als gelesen bestätigt / Lesebestätigung ausstehend | With a name: **Als gelesen bestätigt von {{name}}**. Never Genehmigt or Akzeptiert. |
| approve / approval | Actual approval of a result where explicitly described | Genehmigen / Genehmigung | For final deliverables **Abnehmen / Abnahme** is appropriate. Never use either for acknowledgement. |
| retrospective | Written reflection at closure | Rückblick | **der Rückblick / die Rückblicke**; **Projektrückblick / Zielrückblick**. Accessible outside Scrum teams; do not alternate with Retrospektive or Abschlussbericht. |
| wins / obstacles / needs | Prompts for a progress report | Erfolge / Hindernisse / Unterstützungsbedarf | Use **Hindernisse, die die Arbeit blockieren** when explaining blockers. Avoid literal Gewinne or vague Bedürfnisse. |
| feedback | Response on work or progress | Feedback | **das Feedback**, normally no plural; use **Rückmeldungen** for individually counted responses. |
| discussion | Standalone conversation with a title and replies | Diskussion | **die Diskussion / die Diskussionen**. Not synonymous with a comment. |
| post / message (discussion content) | Published contribution to a discussion/space | Beitrag | **der Beitrag / die Beiträge**. Use **Nachricht** for a direct system communication instead. |
| update (posted content) | Generic shared progress/change report | Update | **das Update / die Updates**. Use the specific object name when it is a Check-in or KPI entry. |
| update (verb) | Change stored information | Aktualisieren | Do not use **Update** as a German verb. A specific action such as **Wert erfassen** may be clearer. |
| activity / recent activity | Recorded system events | Aktivität / Letzte Aktivitäten | **die Aktivität / die Aktivitäten**. Feed heading **Aktivitäten**; explanatory noun **Aktivitätsverlauf**. |
| Comments & Activity | Combined comments and event section | Kommentare & Aktivitäten | Named section. |
| mention / direct mention | Reference to a person with @ | Erwähnung / Direkte Erwähnung | **die Erwähnung / die Erwähnungen**; **@-Erwähnung** when explaining the interaction. |
| notification | In-app or emailed notification | Benachrichtigung | **die Benachrichtigung / die Benachrichtigungen**. Not **Mitteilung** interchangeably. |
| mark as read / mark all read | Notification read state | Als gelesen markieren / Alle als gelesen markieren | Does not acknowledge the underlying check-in. |
| subscribe / unsubscribe | Receive or stop content notifications | Benachrichtigungen abonnieren / Benachrichtigungen abbestellen | Qualify the object; **Kündigen** is reserved for paid subscriptions. |
| subscribers | People receiving content notifications | Benachrichtigte Personen | Long form **Personen, die Benachrichtigungen abonniert haben**. **Wird immer benachrichtigt** for automatic recipients, who may not have subscribed manually. |
| audience / people to notify | Intended recipients for a post | Empfängerkreis / Zu benachrichtigende Personen | Notification recipients and people with access are different concepts. |
| daily summary / digest | Summary email | Tageszusammenfassung / Zusammenfassung | Do not call every email a Check-in. |
| assignments email | Personal action/reminder email | E-Mail mit anstehenden Aufgaben | Includes **Aufgaben, Erinnerungen und ausstehende Durchsichten**, not only task assignments. |
| batched notifications | Notifications grouped before delivery | Gebündelte Benachrichtigungen | Not **gestapelt**. |
| batch window / delivery time | Grouping interval / chosen send time | Bündelungszeitraum / Versandzeit | Distinguish an interval from a clock time. |
| outstanding item | Review-page action still needing attention | Offener Eintrag | **der offene Eintrag / die offenen Einträge**. Can be a task, milestone, check-in, KPI update, or review; do not narrow to Aufgaben. |

## Goals, measurements, and KPIs

Distinguish the desired outcome (**Ziel**), its quantitative tracker (**Messgröße**), the desired number (**Zielwert**), and an ongoing metric (**KPI**).

| English | Meaning/context | Deutsch | Capitalization and usage |
| --- | --- | --- | --- |
| target / targets (goal item) | Named quantitative tracker within a goal | Messgröße / Messgrößen | **die Messgröße / die Messgrößen**. Also use for older “measure/measurement” references to this object. Not Key Result or KPI: the app does not require OKRs. |
| target (numeric field) / target value | Desired value of a goal tracker | Zielwert | **der Zielwert / die Zielwerte**. Not the goal itself or the whole Messgröße. |
| start / starting from (numeric baseline) | Initial numeric value | Ausgangswert | **der Ausgangswert / die Ausgangswerte**. Not a start date. |
| current value / new value | Recorded value before/after editing | Aktueller Wert / Neuer Wert | **der Wert / die Werte**. Decreasing values can also be progress; do not assume increases are always good. |
| measurement (recorded observation) | A numeric observation | Messwert | **der Messwert / die Messwerte**. Distinct from the definition of the tracker. |
| progress | Advancement toward the outcome | Fortschritt | Usually singular; **Zielfortschritt / Projektfortschritt** where qualified. Not task status alone. |
| checklist | Qualitative/binary goal tracker | Checkliste | **die Checkliste / die Checklisten**. |
| check / checklist item | Individually checked goal item | Checklistenpunkt | **der Checklistenpunkt / die Checklistenpunkte**. Action **Abhaken**, reversal **Markierung aufheben**; a Check-in is a different object. |
| KPI / KPIs | Ongoing metric within a space | KPI / KPIs | **die KPI / die KPIs** (Kennzahl). Explain as **Kennzahl**; retain KPI in feature labels. Unlike goal targets, KPI entries do not have target-value fields. |
| cadence | KPI recording or update frequency | Rhythmus | **der Rhythmus**; **wöchentlich / monatlich**. Do not use **Kadenz**. |
| log update / record update (KPI) | Record a value for a date | Wert erfassen | History heading **Erfasste Werte**; attribution **Erfasst von**. Numeric recording, not Check-in publication. |
| annotation | Dated explanatory marker on a KPI chart | Anmerkung | **die Anmerkung / die Anmerkungen**. Distinct from a comment or **Notiz** attached to a recorded value. |
| period (KPI) | Date/period represented by a KPI record | Zeitraum | When the UI actually labels a single date, use **Datum**. Never silently turn it into a date range. |
| history / trend line | Past values / chart line showing their evolution | Verlauf / Trendlinie | **KPI-Verlauf** for values; **Änderungsverlauf** for edits. **Vorherige Werte** in an edit history need not represent earlier measurement dates. |

## Status, lifecycle, and dates

Keep goal health, task workflow, completion, and publication states distinct. Translate system defaults; preserve user-authored status names.

| English | Meaning/context | Deutsch | Capitalization and usage |
| --- | --- | --- | --- |
| status / task status | Progress/workflow label | Status / Aufgabenstatus | **der Status**; plural also **Status**. Prefer **Statusoptionen** when a plural label would be unclear. |
| on track | Work progressing as planned | Planmäßig | Does not merely mean “not overdue.” |
| caution / needs attention (goal health) | Emerging risks or delays | Gefährdet | The yellow health state; not a generic warning heading. |
| off track | Serious problems affecting success | Kritisch | Red health state; not automatically **Verspätet** or **Blockiert**. |
| pending / not started (work) | Work has not begun | Noch nicht begonnen | Work state only. Pending invitations, payments, and confirmations are **Ausstehend**. |
| in progress | Work actively underway | In Bearbeitung | Workflow state, not a health assessment. |
| paused | Work deliberately stopped temporarily | Pausiert | Temporary stop. **Aktiv** is availability; **In Bearbeitung** means work is underway. |
| outdated | Progress information is stale | Nicht aktuell | Does not prove the underlying goal is late or failing. |
| achieved / accomplished | Goal outcome attained | Erreicht | **Ziel erreicht**. Not the generic closed state. |
| missed / not accomplished | Goal outcome not attained | Nicht erreicht | **Ziel nicht erreicht**. Avoid **Verpasst**, which suggests a missed appointment. |
| completed (project/milestone) | Work finished | Abgeschlossen | Does not imply the goal was achieved or every task was done: completing a milestone can move or cancel open tasks. |
| done / completed (task/checklist) | Task or checklist work finished | Erledigt | **Als erledigt markieren**. Keep task workflow labels distinct from project closure. |
| open / closed (task status category) | Status category that keeps work open or ends it | Offen / Geschlossen | Closed includes canceled statuses; do not translate every closed status as **Erledigt**. |
| canceled (task) | Work intentionally abandoned | Abgebrochen | Not **Gekündigt**, reserved for subscriptions. |
| close goal/project | End active work and record the conclusion | Ziel abschließen / Projekt abschließen | Outcome-neutral; assess success separately. **Ziel prüfen und abschließen** for Review & Close. A dialog closes with **Schließen**. |
| reopen | Make closed work active again | Wieder öffnen | **Ziel wieder öffnen / Meilenstein wieder öffnen**. Distinct from restoring archived content. |
| pause / resume project | Stop/restart active project work | Projekt pausieren / Projekt fortsetzen | Preserve notification and associated-task effects described by the source. |
| archive / unarchive | Move out of / return to active views | Archivieren / Aus dem Archiv wiederherstellen | State **Archiviert**. Content is retained; it need not be completed. General restore action **Wiederherstellen**. |
| delete / delete forever | Remove content, permanently where specified | Löschen / Endgültig löschen | Do not use **Entfernen** to soften permanent deletion. |
| remove / unlink | Remove a relationship or link | Entfernen / Verknüpfung entfernen | Name the object or relationship. Not a promise to delete the underlying content. |
| due date | Planned completion deadline | Fälligkeitsdatum | **das Fälligkeitsdatum / die Fälligkeitsdaten**. Dated phrase **Fällig am**. Unlike the Portuguese choice, keep the German planned deadline distinct from Abschlussdatum. |
| overdue | Deadline has passed | Überfällig | **Seit 1 Tag überfällig / Seit 3 Tagen überfällig**. Distinct from a red health status. |
| completed on / completed date | Actual completion | Abgeschlossen am / Abschlussdatum | Actual completion, not the deadline. For tasks **Erledigt am**; planned beginning **Startdatum**. |
| schedule (publication) | Choose a future publication time | Veröffentlichung planen | State **Geplant**, dated phrase **Geplant für**. Distinct from **Jetzt veröffentlichen**. |

## Documents and content

| English | Meaning/context | Deutsch | Capitalization and usage |
| --- | --- | --- | --- |
| Docs & Files / Documents & Files | Named content tool | Dokumente & Dateien | Same name for both English variants. Do not expose the internal **Resource Hub** name. |
| document / doc | Rich-text document | Dokument | **das Dokument / die Dokumente**, distinct from an uploaded **Datei**. Related item types: **Ordner**, **Link**, **Anhang**. |
| resource / item (content collection) | Generic entry in Docs & Files | Inhalt / Eintrag | Prefer the specific item type when known; avoid a literal translation of internal Resource Hub terminology. |
| key resource / support material | Important supporting project/goal content | Wichtige Unterlage / Begleitmaterial | A resource can also be a link; do not imply it is always an uploaded file. |
| draft / drafts | Unpublished content | Entwurf / Entwürfe | **der Entwurf / die Entwürfe**. |
| save as draft / discard draft | Retain / remove unpublished content | Als Entwurf speichern / Entwurf verwerfen | Discard is distinct from canceling a dialog. |
| publish / published | Make a document/post available to its audience | Veröffentlichen / Veröffentlicht | Does not automatically mean public internet access. |
| public sharing | Allow access through a public link | Öffentliche Freigabe | **Öffentliche Freigabe aktivieren / deaktivieren**. Distinguish from publication. |
| version / version history | Saved revision / list of revisions | Version / Versionsverlauf | **die Version / die Versionen**. |
| duplicate / create copy | Create another content item | Duplizieren / Kopie erstellen | Distinct from **Kopieren** to the clipboard. |

## Access and account terminology

| English | Meaning/context | Deutsch | Capitalization and usage |
| --- | --- | --- | --- |
| access / access level | Ability/scope to access an item | Zugriff / Zugriffsstufe | **der Zugriff**; **die Zugriffsstufe / die Zugriffsstufen**. |
| permission / permissions | Allowed actions | Berechtigung / Berechtigungen | Do not merge with the person's product role. |
| full access | Highest item access level | Vollzugriff | Includes item administration where specified; does not itself mean company ownership. |
| edit access | Permission to modify content | Bearbeitungszugriff | Separate from member or permission administration. |
| comment access | Permission to view and comment | Kommentarzugriff | Must not imply editing content. |
| view access / view only | Permission to read | Lesezugriff / Nur ansehen | No commenting or editing implied. |
| read-only | Content/company/token cannot be modified | Schreibgeschützt | In explanatory copy **nur lesen**. For API-token access **Nur Lesezugriff**; it does not mean sign-in is blocked. |
| general access | Broad company/space/public access settings | Allgemeiner Zugriff | Not the default Allgemeiner Arbeitsbereich. |
| company-wide / space-wide access | Access inherited from membership | Unternehmensweiter Zugriff / Zugriff für den gesamten Arbeitsbereich | Does not imply public internet access. |
| direct access | Individually granted access | Direkter Zugriff | Contrast with access through company/space membership. |
| public access | Access outside the company | Öffentlicher Zugriff | Spell out **Alle im Internet** where that is the actual audience. |
| anyone with the link | Public-link audience | Alle mit dem Link | Do not describe a public link as private because it is unlisted. |
| invite-only | Access only for explicitly invited people | Nur auf Einladung | Not a status meaning the invitation has already been accepted. |
| privacy / privacy settings | Who can see this work | Sichtbarkeit / Sichtbarkeitseinstellungen | **Datenschutz** is for privacy/data-protection policy, not a visibility picker. |
| grant access / remove access | Add/remove permission | Zugriff gewähren / Zugriff entziehen | Not delete the person's account. |
| trusted email domains | Allowed domains for joining | Vertrauenswürdige E-Mail-Domains | **die Domain / die Domains**. Preserve literal domains. |
| deactivate / reactivate account | Disable/restore access in the stated scope | Konto deaktivieren / Konto reaktivieren | If only company membership is affected, say so explicitly; do not imply a global account deletion. |
| sign in / log in | Authenticate | Anmelden | Noun **Anmeldung**. Do not alternate with Einloggen or confuse with Check-in. |
| sign out / log out | End current authenticated session | Abmelden | Distinct from **Benachrichtigungen abbestellen** and **Kündigen**. |
| sign up | Create an account | Registrieren | **Konto erstellen** when naming the outcome. Not a Check-in. |
| verification code / activation code | Email-based verification | Bestätigungscode / Aktivierungscode | **der Code / die Codes**. Preserve length and expiry; do not call a six-character code six digits. |
| API token / API key | Programmatic credential | API-Token / API-Schlüssel | **das API-Token / die API-Tokens**. Keep distinct from **API-Schlüssel**. Revoking access is **Widerrufen**; preserve Löschen when deletion is the actual action. |
| MCP connection / connected client | External AI client connection | MCP-Verbindung / Verbundener Client | **der Client / die Clients**, not Kunde. **MCP-Client autorisieren** for consent, explained as **Zugriff erlauben**. |

## Billing and administration

| English | Meaning/context | Deutsch | Capitalization and usage |
| --- | --- | --- | --- |
| billing | Company payment and subscription management | Abrechnung | **die Abrechnung**. Not automatically an individual invoice. |
| plan (billing) | Available pricing/service tier | Tarif | **der Tarif / die Tarife**. Work plans remain **Plan**. **Kostenloser / kostenpflichtiger Tarif**; preserve supplied branded tier names. |
| subscription (paid) | Paid service contract | Abonnement | **das Abonnement / die Abonnements**. Not the content-notification setting. |
| billing cycle / billing period | Recurring accounting interval/current period | Abrechnungszyklus / Abrechnungszeitraum | Distinguish recurrence from the dates of a particular period. |
| checkout / continue to checkout | External payment/ordering flow | Bezahlvorgang / Weiter zur Zahlung | Does not claim payment has completed. |
| upgrade / downgrade | Move to a higher/lower tariff | In einen höheren Tarif wechseln / In einen niedrigeren Tarif wechseln | Short nouns **Upgrade / Downgrade** are acceptable in billing headings; never change a supplied tariff name. |
| cancel plan / cancellation | End the paid subscription | Abonnement kündigen / Kündigung | Dialog cancellation is **Abbrechen**; notification unsubscription is **Benachrichtigungen abbestellen**. |
| schedule cancellation / cancellation scheduled | Arrange a future subscription end | Kündigung vormerken / Kündigung vorgemerkt | Include the effective date/period when present. Do not imply immediate termination. |
| member limit / storage limit | Included member/storage capacity | Mitgliederlimit / Speicherlimit | Do not call members “seats” if the product does not. |
| package / ZIP file | Transfer artifact | Datenpaket / ZIP-Datei | **das Datenpaket / die Datenpakete**. Import/export artifact, not a pricing tier. |
| site admin / SaaS admin panel | Instance-wide operator role/screen | Instanz-Admin / Instanzverwaltung | Plural **Instanz-Admins**. Distinct from company Admin and Unternehmensverwaltung. |
| support session / support mode | Operator access for customer assistance | Support-Sitzung / Supportmodus | State the access context accurately; do not imply the operator is the account owner. |
| feature flag | Operator control of an experimental feature | Funktionsschalter | Group heading **Experimentelle Funktionen**. Preserve flag keys such as `i18n`. |
| site message / update badge | Operator banner / new-version indicator | Systemmitteilung / Hinweis auf neue Version | Neither is a project Update or Check-in. |
| provider / provider managed | External billing service and controlled plans | Zahlungsanbieter / Vom Zahlungsanbieter verwaltet | Context is billing; not an outside collaborator. |

## Context and sentence patterns

The same English word can require different German translations. Use the meanings in the tables, especially for **Target**, **Start**, **Review**, **Update**, **Close**, **Pending**, **Title**, **Reports**, and **Plan**. When one source key is shared across incompatible contexts, give it translation context or more specific source wording during implementation. Do not force one German term into every use.

These patterns illustrate role labels, reading confirmation, and name handling. Preserve the placeholders and rich-text tags of the actual source message.

| Situation | German pattern |
| --- | --- |
| Assign a role without assuming gender | **{{author}} hat {{personName}} die Rolle „Reviewer“ zugewiesen.** |
| Confirm reading without implying approval | **{{author}} hat den Check-in als gelesen bestätigt.** |
| Refer to user-named work | **{{author}} hat das Projekt „{{projectName}}“ pausiert.** |
| Avoid an English possessive on a person's name | **Die Unterstützung von {{reviewer}} wird benötigt.** |

## Competitor references

Official German help pages consulted on 2026-10-08. These inform familiar vocabulary; Operately's meanings determine the final choice. Competitor documentation itself sometimes uses inconsistent alternatives.

| Reference | Relevant terminology and choice |
| --- | --- |
| [Asana: project progress](https://help.asana.com/s/article/project-progress-and-status-updates?language=de) | **Meilensteine**, **Ziele**, **Fälligkeitsdatum**, **planmäßig**, **gefährdet**. Operately uses **Kritisch** for its red health state because serious problems can extend beyond schedule delays. |
| [ClickUp: hierarchy](https://help.clickup.com/hc/de/articles/9563959684119-Richte-deinen-pers%C3%B6nlichen-Workspace-ein) | **Aufgaben**, **Ordner**, **Checklisten**, alongside borrowed **Workspace / Spaces**. Reuse familiar work nouns without importing ClickUp's hierarchy. |
| [monday.com: workspaces](https://support.monday.com/hc/de/articles/360010785460-Arbeitsbereiche), [updates](https://support.monday.com/hc/de/articles/115005900249-Der-Updates-Bereich) | **Arbeitsbereiche**, **Meine Arbeit**, **Updates**, **Erwähnungen**, **Benachrichtigungen** support these choices in Operately. |
| [Notion: teamspaces](https://www.notion.com/de/help/browse-join-and-create-teamspaces), [task databases](https://www.notion.com/de/help/sprints) | **Teamspace / Workspace**, **Zuweisungen**, **Fälligkeitsdatum**. Operately uses **Arbeitsbereich** consistently and keeps **Meine Arbeit** broader than Notion's **Meine Aufgaben**. |
