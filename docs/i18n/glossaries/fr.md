# French glossary

Locale: `fr` (Gettext: `fr`). Use broadly understood professional French, with France-style typography and no regional idioms. Apply these terms consistently in the UI, activity feeds, emails, exports, and documentation. See the [internationalization guide](../../internationalization.md) for the translation workflow.

## French usage

- Address the user with **vous**, **votre**, and **vos**. Use infinitives for actions (**Créer un projet**, **Confirmer la lecture**) and polite imperatives for instructions (**Sélectionnez un espace**). Keep the tone direct rather than administrative.
- Use sentence casing and preserve accents on capitals: **Équipe et accès**, **À traiter**, **Échéance**. Role names are lowercase in sentences. Use **et** instead of **&** in translated section names; preserve product names and acronyms such as **KPI**, **API**, and **MCP**.
- Use typographic apostrophes and French quotation marks: **l’objectif**, **« Projet Atlas »**. Keep nonbreaking spaces inside guillemets and before colons, semicolons, question marks, exclamation marks, and percentage signs; use narrow nonbreaking spaces where appropriate. Leave numeric and date formatting to shared locale-aware helpers.
- Translate whole phrases so articles, contractions, and gender agree: **du projet**, **de l’objectif**, **des tâches**, **au responsable**. Use **ce projet**, **cet objectif**, **cette tâche**. A generic “None” needs its noun: **Aucun objectif**, **Aucune tâche**, **Personne**.
- Distinguish grammatical gender from a person’s gender. For taking responsibility, use **{{author}} a pris la responsabilité du projet** when gender is unknown; for role changes use **{{author}} a confié le rôle de référent à {{personName}}**. Use neutral labels or **la personne…** where useful, without inferring gender from a name or adding parenthetical endings throughout the UI.
- Agree statuses with the object: **projet terminé**, **tâche terminée**, **objectifs atteints**. Tables give label forms; do not concatenate them into sentences. Keep names, titles, custom statuses, and units unchanged. Introduce titles with a known noun when needed: **dans le projet « {{projectName}} »**.
- French counting differs from English: **0 tâche**, **1 tâche**, **2 tâches**, **1,5 jour**, **2 jours**. Prefer **Aucune tâche** for a zero-item empty state. French cardinal categories are `one`, `many`, and `other`; `one` includes numbers whose integer part is 0 or 1, and `many` covers cases such as whole millions. Follow [Unicode CLDR](https://www.unicode.org/cldr/charts/48/supplemental/language_plural_rules.html#fr) and verify the catalog mapping, including zero and fractions; do not reuse English or Portuguese rules blindly.

## Organization, people, and roles

Use **Responsable** for Champion and **Référent** for Reviewer. The responsible person drives delivery; the referent follows progress, provides feedback, and confirms reading reports. **Champion** suggests a winner in ordinary French, while **Relecteur** narrows the role to proofreading and **Approbateur** implies approval. Keep both roles distinct from task assignment, hierarchical management, and company ownership.

**Référent** can also mean a contact or subject expert in ordinary French. Explain the Operately role when introducing it or choosing a person for it: **Le référent suit l’avancement, donne des retours et confirme la lecture des points d’avancement.**

| English | Meaning/context | Français | Capitalization and usage |
| --- | --- | --- | --- |
| company / organization | Organization using Operately | Entreprise | Use consistently for this entity, including nonprofit organizations; do not alternate with Société or Espace de travail. |
| account | Person’s sign-in identity across companies | Compte | **Compte personnel** where needed to distinguish company membership or billing. |
| person / people | Generic person or group of people | Personne / Personnes | Do not label everyone Employés: external participants are also included. Use **Annuaire** for the people directory. |
| people directory | Navigation destination listing people | Annuaire | Use for the directory, not for person fields or groups of recipients. |
| member / team member | Company, space, or team membership | Membre / Membre de l’équipe | State the scope: **membre de l’entreprise / de l’espace**. Membership does not imply employment. |
| outside collaborator / guest | Person invited to specific work | Collaborateur externe | Use for the product role, including its internal guest type. **Personne externe** in prose when avoiding gendered attribution. |
| former member / deactivated member | Past membership / disabled access | Ancien membre / Membre désactivé | Deactivation, removal, and departure are distinct; describe the actual operation. |
| manager | Person managing another person | Responsable hiérarchique | Keep the qualifier to distinguish this role from a Champion. |
| peers | People reporting to the same manager | Collègues ayant le même responsable hiérarchique | Keep the reporting relationship explicit; Collègues alone is broader. |
| reports (people) / direct reports | People managed directly | Collaborateurs directs | Never Rapports. In explanatory copy **personnes sous votre responsabilité directe**. |
| title in company | Professional position | Poste | A content title is **Titre**; a product role is **Rôle**. Preserve user-authored job titles. |
| responsibility | Contributor’s assigned area | Responsabilité | **Domaine de responsabilité** in explanatory copy. Not an access level. |
| champion | Person accountable for a goal, project, or KPI upkeep | Responsable | **Responsable du projet / de l’objectif / du KPI**. Do not substitute Chef de projet for goals or metrics. |
| reviewer | Person following progress and providing feedback | Référent | **Référent du projet / de l’objectif**. Preserve final-deliverable approval where the source explicitly describes it; ordinary reading confirmation is separate. |
| contributor | Person participating in project delivery | Contributeur | **Membre de l’équipe projet** in prose when useful. Distinct from a task’s assigned person and from coauthorship. |
| assignee / assignees | People assigned to a task | Personne assignée / Personnes assignées | Keep separate from the project’s Responsable; the plural field can contain several people. |
| assign / assigned to | Allocate work to someone | Assigner / Assignée à | **Assigner la tâche à {{name}}**. **Assignée à** refers to tâche; agree with another object when required. |
| unassigned / not assigned | Missing assignment | Non assignée | For a task; generic empty person field **Personne** or **Aucune personne assignée**. Missing Champion: **Aucun responsable**. |
| owner / account owner | Highest company access role | Propriétaire | **Propriétaire de l’entreprise**. Existing company account-owner copy refers to this role, not personal sign-in ownership. |
| goal owner / project owner | Descriptive reference to a Champion | Responsable | **Responsable de l’objectif / du projet**, not Propriétaire. |
| administrator / admin | Company administrative role | Administrateur | Use the full word in labels; **administration** for the function or section. |
| space manager | Person administering a space | Administrateur de l’espace | Does not grant company administration or people-management authority. |
| email / emails | Electronic mail | E-mail / E-mails | **Adresse e-mail** for the address; **e-mail de confirmation** for a message. Keep the spelling consistent. |

## Navigation and work structure

| English | Meaning/context | Français | Capitalization and usage |
| --- | --- | --- | --- |
| home | Main navigation destination | Accueil | Named destination. |
| my work | Personal work destination | Mon travail | Covers goals, projects, and other work; not only Mes tâches. |
| review | Personal queue of work and reviews | À traiter | Includes points to publish, updates to review, and upcoming work. Does not mean all items are overdue. Review as an action is **Examiner**, not Réviser or Approuver. |
| work map | Goal/project hierarchy | Carte des objectifs et projets | Keep both entities; not a geographical map or a task board. |
| overview | Summary within a page | Vue d’ensemble | Distinct from À traiter and Carte des objectifs et projets. |
| org chart | Reporting hierarchy | Organigramme | Different from the goal/project hierarchy. |
| lobby / switch company | Company chooser / switching action | Choisir une entreprise / Changer d’entreprise | Does not switch only an espace. |
| company admin / company administration | Company management destination | Administration de l’entreprise | Distinct from instance administration. |
| team & access | Named team/permissions section | Équipe et accès | Preserve the accent; use **et**. |
| space | Shared area within a company | Espace | Do not alternate with Espace de travail or Équipe for the same entity. |
| general space | Default company-wide space | Espace général | System-authored label only; preserve stored space names. |
| project | Work with deliverables | Projet | Distinct from a goal and from a single task. |
| goal | Outcome being pursued | Objectif | Not the numeric target value; section **Objectifs et projets**. |
| parent goal | Goal above another goal/project | Objectif parent | Refers to hierarchy, not necessarily greater priority. |
| subgoal / related work | Child goal / linked work | Sous-objectif / Travail associé | Related work can include projects; do not call all related work Sous-objectifs. |
| task / subtask | Unit of work / nested task | Tâche / Sous-tâche | Preserve the accent and hyphen. |
| milestone | Project delivery checkpoint | Jalon | A checkpoint, not an entire phase (**phase** or **étape**). |
| task list / task board | Task views | Liste de tâches / Tableau de tâches | **Tableau Kanban** when specifying the view type; not Tableau de bord, which means dashboard. |
| timeline (view) | Time-based visualization | Chronologie | Distinct from the activity history. |
| timeline (planning) / timeframe | Planned schedule / date range | Calendrier / Période | **Calendrier du projet**; **période de l’objectif**. A duration is **Durée**. |
| template / project template | Reusable project structure | Modèle / Modèle de projet | Not Gabarit or Template interchangeably. |
| relative due date | Template date relative to project start | Échéance relative au début du projet | Explain as **… jours après le début du projet**. |
| next step | Next incomplete tracker item or milestone | Prochaine étape | Can be a target, checklist item, or milestone; not automatically a task. |

## Progress reports and collaboration

Use **Point d’avancement** for the recurring written check-in and **Bilan** for the reflection at closure. A point d’avancement can also mean a meeting in ordinary French; **Publier un point d’avancement** makes the written workflow explicit. **Rétrospective** is valid French and can describe a written reflection; **Bilan** is the product’s preferred label for the closing reflection. Keep examining content, confirming reading, and approving results distinct.

| English | Meaning/context | Français | Capitalization and usage |
| --- | --- | --- | --- |
| check-in | Recurring written progress report | Point d’avancement | Plural **points d’avancement**. Use **rédiger / publier un point d’avancement** to distinguish the written report from a meeting. Never Enregistrement or Connexion. |
| project check-in / goal progress update | Report on a project or goal | Point d’avancement du projet / de l’objectif | Same reporting vocabulary for both workflows. |
| check in / submit check-in | Publish a progress report | Publier un point d’avancement | Do not imply an approval request; specify weekly/monthly only when present in the source. |
| review check-in | Read and assess progress | Examiner le point d’avancement | Does not itself confirm reading. |
| acknowledge | Explicitly confirm reading | Confirmer la lecture | Prefer this clear action to Accuser réception or Prendre acte. Never Approuver, Valider, or Reconnaître for this action. |
| acknowledgement | Recorded reading confirmation | Confirmation de lecture | Distinct from automatic read receipts, notification read state, and reactions. |
| acknowledged / not yet acknowledged | Reading-confirmation state | Lecture confirmée / Lecture non confirmée | **Lecture confirmée par {{name}}**. Do not reduce to Validé or Lu. |
| approve / approval | Actual approval when explicitly described | Approuver / Approbation | **Valider les livrables** can describe actual acceptance; never use it for reading confirmation. |
| retrospective | Written reflection at closure | Bilan | **Bilan du projet / de l’objectif**; action **Rédiger le bilan**. Use Bilan consistently for this product feature; do not imply a separate meeting. |
| acknowledge retrospective | Confirm reading the closing reflection | Confirmer la lecture du bilan | Does not approve the outcome. |
| wins / obstacles / needs | Progress-report prompts | Réussites / Obstacles / Besoins | **Aide nécessaire** when the prompt specifically asks what help is needed. Avoid literal Victoires. |
| blockers | Problems preventing progress | Points bloquants | More specific than general difficulties; not access blocking. |
| feedback | Response to work/progress | Retours | **Donner un retour**, **faire part de vos retours**. Individual comments remain Commentaires. |
| discussion | Titled conversation with replies | Discussion | Distinct from a single comment. |
| post / message | Published contribution or communication | Message | **Message dans une discussion** when needed. Publication can describe the act of publishing. |
| update (posted content) | Generic progress/change communication | Mise à jour | Use Point d’avancement or Valeur enregistrée when that specific object is meant. |
| update (verb) | Modify stored information | Mettre à jour | Specific actions may be **Enregistrer une valeur** or **Publier un point d’avancement**. |
| activity / activity feed | Recorded actions | Activité / Fil d’activité | Not employee productivity or time tracking. |
| Comments & Activity | Combined comments/events section | Commentaires et activité | Named section; sentence casing. |
| mention / direct mention | @ reference to a person | Mention / Mention directe | **Mentionner {{name}}**. Preserve the referenced person. |
| notification | In-app or emailed notice | Notification | Distinct from its underlying message or point d’avancement. |
| mark as read / mark all read | Notification read-state actions | Marquer comme lu / Tout marquer comme lu | With an explicit noun: **marquer la notification comme lue**. Does not acknowledge the underlying report. |
| subscribe / unsubscribe | Start/stop content notifications | Suivre / Ne plus suivre | **Suivre le projet**, **ne plus suivre la discussion**. Email-footer action **Se désabonner des notifications**; not paid-plan cancellation. |
| subscribers / always notified | Notification followers / automatic recipients | Personnes abonnées / Personnes toujours notifiées | Use **Toujours notifier** for a setting that controls automatic notifications. Some recipients are automatic, not voluntary subscribers. |
| audience / people to notify | Intended notification recipients | Destinataires / Personnes à notifier | Notification delivery does not grant content access. |
| daily summary / assignments email | Digest / personal action email | Récapitulatif quotidien / E-mail récapitulatif des éléments à traiter | The action email includes reports and reviews, not only tasks. |
| batched notifications / batch window | Grouped delivery / grouping interval | Notifications groupées / Délai de regroupement | Distinct from a selected **heure d’envoi**. |
| outstanding item | Review-page action needing attention | Élément à traiter | Not necessarily a task or an overdue item. |

## Goals, measurements, and KPIs

Distinguish **Objectif** (outcome), **Indicateur** (its quantitative tracker), **Valeur cible** (the desired number), and **KPI** (the separate ongoing space metric). A goal tracker is not automatically a Résultat clé in an OKR framework.

| English | Meaning/context | Français | Capitalization and usage |
| --- | --- | --- | --- |
| target / targets (goal item) | Named tracker with baseline/current/target values | Indicateur / Indicateurs | Also applies to older measure/measurement references to the whole tracker. Not a second Objectif. |
| target (numeric field) / target value | Desired numeric destination | Valeur cible | Distinct from the whole Indicateur. |
| start / starting from (numeric baseline) | Initial measurement | Valeur initiale | Not Date de début or the action Commencer. |
| current value / new value | Recorded measurement | Valeur actuelle / Nouvelle valeur | Do not confuse actuelle with English actual; lower values can also mean progress. |
| progress | Advancement toward an outcome | Avancement | **Avancement de l’objectif / du projet**. Distinct from health status or elapsed time. |
| checklist | Qualitative/binary tracker | Liste de contrôle | Distinct from a Liste de tâches; avoid alternating with Checklist. |
| check / checklist item | Individual checklist entry | Élément de la liste de contrôle | Actions **Cocher / Décocher**. Check as assessment is **Vérifier**. |
| KPI / KPIs | Ongoing space metric | KPI | Keep the acronym invariant: **un KPI / des KPI**. Explain as **indicateur clé de performance**. |
| cadence | Recording/update frequency | Fréquence | **Chaque semaine / Chaque mois**. Not a billing period or a required meeting. |
| log update / record update (KPI) | Record a value for a date | Enregistrer une valeur | History heading **Valeurs enregistrées**; not a Point d’avancement. |
| annotation / note | Chart event marker / supporting text | Annotation / Note | Keep chart annotations distinct from comments and a value’s optional note. |
| period (KPI) | Period/date represented by a record | Période | Use **Date** for a single-date field; do not imply a range the form does not collect. |
| history / previous values | Historical data / edited values | Historique / Valeurs précédentes | **Historique des valeurs** versus **historique des modifications**; previous edits need not refer to earlier measurement periods. |

## Status, lifecycle, and dates

Health, completion, and deadlines are separate dimensions. Use the source meaning to choose the label, and preserve user-authored statuses.

| English | Meaning/context | Français | Capitalization and usage |
| --- | --- | --- | --- |
| status / task status | Health/workflow field | Statut / Statut de la tâche | Do not alternate with État for the same field. |
| on track | Progressing as planned | En bonne voie | Covers delivery and outcomes, not only meeting deadlines. |
| caution / needs attention (health) | Emerging risks or delays | À risque | Yellow health state. Generic caution notices use **Attention**. |
| off track | Significant problems affecting success | En difficulté | Red health state. Do not reduce to En retard: problems can concern results, not only dates. |
| pending / not started (work) | Work has not begun | Non commencé | **Tâche non commencée**. A pending invitation or confirmation is **En attente**. |
| in progress | Work actively underway | En cours | Does not imply En bonne voie. |
| paused | Temporarily stopped work | En pause | Distinct from unfinished, canceled, or closed. |
| outdated | Progress information is stale | Données à actualiser | Describes the information, not lateness of the work itself. |
| achieved / accomplished | Goal outcome attained | Atteint | **Objectif atteint**; not merely closed or finished. |
| missed / not accomplished | Goal outcome not attained | Non atteint | **Objectif non atteint**. Avoid Manqué where it could mean a missed event. |
| completed / done | Work finished | Terminé | **Projet terminé / tâche terminée / jalon terminé**. Does not prove every associated goal was achieved. |
| open / closed (task status category) | Categories keeping work active or ending it | Ouvert / Fermé | **Statuts ouverts / fermés**; **tâches ouvertes / fermées**. Closed can include canceled, not only completed. |
| canceled (task) | Intentionally abandoned work | Annulée | Feminine for tâche; not En pause. |
| close goal / close project | End active work | Clôturer l’objectif / Clôturer le projet | Outcome-neutral; an unsuccessful goal can be closed. **Examiner et clôturer** for Review & Close. Closing a dialog is **Fermer**. |
| reopen | Make closed work active again | Rouvrir | Distinct from restoring deleted or archived content. |
| pause / resume | Temporarily stop/restart work | Mettre en pause / Reprendre | Keep consistent across buttons, feed entries, and emails. |
| archive / unarchive | Remove from/return to active views | Archiver / Désarchiver | State **Archivé / Archivée**. Does not delete content or prove completion. |
| delete / remove / unlink | Delete content / remove a relationship | Supprimer / Retirer / Dissocier | **Retirer du projet** preserves the item; **supprimer définitivement** deletes it. |
| due date | Planned completion deadline | Date d’échéance | Short **Échéance** in compact labels; **À terminer le <date/>** in a sentence. Never Date de fin for actual completion and deadline interchangeably. |
| overdue | Deadline has passed | En retard | **En retard de 2 jours**; **échéance dépassée** when explicitly describing the deadline. Not En difficulté. |
| delayed / running late | Work is delayed, possibly before the final deadline | Prend du retard | **Le projet prend du retard**. A changed scheduled date is **Reporté** only when actually postponed. |
| completed date / completed on | Actual completion | Date de fin / Terminé le | **Tâche terminée le <date/>**; a planned start is **Date de début**. |
| schedule (publication) | Select a future publishing time | Programmer la publication | State **Publication programmée**; distinct from publishing immediately. |

## Documents and content

| English | Meaning/context | Français | Capitalization and usage |
| --- | --- | --- | --- |
| Docs & Files / Documents & Files | Named content tool | Documents et fichiers | Same name for both variants. Never expose the internal Resource Hub name. |
| document / doc | Rich-text document | Document | Distinct from an uploaded **fichier**, **dossier**, **lien**, or comment **pièce jointe**. |
| resource / item | Generic content entry | Ressource / Élément | Prefer the specific type when known; ressource here is not necessarily staff or capacity. |
| key resource / support material | Supporting project/goal content | Ressource clé / Document de référence | For support material that can also be a link, use **Ressource de référence**. |
| draft / save as draft / discard draft | Unpublished content and lifecycle | Brouillon / Enregistrer le brouillon / Supprimer le brouillon | Distinct from canceling a dialog or abandoning unsaved edits. |
| publish / published | Make content available to its audience | Publier / Publié | **Publication** does not necessarily grant public internet access. |
| public sharing | Allow access through a public link | Partage public | **Activer / désactiver le partage public**; separate from publishing a draft. |
| version / version history | Saved revision / revision list | Version / Historique des versions | **Restaurer cette version** does not promise to erase later history. |
| duplicate / create copy | Create another content item | Dupliquer / Créer une copie | Clipboard action **Copier** is different. |
| upload / download / import / export | File transfer and structured data transfer | Ajouter des fichiers / Télécharger / Importer / Exporter | Use Ajouter for uploads in Documents et fichiers; reserve Télécharger for saving to the user’s device. Importer can create app data from a package. |

## Access and account terminology

| English | Meaning/context | Français | Capitalization and usage |
| --- | --- | --- | --- |
| access / access level / permissions | Access and allowed operations | Accès / Niveau d’accès / Autorisations | Separate from responsibility for delivery. |
| full access | Highest item access level | Accès complet | Does not grant company ownership. |
| edit access | Permission to modify content | Peut modifier | Use in permission pickers and explanatory copy; does not imply permission management. |
| comment access | Permission to view and comment | Peut commenter | Use in permission pickers and explanatory copy; does not allow content editing. |
| view access / read-only | Read without modifying | Lecture seule | **Peut consulter** in explanatory copy. Also applies to a restricted company or API token. |
| general access | Broad membership/public access settings | Accès général | Different from Espace général. |
| company-wide / space-wide access | Access through membership | Accès des membres de l’entreprise / de l’espace | Company-wide does not mean public internet access. |
| direct access | Access granted individually | Accès direct | Distinct from access inherited through membership. |
| public access / anyone with the link | Internet/public-link audience | Accès public / Toute personne disposant du lien | An unlisted link still grants public access; do not describe it as private. |
| invite-only | Only explicitly invited people can access | Sur invitation uniquement | Does not mean the invitation has been accepted. |
| privacy / privacy settings | Who can see this work | Visibilité / Paramètres de visibilité | A privacy policy is **Politique de confidentialité**; use Visibilité for the work-access picker. |
| grant access / remove access | Give/withdraw permissions | Accorder l’accès / Retirer l’accès | Does not delete the person’s account. |
| trusted email domains | Allowed joining domains | Domaines e-mail autorisés | Preserve the actual domain names; does not imply that every address is already a member. |
| deactivate / reactivate account | Disable/restore scoped access | Désactiver / Réactiver | State when only membership in one company is affected; do not imply global account deletion. |
| sign in / sign out / sign up | Authentication and registration | Se connecter / Se déconnecter / S’inscrire | Separate from a progress check-in and paid subscription. |
| verification code / activation code | Email verification | Code de vérification / Code d’activation | A six-character code is **code à six caractères**, not necessarily six digits. |
| API token / API key | Programmatic credentials | Jeton API / Clé API | Keep token and key distinct. **Révoquer** access versus **Supprimer** an entry. |
| MCP connection / connected client | External AI client connection | Connexion MCP / Client connecté | Client is software here; consent action **Autoriser l’accès**. |

## Billing and administration

| English | Meaning/context | Français | Capitalization and usage |
| --- | --- | --- | --- |
| billing | Company payment management | Facturation | **Informations de facturation**; an invoice is **Facture**, not the whole section. |
| plan (billing) | Pricing/service tier | Forfait | Work plan is **Plan**. Preserve branded plan names; generic **forfait gratuit / payant**. |
| subscription (paid) | Paid service subscription | Abonnement | Qualify the object where it could mean notification following. |
| billing cycle / billing period | Recurrence / current paid interval | Fréquence de facturation / Période de facturation | Frequency and the dates of a particular period are distinct. |
| checkout / continue to checkout | Payment flow | Paiement / Passer au paiement | Does not say payment has already completed. |
| upgrade / downgrade | Move to a higher/lower tier | Passer au forfait supérieur / inférieur | Not Mettre à jour, which means update. |
| cancel plan / cancellation scheduled | End subscription / future end arranged | Résilier l’abonnement / Résiliation programmée | Preserve the effective date. **Annuler** cancels a dialog; **ne plus suivre** stops content notifications. |
| member limit / storage limit | Plan capacity | Limite de membres / Limite de stockage | A member slot is **place de membre**, not a job or workstation. |
| package / ZIP file | Import/export artifact | Archive de données / Archive ZIP | Not a pricing forfait. |
| site admin / SaaS admin panel | Instance-wide operator role/screen | Administrateur de l’instance / Administration de l’instance | Distinct from company or space administration. |
| support session / support mode | Operator access for customer assistance | Session d’assistance / Mode assistance | Does not make the operator the company owner. |
| feature flag | Experimental-feature control | Activation de fonctionnalité | Group **Fonctionnalités expérimentales**; preserve machine keys such as `i18n`. |
| site message / update badge | Operator banner / new-version indicator | Message système / Indicateur de nouvelle version | Neither is a point d’avancement. |

## Context and sentence patterns

Shared source words such as **Target**, **Start**, **Review**, **Update**, **Close**, **Reports**, **Title**, and **Plan** need the contextual meanings above. During translation implementation, add context or specific source wording if a shared key cannot express the required meanings or agreement. Preserve the actual source placeholders, actors, and rich-text tags.

| Situation | French pattern |
| --- | --- |
| Reading confirmation without approval | **{{author}} a confirmé la lecture du point d’avancement.** |
| Explain the acknowledgement action | **Vous confirmez avoir lu ce point d’avancement.** |
| Role change without assuming a person’s gender | **{{author}} a confié le rôle de référent à {{personName}}.** |
| Gender agreement follows the object | **{{author}} a terminé la tâche « {{taskName}} ».** |
| Closure without success | **L’objectif a été clôturé sans être atteint.** |
| Contractions and unchanged titles | **Le point d’avancement du projet « {{projectName}} » a été publié.** |
| Deadline counts | **En retard de 1 jour / En retard de 2 jours.** |

## Research references

Official French pages consulted on 2026-10-08 for familiar product terminology.

| Reference | Terminology observed |
| --- | --- |
| [Asana: project status](https://help.asana.com/s/article/project-progress-and-status-updates?language=fr) | Mises à jour de statut, jalons, ressources clés, dans les délais, à risque, en retard. Operately uses Point d’avancement for written reports and En bonne voie / En difficulté for health beyond deadlines. |
| [ClickUp: milestones](https://help.clickup.com/hc/fr-fr/articles/6304458574615-Jalons), [task assignment](https://help.clickup.com/hc/fr-fr/articles/10552031987735-Introduction-aux-t%C3%A2ches) | Jalon, personnes assignées, listes de contrôle, dates d’échéance. |
| [Asana: tasks](https://help.asana.com/s/article/understanding-tasks?language=fr), [ClickUp: assignee cards](https://help.clickup.com/hc/fr-fr/articles/6311141304727-Cartes-de-personnes-assign%C3%A9es) | Asana uses Responsable for task assignees; ClickUp uses Personne assignée. Operately follows the latter to distinguish task assignment from the Champion role. |
| [monday.com: updates](https://support.monday.com/hc/fr/articles/115005900249-La-section-des-mises-%C3%A0-jour) | Mises à jour, notifications, abonnés, mises à jour programmées, indication that an update was viewed. |
| [monday.com: my work](https://support.monday.com/hc/fr/articles/360019300579-Mon-travail) | Mon travail as the personal work destination. |
| [Notion: sharing and permissions](https://www.notion.com/fr/help/sharing-and-permissions) | Accès complet, peut modifier, peut commenter, accès général, public-link sharing. |
