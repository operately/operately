# Spanish glossary

Locale: `es` (Gettext: `es`). Use broadly understood professional Spanish for Spain and Latin America, avoiding regional idioms. Apply these terms consistently in the UI, activity feeds, emails, exports, and documentation. See the [internationalization guide](../../internationalization.md) for the translation workflow.

## Spanish usage

- Address the user with **tú**, **te**, and **tu**; usually omit the pronoun. Use **ustedes** for a group when needed, without mixing in usted, vos, or vosotros. Keep the tone respectful and direct. Use infinitives for actions (**Crear proyecto**, **Confirmar la lectura**) and imperatives for instructions (**Selecciona un espacio**).
- Use sentence casing and retain accents on capitals: **Última actualización**, **Área de responsabilidad**. Days, months, and role names are lowercase in sentences. Use **y** instead of **&** in translated section names. Preserve product names and acronyms such as **KPI**, **API**, and **MCP**.
- Use opening and closing punctuation: **¿Eliminar el proyecto?**, **¡Listo!** Use **«…»** for quoted titles, without spaces inside the quotation marks. Do not insert French-style spaces before punctuation. Leave dates, numbers, percentages, and currencies to shared locale-aware formatters; Spanish-language audiences do not all use the same regional formats.
- Translate whole phrases so articles, contractions, and agreement remain correct: **del proyecto**, **al responsable**, **la tarea asignada**, **los objetivos alcanzados**. A generic “None” depends on context: **Ningún objetivo**, **Ninguna tarea**, **Nadie**. Before a masculine noun use **un proyecto**, not uno proyecto.
- Do not infer a person’s gender from a name. Prefer active sentences such as **{{author}} creó el proyecto** and neutral constructions such as **{{personName}} tiene el rol de revisor**. **Persona asignada** agrees with persona, regardless of the person’s gender. Avoid inserting slash endings or invented endings throughout the UI.
- Status forms in the tables are labels, not fragments to concatenate with nouns. Agree with the object in prose: **proyecto completado**, **tarea completada**, **objetivo alcanzado**. Preserve names, titles, custom statuses, and units. Introduce user-authored titles with a known noun when needed: **en el proyecto «{{projectName}}»**.
- Use language-aware plurals: **0 tareas**, **1 tarea**, **2 tareas**, **1,5 días**. Prefer **Ninguna tarea** for a zero-item empty state. Spanish cardinal categories are `one`, `many`, and `other`: `one` is exactly 1, while `many` includes cases such as whole millions. Follow [Unicode CLDR](https://www.unicode.org/cldr/charts/48/supplemental/language_plural_rules.html#es) and verify the catalog mapping, including zero and fractions; French and Portuguese rules are not interchangeable with Spanish.

## Organization, people, and roles

Use **Responsable** for Champion and **Revisor** for Reviewer. The responsible person drives delivery; the reviewer follows progress, gives feedback, and confirms reading reports. Avoid the literal Campeón and the approval-specific Aprobador. Keep these roles distinct from task assignment, hierarchical management, and company ownership.

| English | Meaning/context | Español | Capitalization and usage |
| --- | --- | --- | --- |
| company / organization | Organization using Operately | Empresa | Use consistently for the product entity, including nonprofit organizations; do not alternate with Organización or Espacio de trabajo. |
| account | Person’s sign-in identity across companies | Cuenta | **Cuenta personal** when distinguishing identity from company membership or billing. |
| person / people | People directory or generic person | Persona / Personas | Directory label **Personas**. Not everyone shown is an employee. |
| member / team member | Company, space, or team membership | Miembro / Miembro del equipo | State the scope: **miembro de la empresa / del espacio**. Membership does not imply employment. |
| outside collaborator / guest | Person invited to specific work | Colaborador externo | Use for the product role, including the internal guest type. **Persona externa** in prose when avoiding gendered attribution. |
| former member / deactivated member | Past membership / disabled access | Antiguo miembro / Miembro desactivado | Removal and deactivation are distinct; access can be restored where supported. |
| manager | Person managing another person | Responsable directo | Hierarchical relationship; keep **directo** to distinguish it from the Champion role. |
| peers | People reporting to the same manager | Compañeros con el mismo responsable directo | Do not shorten to Compañeros if it loses the shared-manager meaning. |
| reports (people) / direct reports | People managed directly | Personas a cargo | **Personas directamente a tu cargo** in explanatory copy. Never Informes or Reportes for people. |
| title in company | Professional position | Cargo | Content titles are **Título**; a product role is **Rol**. Preserve user-authored job titles. |
| responsibility | Contributor’s assigned area | Responsabilidad | **Área de responsabilidad** when describing the contributor’s scope. Not an access level. |
| champion | Person accountable for a goal, project, or KPI upkeep | Responsable | **Responsable del proyecto / del objetivo / del KPI**. Do not substitute Jefe de proyecto for goals or metrics. |
| reviewer | Person following progress and providing feedback | Revisor | **Revisor del proyecto / del objetivo**. Explain the ongoing role; it is not limited to proofreading. Preserve final-deliverable approval when explicitly described by the source. |
| contributor | Person participating in project delivery | Colaborador | **Colaborador del proyecto** where needed. Distinct from a task’s assigned person and from coauthorship. |
| assignee / assignees | People assigned to a task | Persona asignada / Personas asignadas | Keep separate from the project’s Responsable; a task may have several assigned people. |
| assign / assigned to | Allocate work to someone | Asignar / Asignada a | **Asignar la tarea a {{name}}**. Assign gender according to the work item: **proyecto asignado**, **tarea asignada**. |
| unassigned / not assigned | Missing assignment | Sin asignar | Generic empty person field **Nadie**. Missing Champion: **Sin responsable**. |
| owner / account owner | Highest company access role | Propietario | **Propietario de la empresa**. Existing company account-owner copy refers to this role, not a separate personal-account ownership role. |
| goal owner / project owner | Descriptive reference to a Champion | Responsable | **Responsable del objetivo / del proyecto**, not Propietario. |
| administrator / admin | Company administrative role | Administrador | Use the full word in labels; **administración** for the function or section. |
| space manager | Person administering a space | Administrador del espacio | Does not grant company administration or people-management authority. |
| email / emails | Electronic mail | Correo electrónico / Correos electrónicos | **Dirección de correo electrónico** for an address; short **correo** when context is clear. Avoid switching between Email, E-mail, and Correo. |

## Navigation and work structure

| English | Meaning/context | Español | Capitalization and usage |
| --- | --- | --- | --- |
| home | Main navigation destination | Inicio | Named destination. |
| my work | Personal work destination | Mi trabajo | Covers goals, projects, and other work; not only Mis tareas. |
| review | Personal queue of work and reviews | Pendientes | Includes reports to publish, updates to review, and upcoming work. Does not mean everything is overdue or awaiting approval. Review as an action is **Revisar**. |
| work map | Goal/project hierarchy | Mapa de objetivos y proyectos | Keep both entities; not a geographical map or task board. |
| overview | Summary within a page | Resumen | Distinct from the named Pendientes and Mapa de objetivos y proyectos destinations. |
| org chart | Reporting hierarchy | Organigrama | Different from the goal/project hierarchy. |
| lobby / switch company | Company chooser / switching action | Seleccionar empresa / Cambiar de empresa | Does not switch only an espacio. |
| company admin / company administration | Company management destination | Administración de la empresa | Distinct from instance administration. |
| team & access | Named team/permissions section | Equipo y acceso | Use **y**. |
| space | Shared area within a company | Espacio | Do not alternate with Espacio de trabajo or Equipo for the same entity. |
| general space | Default company-wide space | Espacio general | System-authored label only; preserve stored space names. |
| project | Work with deliverables | Proyecto | Distinct from a goal and a single task. |
| goal | Outcome being pursued | Objetivo | Keep distinct from the numeric Valor objetivo; section **Objetivos y proyectos**. Do not alternate with Meta for the same object. |
| parent goal | Goal above another goal/project | Objetivo superior | Refers to hierarchy, not necessarily greater priority; avoid Objetivo principal when it could mean the most important one. |
| subgoal / related work | Child goal / linked work | Subobjetivo / Trabajo relacionado | Related work can include projects; not every related item is a subobjetivo. |
| task / subtask | Unit of work / nested task | Tarea / Subtarea | Subtarea is one word. |
| milestone | Project delivery checkpoint | Hito | A checkpoint, not an entire phase or stage. |
| task list / task board | Task views | Lista de tareas / Tablero de tareas | **Tablero Kanban** when specifying the view type; a dashboard is **Panel**, not this task board. |
| timeline (view) | Planned work displayed across dates | Cronograma | Use for the planning view, consistent with **Cronograma del proyecto**. Distinct from an activity history. |
| timeline (planning) / timeframe | Planned schedule / date range | Cronograma / Período | **Cronograma del proyecto**; **período del objetivo**. Duration is **Duración**. |
| template / project template | Reusable project structure | Plantilla / Plantilla de proyecto | Do not alternate with Modelo or Template. |
| relative due date | Template date relative to project start | Fecha de vencimiento relativa al inicio del proyecto | Explain as **… días después del inicio del proyecto**. |
| next step | Next incomplete tracker item or milestone | Próximo paso | Can be a target, checklist item, or milestone; not automatically a task. |

## Check-ins and collaboration

Retain **check-in** for the recurring written progress update, with plural **check-ins**. Explain it on first use: **Una breve actualización sobre el avance del proyecto.** Use **del objetivo** for a goal. Use **Balance final** for the reflection at closure. The latter covers outcomes and lessons learned, without implying a retrospective meeting or a financial statement. Prefer **Balance final del proyecto / del objetivo** when the object is not clear from context. **Retrospectiva** is familiar in agile tools but can suggest a meeting; retain **Balance final** for Operately’s written closing reflection. Reviewing content, confirming reading, and approving results remain separate actions.

| English | Meaning/context | Español | Capitalization and usage |
| --- | --- | --- | --- |
| check-in | Recurring written progress report | Check-in | Keep the hyphen: **el check-in / los check-ins**. Lowercase in prose; capitalize at the start of a sentence or label. Do not alternate with Informe de avance. Not Registro, Inicio de sesión, or attendance at a meeting. |
| project check-in / goal progress update | Report on a project or goal | Check-in del proyecto / del objetivo | Same reporting vocabulary for both workflows. |
| check in / submit check-in | Publish a progress report | Publicar check-in | Does not imply an approval request; specify weekly/monthly only when present in the source. |
| review check-in | Read and assess progress | Revisar el check-in | Does not itself confirm reading or approve the result. |
| acknowledge | Explicitly confirm reading | Confirmar la lectura | **Confirmar la lectura del check-in** when naming the object. Clearer than Acusar recibo or Tomar conocimiento. Never Reconocer, Aprobar, or Aceptar for this action. |
| acknowledgement | Recorded reading confirmation | Confirmación de lectura | Distinct from automatic read receipts, notification read state, and reactions. |
| acknowledged / not yet acknowledged | Reading-confirmation state | Lectura confirmada / Lectura sin confirmar | **Lectura confirmada por {{name}}**. Do not reduce to Aprobado or Leído. |
| approve / approval | Actual approval when explicitly described | Aprobar / Aprobación | **Aprobar los entregables** for actual acceptance; not routine reading confirmation. |
| retrospective | Written reflection at closure | Balance final | **Balance final del proyecto / del objetivo**; action **Escribir el balance final**. Do not introduce a meeting. |
| acknowledge retrospective | Confirm reading the closing reflection | Confirmar la lectura del balance final | Does not approve the outcome. |
| wins / obstacles / needs | Progress-report prompts | Logros / Obstáculos / Necesidades | **Ayuda necesaria** when the source specifically asks what help is needed. Avoid literal Victorias. |
| blockers | Problems preventing progress | Impedimentos | Stronger than general difficulties; not access restrictions. |
| feedback | Response to work/progress | Comentarios | **Dar comentarios sobre el avance**; individual discussion replies also use Comentarios. Avoid regional alternation between Retroalimentación and Feedback. |
| discussion | Titled conversation with replies | Conversación | Distinct from a single Comentario. Avoid Discusión when it could suggest an argument. |
| post / message | Published contribution or communication | Mensaje | **Mensaje en una conversación** when needed. Publicación can describe the act of publishing. |
| update (posted content) | Generic progress/change communication | Actualización | Prefer Check-in or Valor registrado for those specific objects. |
| update (verb) | Modify stored information | Actualizar | Specific actions may be **Registrar un valor** or **Publicar un check-in**. |
| activity / activity feed | Recorded actions | Actividad / Historial de actividad | Not employee productivity or time tracking. |
| Comments & Activity | Combined comments/events section | Comentarios y actividad | Named section; sentence casing. |
| mention / direct mention | @ reference to a person | Mención / Mención directa | **Mencionar a {{name}}**. Preserve the referenced person. |
| notification | In-app or emailed notice | Notificación | Distinct from its underlying message or report. |
| mark as read / mark all read | Notification read-state actions | Marcar como leído / Marcar todo como leído | With an explicit noun: **marcar la notificación como leída**. Does not acknowledge the underlying report. |
| subscribe / unsubscribe | Start/stop content notifications | Seguir / Dejar de seguir | **Seguir el proyecto**, **dejar de seguir la conversación**. Email-footer action **Dejar de recibir notificaciones**; not paid-plan cancellation. |
| subscribers / always notified | Notification followers / automatic recipients | Seguidores / Reciben siempre las notificaciones | Some recipients are automatic, not voluntary followers. Access and notification delivery are separate. |
| audience / people to notify | Intended notification recipients | Destinatarios / Personas que recibirán una notificación | Use **Destinatarios** for a compact label. Does not grant access to the underlying content. |
| daily summary / assignments email | Digest / personal action email | Resumen diario / Resumen de pendientes | Use **Resumen de pendientes** as the email’s name; **correo con el resumen de pendientes** when referring to its delivery. Includes reports, reviews, and reminders; not just task assignments. |
| batched notifications / batch window | Grouped delivery / grouping interval | Notificaciones agrupadas / Intervalo de agrupación | A duration, unlike a selected **hora de envío**. |
| outstanding item | Review-page action needing attention | Elemento pendiente | Not necessarily a task or an overdue item. |

## Goals, measurements, and KPIs

Distinguish **Objetivo** (outcome), **Indicador** (its quantitative tracker), **Valor objetivo** (the desired number), and **KPI** (the separate ongoing space metric). A goal tracker is not automatically a Resultado clave in an OKR framework.

| English | Meaning/context | Español | Capitalization and usage |
| --- | --- | --- | --- |
| target / targets (goal item) | Named tracker with baseline/current/target values | Indicador / Indicadores | Also applies to older measure/measurement references to the whole tracker. Not another Objetivo. |
| target (numeric field) / target value | Desired numeric destination | Valor objetivo | Distinct from the whole Indicador. Avoid shortening to Objetivo when it could mean the parent outcome. |
| start / starting from (numeric baseline) | Initial measurement | Valor inicial | Not Fecha de inicio or the action Iniciar. |
| current value / new value | Recorded measurement | Valor actual / Nuevo valor | Current is **actual**; English actual can mean **real**. Lower values can also represent progress. |
| progress | Advancement toward an outcome | Avance | **Avance del objetivo / del proyecto**. Distinct from health status or elapsed time. |
| checklist | Qualitative/binary tracker | Lista de verificación | Distinct from a Lista de tareas; do not alternate with Checklist. |
| check / checklist item | Individual checklist entry | Elemento de la lista de verificación | Actions **Marcar como completado / Desmarcar**. Check as an assessment is **Revisar**. |
| KPI / KPIs | Ongoing space metric | KPI | Invariant acronym: **un KPI / los KPI**. Explain as **indicador clave de rendimiento**. |
| cadence | Recording/update frequency | Frecuencia | **Cada semana / Cada mes**. Not a billing period or required meeting. |
| log update / record update (KPI) | Record a value for a date | Registrar un valor | History heading **Valores registrados**; not a check-in. |
| annotation / note | Chart event marker / supporting text | Anotación / Nota | Keep chart annotations distinct from comments and a value’s optional note. |
| period (KPI) | Period/date represented by a record | Período | Use **Fecha** for a single-date field; do not imply a date range the form does not collect. |
| history / previous values | Historical data / edited values | Historial / Valores anteriores | **Historial de valores** versus **historial de cambios**; prior edits need not refer to earlier measurement periods. |

## Status, lifecycle, and dates

Health, completion, and deadlines are separate dimensions. Choose the label according to the source meaning, and preserve user-authored statuses.

| English | Meaning/context | Español | Capitalization and usage |
| --- | --- | --- | --- |
| status / task status | Health/workflow field | Estado / Estado de la tarea | Use Estado consistently instead of alternating with Estatus. |
| on track | Progressing as planned | Según lo previsto | Covers delivery and outcomes, not only meeting deadlines. Distinct from En curso. |
| caution / needs attention (health) | Emerging risks or delays | En riesgo | Yellow health state. A generic caution notice is **Atención**. |
| off track | Significant problems affecting success | En dificultades | Red health state. Do not reduce to Con retraso: problems can concern results, not only timing. |
| pending / not started (work) | Work has not begun | Sin iniciar | An invitation or confirmation awaiting action is **Pendiente**; not all items in the Pendientes navigation queue are unstarted. |
| in progress | Work actively underway | En curso | Does not imply Según lo previsto. |
| paused | Temporarily stopped work | En pausa | Not canceled, closed, or simply unstarted. |
| outdated | Progress information is stale | Información desactualizada | Does not imply that the work itself is overdue. |
| achieved / accomplished | Goal outcome attained | Alcanzado | **Objetivo alcanzado**; not merely closed or finished. |
| missed / not accomplished | Goal outcome not attained | No alcanzado | **Objetivo no alcanzado**. Not Perdido, which suggests loss. |
| completed / done | Work finished | Completado | **Proyecto completado / tarea completada / hito completado**. Does not prove every associated goal was achieved. |
| open / closed (task status category) | Categories keeping work active or ending it | Abierto / Cerrado | **Estados abiertos / cerrados**; **tareas abiertas / cerradas**. Closed can include canceled, not only completed. |
| canceled (task) | Intentionally abandoned work | Cancelada | Feminine for tarea; not En pausa. |
| close goal / close project | End active work | Cerrar el objetivo / Cerrar el proyecto | Outcome-neutral; an unsuccessful goal can be closed. **Revisar y cerrar** for Review & Close. |
| reopen | Make closed work active again | Reabrir | Distinct from restoring deleted or archived content. |
| pause / resume | Temporarily stop/restart work | Pausar / Reanudar | Keep consistent across buttons, feed entries, and emails. |
| archive / unarchive | Remove from/return to active views | Archivar / Desarchivar | State **Archivado / Archivada**. Does not delete content or prove completion. |
| delete / remove / unlink | Delete content / remove a relationship | Eliminar / Quitar / Desvincular | **Quitar del proyecto** preserves the item; **eliminar definitivamente** deletes it. |
| due date | Planned completion deadline | Fecha de vencimiento | Short **Vencimiento** in compact labels; **Vence el <date/>** in prose. Not the actual Fecha de finalización. |
| overdue | Deadline has passed | Vencido | **Tarea vencida**; **venció hace 2 días**. For a check-in use **el plazo para publicar el check-in venció** so it does not suggest outdated check-in content. |
| delayed / running late | Work is delayed, possibly before its final deadline | Con retraso | **El proyecto lleva 2 días de retraso**. Not interchangeable with Vencido or the broader En dificultades. **Pospuesto** requires an actual postponement. |
| completed date / completed on | Actual completion | Fecha de finalización / Completado el | **Tarea completada el <date/>**; planned beginning is **Fecha de inicio**. |
| schedule (publication) | Select a future publishing time | Programar publicación | State **Publicación programada**; distinct from publishing immediately. |

## Documents and content

| English | Meaning/context | Español | Capitalization and usage |
| --- | --- | --- | --- |
| Docs & Files / Documents & Files | Named content tool | Documentos y archivos | Same name for both variants. Never expose the internal Resource Hub name. |
| document / doc | Rich-text document | Documento | Distinct from an uploaded **archivo**, **carpeta**, **enlace**, or comment **archivo adjunto**. |
| resource / item | Generic content entry | Recurso / Elemento | Prefer the specific type when known; recurso here is not necessarily personnel or computing capacity. |
| key resource / support material | Supporting project/goal content | Recurso clave / Material de apoyo | Can include links as well as documents or files. |
| draft / save as draft / discard draft | Unpublished content and lifecycle | Borrador / Guardar borrador / Descartar borrador | Discarding a draft is distinct from canceling a dialog or abandoning unsaved edits. |
| publish / published | Make content available to its audience | Publicar / Publicado | Does not necessarily grant public internet access. |
| public sharing | Allow access through a public link | Acceso mediante enlace público | **Activar / desactivar el enlace público**; separate from publishing a draft. |
| version / version history | Saved revision / revision list | Versión / Historial de versiones | **Restaurar esta versión** does not promise to erase later history. |
| duplicate / create copy | Create another content item | Duplicar / Crear una copia | Clipboard action **Copiar** is different. |
| upload / download / import / export | File transfer and structured data transfer | Subir / Descargar / Importar / Exportar | **Subir archivos** to the app; **descargar** to the user’s device. Importar can create app data from a package. |

## Access and account terminology

| English | Meaning/context | Español | Capitalization and usage |
| --- | --- | --- | --- |
| access / access level / permissions | Access and allowed operations | Acceso / Nivel de acceso / Permisos | Separate from responsibility for delivery. |
| full access | Highest item access level | Acceso completo | Does not grant company ownership. |
| edit access | Permission to modify content | Edición | **Puede editar** in explanatory copy; does not imply permission management. |
| comment access | Permission to view and comment | Comentarios | **Puede comentar**; not content editing. |
| view access / read-only | Read without modifying | Solo lectura | **Puede ver** in explanatory copy. Also applies to a restricted company or API token. |
| general access | Broad membership/public access settings | Acceso general | Different from Espacio general. |
| company-wide / space-wide access | Access through membership | Acceso para miembros de la empresa / del espacio | Company-wide does not mean public internet access. |
| direct access | Access granted individually | Acceso directo | Distinct from inherited membership access; in this context it does not mean a shortcut. |
| public access / anyone with the link | Internet/public-link audience | Acceso público / Cualquier persona con el enlace | An unlisted link still grants public access; do not describe it as private. |
| invite-only | Only explicitly invited people can access | Solo con invitación | Does not mean the invitation has been accepted. |
| privacy / privacy settings | Who can see this work | Visibilidad / Configuración de visibilidad | A privacy policy is **Política de privacidad**; use Visibilidad for the work-access picker. |
| grant access / remove access | Give/withdraw permissions | Dar acceso / Retirar acceso | Does not delete the person’s account. |
| trusted email domains | Allowed joining domains | Dominios de correo de confianza | Preserve actual domains; not every address at a domain is already a member. |
| deactivate / reactivate account | Disable/restore scoped access | Desactivar / Reactivar | State when only one company’s membership is affected; do not imply global account deletion. |
| sign in / sign out / sign up | Authentication and registration | Iniciar sesión / Cerrar sesión / Registrarse | Distinct from a progress check-in and paid subscription. |
| verification code / activation code | Email verification | Código de verificación / Código de activación | A six-character code is **código de seis caracteres**, not necessarily six digits. |
| API token / API key | Programmatic credentials | Token de API / Clave de API | Keep token and key distinct; plural **tokens de API**. **Revocar** access versus **eliminar** an entry. |
| MCP connection / connected client | External AI client connection | Conexión MCP / Cliente conectado | Client is software here; consent action **Autorizar acceso**. |

## Billing and administration

| English | Meaning/context | Español | Capitalization and usage |
| --- | --- | --- | --- |
| billing | Company payment management | Facturación | **Datos de facturación**; an invoice is **Factura**, not the entire section. |
| plan (billing) | Pricing/service tier | Plan | **Plan gratuito / de pago**. Preserve branded plan names; a work plan is **plan de trabajo**. |
| subscription (paid) | Paid service subscription | Suscripción | Qualify the object when needed; content notifications use Seguir. |
| billing cycle / billing period | Recurrence / current paid interval | Frecuencia de facturación / Período de facturación | Frequency and a specific period’s dates are distinct. |
| checkout / continue to checkout | Payment flow | Pago / Continuar al pago | Does not say payment has already completed. |
| upgrade / downgrade | Move to a higher/lower tier | Cambiar a un plan superior / inferior | Not Actualizar, which means update. |
| cancel plan / cancellation scheduled | End subscription / future end arranged | Cancelar la suscripción / Cancelación programada | Preserve the effective date. **Dejar de seguir** stops content notifications; **Cancelar** alone can dismiss a dialog. |
| member limit / storage limit | Plan capacity | Límite de miembros / Límite de almacenamiento | Member capacity is not a count of jobs or workstations. |
| package / ZIP file | Import/export artifact | Paquete de datos / Archivo ZIP | Not a pricing plan. |
| site admin / SaaS admin panel | Instance-wide operator role/screen | Administrador de la instancia / Administración de la instancia | Distinct from company or space administration. |
| support session / support mode | Operator access for customer assistance | Sesión de soporte / Modo de soporte | Does not make the operator the company owner. |
| feature flag | Experimental-feature control | Activación de función | Group **Funciones experimentales**; preserve machine keys such as `i18n`. |
| site message / update badge | Operator banner / new-version indicator | Mensaje del sistema / Indicador de nueva versión | Neither is a check-in. |

## Context and sentence patterns

Shared source words such as **Target**, **Start**, **Review**, **Update**, **Close**, **Reports**, **Title**, and **Plan** need their contextual meanings above. During translation implementation, add context or specific source wording if a shared key cannot express the required meanings or agreement. Preserve the actual source placeholders, actors, and rich-text tags.

| Situation | Spanish pattern |
| --- | --- |
| Reading confirmation without approval | **{{author}} confirmó la lectura del check-in.** |
| Explain the acknowledgement action | **Confirmas que has leído este check-in.** |
| Role change without assuming a person’s gender | **{{author}} asignó el rol de revisor a {{personName}}.** |
| Object agreement and unchanged names | **{{author}} completó la tarea «{{taskName}}».** |
| Closure without success | **El objetivo se cerró sin haberse alcanzado.** |
| Unchanged titles and contractions | **Se publicó el check-in del proyecto «{{projectName}}».** |
| Deadline counts | **Venció hace 1 día / Venció hace 2 días.** |

## Research references

Official Spanish pages consulted on 2026-10-08 for familiar product terminology.

| Reference | Terminology observed |
| --- | --- |
| [Asana: project progress and status](https://help.asana.com/s/article/project-progress-and-status-updates?language=es) | Actualizaciones de estado, informes de estado, hitos, objetivos, en riesgo, con retraso. |
| [Asana: agile project management](https://asana.com/es/uses/agile-management), [sprint retrospectives](https://asana.com/es/templates/sprint-retro) | Cronograma for the planning view; retrospectiva for an agile reflection meeting. Operately uses Balance final for its written closing reflection. |
| [ClickUp: task data export](https://help.clickup.com/hc/es-419/articles/6310551109527-Exportaci%C3%B3n-de-datos-de-tareas), [table cards](https://help.clickup.com/hc/es/articles/6312270515351-Tarjetas-de-tabla) | Personas asignadas, fecha de vencimiento, listas de verificación, hitos. |
| [Microsoft Viva Goals: check-in reminders](https://learn.microsoft.com/es-es/viva/goals/check-in-reminders) | Check-in / check-ins for recurring OKR progress updates; precedent for retaining the borrowed term. |
| [monday.com: updates](https://support.monday.com/hc/es/articles/115005900249-La-secci%C3%B3n-de-actualizaciones) | Actualizaciones, menciones, notificaciones, conversaciones, publicar. |
| [Notion: sharing and permissions](https://www.notion.com/es-es/help/sharing-and-permissions) | Acceso general, acceso completo, puede editar, puede comentar, puede ver, solo las personas invitadas. |
