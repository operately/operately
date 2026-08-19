defmodule Operately.Support.Features.ProjectTemplatesSteps do
  use Operately.FeatureCase

  alias Operately.Access.Binding
  alias Operately.ContextualDates.ContextualDate
  alias Operately.ProjectTemplates.{Comment, Discussion, ProjectTemplate, ResourceDocument}
  alias Operately.Projects.Project
  alias Operately.Repo
  alias Operately.Support.RichText
  alias OperatelyWeb.Paths

  import Ecto.Query, only: [from: 2]

  step :setup, ctx do
    ctx
    |> Factory.setup()
    |> Factory.enable_feature("project_templates")
    |> Factory.add_space(:space, name: "Product Space")
    |> Factory.add_space(:growth_space, name: "Growth Space")
    |> Factory.add_space_member(:editor, :space, permissions: :edit_access, name: "Erin Editor")
    |> Factory.add_space_member(:commenter, :space, permissions: :comment_access, name: "Casey Commenter")
    |> Factory.add_space_member(:viewer, :space, permissions: :view_access, name: "Vera Viewer")
    |> Factory.add_company_member(:outsider, name: "Omar Outsider")
    |> Map.put(:feature, true)
    |> Factory.log_in_person(:creator)
  end

  step :setup_without_feature, ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space, name: "Product Space")
    |> Factory.add_project(:project, :space, name: "Launch project")
    |> Map.put(:feature, true)
    |> Factory.log_in_person(:creator)
  end

  step :given_templates_exist, ctx do
    ctx
    |> Factory.add_project_template(:launch, :space, name: "Launch kit")
    |> Factory.add_project_template(:onboarding, :space, name: "Onboarding kit")
    |> Factory.add_project_template(:growth, :growth_space, name: "Growth playbook")
  end

  step :given_archived_template_exists, ctx do
    ctx = Factory.add_project_template(ctx, :archived, :space, name: "Archived kit")

    archived =
      ctx.archived
      |> ProjectTemplate.changeset(%{archived_at: DateTime.utc_now()})
      |> Repo.update!()

    %{ctx | archived: archived}
  end

  step :given_blank_template_exists, ctx do
    Factory.add_project_template(ctx, :template, :space, name: "Blank kit")
  end

  step :given_rich_template_exists, ctx do
    ctx
    |> Factory.add_project_template(:template, :space, name: "Reusable kit")
    |> Factory.add_project_template_milestone(:milestone, :template, title: "Kickoff")
    |> Factory.add_project_template_task(:task, :template, name: "Write brief", milestone: :milestone)
    |> Factory.add_project_template_person(:champion_slot, :template, :creator, role: :champion, access_level: Binding.full_access())
    |> Factory.add_project_template_person(:contributor_slot, :template, :editor, role: :contributor, access_level: Binding.edit_access())
    |> Factory.add_project_template_task_assignment(:assignment, :template, :task, :contributor_slot)
    |> Factory.add_project_template_discussion(:discussion, :template, title: "Launch notes", body: RichText.rich_text("Reusable discussion"))
    |> Factory.add_project_template_comment(:discussion_comment, :template, :discussion, content: RichText.rich_text("Keep this comment"))
    |> Factory.add_project_template_resource_document(:document, :template, name: "Launch plan", content: RichText.rich_text("Reusable plan"))
    |> Factory.add_project_template_comment(:document_comment, :template, :document, content: RichText.rich_text("Doc comment"))
  end

  step :given_source_project_exists, ctx do
    ctx
    |> Factory.add_project(:project, :space, name: "Launch project", champion: :creator)
    |> then(&set_project_timeframe(&1, ~D[2028-01-10], ~D[2028-01-20]))
    |> Factory.add_project_discussion(:discussion, :project, title: "Launch notes", message: "Reusable discussion")
    |> Factory.add_comment(:discussion_comment, :discussion, content: RichText.rich_text("Keep this comment"))
    |> Factory.fetch_default_project_resource_hub(:hub, :project)
    |> Factory.add_document(:document, :hub, name: "Launch plan")
    |> Factory.preload(:document, [:resource_hub, :node])
    |> Factory.add_comment(:document_comment, :document, content: RichText.rich_text("Doc comment"))
  end

  step :given_source_project_has_invalid_schedule, ctx do
    set_project_timeframe(ctx, ~D[2028-01-10], ~D[2028-01-09])
  end

  step :fix_source_project_schedule, ctx do
    set_project_timeframe(ctx, ~D[2028-01-10], ~D[2028-01-20])
  end

  step :disable_space_templates_tool, ctx do
    Factory.disable_space_tool(ctx, :space, :templates)
  end

  step(:login_as_creator, ctx, do: Factory.log_in_person(ctx, :creator))
  step(:login_as_editor, ctx, do: Factory.log_in_person(ctx, :editor))
  step(:login_as_commenter, ctx, do: Factory.log_in_person(ctx, :commenter))
  step(:login_as_viewer, ctx, do: Factory.log_in_person(ctx, :viewer))
  step(:login_as_outsider, ctx, do: Factory.log_in_person(ctx, :outsider))

  step :visit_company_library, ctx do
    UI.visit(ctx, Paths.project_templates_path(ctx.company))
  end

  step :visit_space_library, ctx do
    UI.visit(ctx, Paths.space_project_templates_path(ctx.company, ctx.space))
  end

  step :visit_space_page, ctx do
    UI.visit(ctx, Paths.space_path(ctx.company, ctx.space))
  end

  step :visit_template_page, ctx do
    UI.visit(ctx, Paths.project_template_path(ctx.company, ctx.template))
  end

  step :visit_project_page, ctx do
    UI.visit(ctx, Paths.project_path(ctx.company, ctx.project))
  end

  step :visit_new_project_page, ctx do
    UI.visit(ctx, Paths.new_project_path(ctx.company))
  end

  step :assert_empty_library, ctx do
    ctx
    |> UI.assert_has(testid: "project-templates-page")
    |> UI.assert_text("No project templates yet.")
  end

  step :assert_new_template_visible, ctx do
    UI.assert_has(ctx, testid: "new-project-template")
  end

  step :refute_new_template_visible, ctx do
    UI.refute_has(ctx, testid: "new-project-template")
  end

  step :create_blank_template, ctx, name do
    ctx
    |> UI.click(testid: "new-project-template")
    |> UI.fill(testid: "name", with: name)
    |> maybe_select_create_space()
    |> UI.click(testid: "create-project-template")
    |> UI.assert_has(testid: "project-template-page")
    |> UI.assert_text(name)
    |> Map.put(:template, Repo.get_by!(ProjectTemplate, name: name))
  end

  step :search_templates, ctx, query do
    ctx
    |> UI.fill(testid: "project-template-search", with: query)
    |> UI.sleep(400)
  end

  step :clear_template_search, ctx do
    ctx
    |> UI.click(css: "button[aria-label=\"Clear search\"]")
    |> UI.sleep(400)
  end

  step :filter_library_by_space, ctx, space_name do
    ctx
    |> UI.click(testid: "project-template-space-filter")
    |> UI.click_text("Choose another space")
    |> UI.click(testid: UI.testid(["project-template-space-filter", "search-result", space_name]))
    |> UI.sleep(200)
  end

  step :assert_template_listed, ctx, name do
    UI.assert_text(ctx, name)
  end

  step :refute_template_listed, ctx, name do
    UI.refute_text(ctx, name)
  end

  step :filter_templates_by_status, ctx, status do
    ctx
    |> UI.click(testid: "project-template-status-filter")
    |> UI.click_text(status)
    |> UI.sleep(300)
  end

  step :duplicate_template_from_library, ctx, opts do
    template = Map.fetch!(ctx, Keyword.fetch!(opts, :template))
    name = Keyword.fetch!(opts, :name)

    ctx
    |> UI.click(testid: "project-template-actions-#{Paths.project_template_id(template)}")
    |> UI.click_text("Duplicate")
    |> UI.assert_has(testid: "duplicate-project-template-form")
    |> UI.fill(testid: "name", with: name)
    |> UI.click(testid: "duplicate-project-template")
    |> UI.assert_has(testid: "project-template-page")
    |> UI.assert_text(name)
    |> Map.put(:template, Repo.get_by!(ProjectTemplate, name: name))
  end

  step :archive_template_from_library, ctx, template_key do
    template = Map.fetch!(ctx, template_key)

    ctx
    |> UI.click(testid: "project-template-actions-#{Paths.project_template_id(template)}")
    |> UI.click_text("Archive")
    |> UI.assert_text("This template will leave project creation and can be restored later.")
    |> UI.click_button("Archive template")
    |> UI.sleep(300)
  end

  step :restore_template_from_library, ctx, template_key do
    template = Map.fetch!(ctx, template_key)

    ctx
    |> UI.click(testid: "project-template-actions-#{Paths.project_template_id(template)}")
    |> UI.click_text("Restore")
    |> UI.assert_text("This template will return to active use and project creation.")
    |> UI.click_button("Restore template")
    |> UI.sleep(300)
  end

  step :delete_template_from_library, ctx, template_key do
    template = Map.fetch!(ctx, template_key)

    ctx
    |> UI.click(testid: "project-template-actions-#{Paths.project_template_id(template)}")
    |> UI.click_text("Delete")
    |> UI.assert_text("Existing projects created from it will remain unchanged.")
    |> UI.click_button("Delete template")
    |> UI.sleep(300)
  end

  step :archive_template_from_editor, ctx do
    ctx
    |> UI.click(testid: "archive-project-template")
    |> UI.assert_text("This template will leave project creation and can be restored later.")
    |> UI.click_button("Archive template")
    |> UI.assert_text("Archived")
  end

  step :assert_template_actions_hidden, ctx, template_key do
    template = Map.fetch!(ctx, template_key)
    UI.refute_has(ctx, testid: "project-template-actions-#{Paths.project_template_id(template)}")
  end

  step :assert_template_editor_actions_hidden, ctx do
    UI.refute_has(ctx, testid: "actions-section")
  end

  step :assert_template_deleted, ctx, template_key do
    template = Map.fetch!(ctx, template_key)
    assert Repo.get(ProjectTemplate, template.id) == nil
    ctx
  end

  step :remember_generated_project, ctx, name do
    Map.put(ctx, :generated_project, Repo.get_by!(Project, name: name))
  end

  step :assert_generated_project_unchanged_after_template_deletion, ctx do
    project = Repo.get!(Project, ctx.generated_project.id)
    assert project.source_template_id == nil

    ctx
    |> UI.visit(Paths.project_path(ctx.company, project))
    |> UI.assert_has(testid: "project-page")
    |> UI.assert_text(project.name)
  end

  step :open_template_from_library, ctx, name do
    template = Repo.get_by!(ProjectTemplate, name: name)

    ctx
    |> UI.click(testid: "project-template-#{Paths.project_template_id(template)}")
    |> UI.assert_has(testid: "project-template-page")
    |> Map.put(:template, template)
  end

  step :assert_space_templates_tool_visible, ctx do
    UI.assert_has(ctx, testid: "templates-tool")
  end

  step :refute_space_templates_tool_visible, ctx do
    UI.refute_has(ctx, testid: "templates-tool")
  end

  step :open_space_library_from_tool, ctx do
    ctx
    |> UI.click(testid: "templates-tool")
    |> UI.assert_has(testid: "project-templates-page")
  end

  step :rename_template, ctx, name do
    ctx
    |> UI.fill_text_field(testid: "project-name-field", with: name, submit: true)
    |> UI.assert_text(name)
  end

  step :edit_template_description, ctx, text do
    ctx
    |> UI.click_text("Add a template description...")
    |> UI.fill_rich_text(text)
    |> UI.click_button("Save")
    |> UI.assert_text(text)
  end

  step :set_template_duration, ctx, days do
    ctx
    |> UI.click(testid: "template-duration")
    |> UI.fill(testid: "template-duration-input", with: Integer.to_string(days))
    |> UI.press_enter()
    |> UI.assert_text("#{days} days after project starts")
  end

  step :add_template_milestone, ctx, title do
    ctx
    |> UI.click(testid: "add-template-milestone-overview")
    |> UI.fill(testid: "template-milestone-name", with: title)
    |> UI.click_button("Create milestone")
    |> UI.sleep(400)
    |> UI.assert_text(title)
  end

  step :add_template_task, ctx, name do
    ctx
    |> UI.visit(Paths.project_template_path(ctx.company, loaded_template(ctx), tab: "tasks"))
    |> UI.click(testid: "add-template-task")
    |> UI.fill(testid: "template-task-title", with: name)
    |> UI.click_button("Create task")
    |> UI.assert_text(name)
  end

  step :assert_workflow_settings_visible, ctx do
    ctx
    |> UI.click(css: "button[aria-label=\"Settings\"]")
    |> UI.assert_text("Manage statuses")
  end

  step :add_template_contributor, ctx do
    ctx
    |> UI.click(testid: "tab-overview")
    |> UI.click(testid: "add-template-contributor")
    |> UI.click(testid: "person-field")
    |> UI.click(testid: UI.testid(["person-field", "search-result", ctx.editor.full_name]))
    |> UI.click_button("Save contributor")
    |> UI.assert_text(ctx.editor.full_name)
  end

  step :add_template_discussion, ctx, title do
    ctx
    |> visit_template_tab("discussions")
    |> UI.click(testid: "start-template-discussion")
    |> UI.fill(testid: "discussion-title", with: title)
    |> UI.fill_rich_text("Reusable discussion body")
    |> UI.click(testid: "save-template-discussion")
    |> UI.assert_has(testid: "template-discussion-page")
    |> UI.assert_text(title)
  end

  step :add_template_comment, ctx, text do
    ctx
    |> UI.click_text("Write a comment here...")
    |> UI.fill_rich_text(text)
    |> UI.click(testid: "post-comment")
    |> UI.assert_text(text)
  end

  step :add_template_document, ctx, name do
    ctx
    |> visit_template_tab("docs-and-files")
    |> UI.click(testid: "add-options")
    |> UI.click(testid: "new-document")
    |> UI.fill(testid: "title", with: name)
    |> UI.fill_rich_text("Reusable document body")
    |> UI.click_button("Create document")
    |> UI.assert_text(name)
  end

  step :refute_overview_editable, ctx do
    ctx
    |> UI.refute_has(testid: "edit-description")
    |> UI.refute_has(testid: "add-template-milestone-overview")
  end

  step :open_template_discussion, ctx do
    UI.visit(ctx, Paths.project_template_discussion_path(ctx.company, ctx.template, ctx.discussion))
  end

  step :open_template_milestone, ctx, title do
    ctx
    |> UI.click_link(title)
    |> UI.assert_has(testid: "template-milestone-page")
  end

  step :assert_template_milestone_page, ctx do
    UI.assert_has(ctx, testid: "template-milestone-page")
  end

  step :rename_template_milestone, ctx, name do
    ctx
    |> UI.fill_text_field(testid: "milestone-name-input", with: name, submit: true)
    |> UI.assert_text(name)
  end

  step :add_template_milestone_task, ctx, name do
    ctx
    |> UI.click(testid: "template-tasks-section-add-task")
    |> UI.fill(Wallaby.Query.css("[data-test-id^=\"inline-template-task-creator-milestonepage\"]"), with: name)
    |> UI.press_enter()
    |> UI.click_button("Cancel")
    |> UI.assert_text(name)
  end

  step :visit_template_tasks_tab, ctx do
    visit_template_tab(ctx, "tasks")
  end

  step :assert_comment_composer_visible, ctx do
    UI.assert_text(ctx, "Write a comment here...")
  end

  step :refute_comment_composer_visible, ctx do
    UI.refute_text(ctx, "Write a comment here...")
  end

  step :assert_copied_comment_visible, ctx do
    UI.assert_text(ctx, "Keep this comment")
  end

  step :create_project_from_library_card, ctx, opts do
    template = Map.fetch!(ctx, opts[:template])

    ctx
    |> UI.click(testid: "create-project-from-template-#{Paths.project_template_id(template)}")
    |> UI.assert_text("Start a new project")
    |> UI.fill(testid: "name", with: Keyword.get(opts, :name, "Generated project"))
    |> UI.assert_has(testid: "startdate")
  end

  step :start_new_project_from_menu, ctx do
    ctx
    |> UI.visit(Paths.home_path(ctx.company))
    |> UI.click(testid: "new-dropdown")
    |> UI.click(testid: "new-dropdown-new-project")
  end

  step :select_new_project_space, ctx, space_name do
    ctx
    |> UI.click(testid: "space")
    |> UI.click_text(space_name)
  end

  step :select_new_project_template, ctx, name do
    ctx
    |> UI.click(testid: "template")
    |> UI.click_text(name)
  end

  step :assert_new_project_template_option, ctx, name do
    ctx
    |> UI.click(testid: "template")
    |> UI.assert_text(name)
  end

  step :refute_new_project_template_option, ctx, name do
    ctx
    |> UI.click(testid: "template")
    |> UI.refute_text(name)
  end

  step :submit_new_project_without_start_date, ctx do
    ctx
    |> UI.fill(testid: "name", with: "Missing start date")
    |> UI.click(testid: "submit")
    |> UI.assert_text("Select a project start date.")
  end

  step :submit_new_project_from_template, ctx, opts do
    ctx
    |> UI.fill(testid: "name", with: Keyword.get(opts, :name, "Generated project"))
    |> UI.select_day_in_date_field(testid: "startdate", date: Keyword.get(opts, :start_date, Date.add(Date.utc_today(), 7)))
    |> UI.click(testid: "submit")
    |> UI.assert_has(testid: "project-page")
  end

  step :assert_generated_project_content, ctx, opts do
    ctx
    |> UI.assert_text(Keyword.fetch!(opts, :name))
    |> UI.click(testid: "tab-discussions")
    |> UI.assert_text(Keyword.fetch!(opts, :discussion))
  end

  step :assert_save_as_template_visible, ctx do
    UI.assert_has(ctx, testid: "save-project-as-template-action")
  end

  step :refute_save_as_template_visible, ctx do
    UI.refute_has(ctx, testid: "save-project-as-template-action")
  end

  step :open_save_as_template_modal, ctx do
    ctx
    |> UI.click(testid: "save-project-as-template-action")
    |> UI.assert_has(testid: "save-project-as-template-form")
  end

  step :assert_include_option_defaults, ctx do
    ctx
    |> assert_switch("People and assignments", "unchecked")
    |> assert_switch("Discussions", "checked")
    |> assert_switch("Comments", "unchecked")
    |> assert_switch("Docs & Files", "checked")
  end

  step :cancel_save_as_template, ctx do
    ctx
    |> UI.click_button("Cancel")
    |> UI.assert_has(testid: "project-page")
    |> then(fn ctx ->
      assert Repo.aggregate(ProjectTemplate, :count) == 0
      ctx
    end)
  end

  step :submit_save_as_template, ctx, opts \\ [] do
    ctx
    |> maybe_fill_template_name(Keyword.get(opts, :name))
    |> maybe_toggle_includes(Keyword.get(opts, :includes, []))
    |> UI.click(testid: "save-project-as-template")
    |> UI.sleep(300)
  end

  step :assert_schedule_validation_error, ctx do
    ctx
    |> UI.assert_text("Some dates are before the project start date.")
    |> then(fn ctx ->
      assert Repo.aggregate(ProjectTemplate, :count) == 0
      ctx
    end)
  end

  step :assert_saved_template_opened, ctx, name do
    ctx
    |> UI.assert_has(testid: "project-template-page")
    |> UI.assert_text(name)
    |> Map.put(:template, Repo.get_by!(ProjectTemplate, name: name))
  end

  step :assert_template_includes, ctx, opts do
    template = loaded_template(ctx)
    discussion_count = Repo.aggregate(from(d in Discussion, where: d.project_template_id == ^template.id), :count)
    comment_count = Repo.aggregate(from(c in Comment, where: c.project_template_id == ^template.id), :count)
    document_count = Repo.aggregate(from(d in ResourceDocument, join: n in assoc(d, :node), where: n.project_template_id == ^template.id), :count)

    if Keyword.has_key?(opts, :discussions) do
      if opts[:discussions], do: assert(discussion_count > 0), else: assert(discussion_count == 0)
    end

    if Keyword.has_key?(opts, :comments) do
      if opts[:comments], do: assert(comment_count > 0), else: assert(comment_count == 0)
    end

    if Keyword.has_key?(opts, :docs) do
      if opts[:docs], do: assert(document_count > 0), else: assert(document_count == 0)
    end

    ctx
  end

  step :change_source_project_discussion, ctx do
    from(thread in Operately.Comments.CommentThread, where: thread.parent_id == ^ctx.project.id)
    |> Repo.update_all(set: [title: "Changed after copy"])

    ctx
  end

  step :assert_template_discussion_unchanged, ctx do
    template = loaded_template(ctx)
    titles = Repo.all(from(d in Discussion, where: d.project_template_id == ^template.id, select: d.title))

    assert "Launch notes" in titles
    refute "Changed after copy" in titles
    ctx
  end

  step :assert_library_redirects_when_gated, ctx do
    ctx
    |> UI.visit(Paths.project_templates_path(ctx.company))
    |> UI.assert_has(testid: "company-home")
    |> UI.refute_has(testid: "project-templates-page")
  end

  step :refute_template_field_on_new_project, ctx do
    ctx
    |> UI.visit(Paths.new_project_path(ctx.company))
    |> UI.refute_has(testid: "template")
  end

  defp maybe_select_create_space(ctx) do
    if element_visible?(ctx, "new-project-template-space") do
      ctx
      |> UI.click(testid: "new-project-template-space")
      |> UI.click(testid: UI.testid(["new-project-template-space", "search-result", ctx.space.name]))
    else
      ctx
    end
  end

  defp maybe_fill_template_name(ctx, nil), do: ctx
  defp maybe_fill_template_name(ctx, name), do: UI.fill(ctx, testid: "name", with: name)

  defp maybe_toggle_includes(ctx, []), do: ctx

  defp maybe_toggle_includes(ctx, includes) do
    Enum.reduce(includes, ctx, fn {label, enabled?}, ctx ->
      current = switch_state(ctx, label)
      desired = if enabled?, do: "checked", else: "unchecked"

      if current == desired do
        ctx
      else
        UI.click(ctx, css: ~s(button[aria-label="#{label}"]))
      end
    end)
  end

  defp assert_switch(ctx, label, state) do
    UI.assert_has(ctx, css: ~s([aria-label="#{label}"][data-state="#{state}"]))
  end

  defp switch_state(ctx, label) do
    session = ctx.session
    checked? = Wallaby.Browser.has?(session, Wallaby.Query.css(~s([aria-label="#{label}"][data-state="checked"]), count: :any))
    if checked?, do: "checked", else: "unchecked"
  end

  defp element_visible?(ctx, testid) do
    Wallaby.Browser.has?(ctx.session, Wallaby.Query.css("[data-test-id=\"#{testid}\"]", count: :any))
  end

  defp visit_template_tab(ctx, tab) do
    ctx
    |> UI.visit(Paths.home_path(ctx.company))
    |> UI.visit(Paths.project_template_path(ctx.company, loaded_template(ctx), tab: tab))
  end

  defp loaded_template(ctx) do
    cond do
      Map.has_key?(ctx, :template) -> ctx.template
      true -> Repo.one!(from(t in ProjectTemplate, order_by: [desc: t.inserted_at], limit: 1))
    end
  end

  defp timeframe(start_date, end_date) do
    %{
      contextual_start_date: ContextualDate.create_day_date(start_date),
      contextual_end_date: ContextualDate.create_day_date(end_date)
    }
  end

  defp set_project_timeframe(ctx, start_date, end_date) do
    project =
      ctx.project
      |> Project.changeset(%{timeframe: timeframe(start_date, end_date)})
      |> Repo.update!()

    %{ctx | project: project}
  end
end
