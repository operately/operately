defmodule OperatelyEmail.TemplatesTest do
  use ExUnit.Case, async: true

  alias OperatelyEmail.Mailers.NotificationMailer

  @work_emails ~w(
    goal_archived goal_champion_updating goal_check_in_acknowledgement goal_check_in
    goal_closing goal_created goal_description_changed goal_editing goal_reopening goal_reparent
    goal_retrospective_acknowledged goal_reviewer_updating goal_timeframe_editing
    milestone_description_updating milestone_due_date_updating project_archived
    project_champion_updating project_check_in_acknowledged project_check_in_submitted project_closed
    project_contributor_addition project_contributors_addition project_created project_description_changed
    project_due_date_updating project_goal_connection project_goal_disconnection project_milestone_creation
    project_pausing project_resuming project_retrospective_acknowledged project_reviewer_updating
    project_timeline_edited task_assignee_updating task_description_change task_due_date_updating task_moving
  )

  for template <- @work_emails do
    @template template
    test "#{template} translates HTML and plain text while preserving names and links" do
      assigns = assigns()
      {english_html, english_text} = render(@template, assigns, "en")
      {portuguese_html, portuguese_text} = render(@template, assigns, "pt_BR")

      assert english_html != portuguese_html
      assert english_text != portuguese_text

      for body <- [english_html, portuguese_html] do
        assert body =~ "&lt;Ana&gt; S."
        assert body =~ assigns.cta_url
        refute body =~ "%{"
        refute body =~ "<script>"
      end

      for body <- [english_text, portuguese_text] do
        assert body =~ "<Ana> S."
        assert body =~ assigns.cta_url
        refute body =~ "%{"
      end
    end
  end

  test "falls back to complete English sentences when a locale has no translations" do
    for template <- @work_emails do
      assert render(template, assigns(), "en") == render(template, assigns(), "fr")
    end
  end

  test "goal success identifiers remain unchanged in Portuguese" do
    for {success, expected} <- [{"yes", "Marcado como alcançado"}, {"no", "Marcado como não alcançado"}] do
      {html, _} = render("goal_closing", Map.put(assigns(), :success, success), "pt_BR")
      assert html =~ expected
      assert html =~ "User-written update"
    end
  end

  test "renders removed dates, assignments and descriptions in Portuguese" do
    assigns = Map.merge(assigns(), %{new_date: nil, new_assignee: nil, description: nil, champion: nil, reviewer: nil, new_parent_goal: nil})

    for {template, expected} <- [
          {"task_due_date_updating", "A data de conclusão foi removida."},
          {"milestone_due_date_updating", "A data de conclusão foi removida."},
          {"project_due_date_updating", "A data de conclusão foi removida."},
          {"task_description_change", "A descrição foi apagada."},
          {"task_assignee_updating", "O responsável foi removido."},
          {"project_champion_updating", "removeu o champion"},
          {"project_reviewer_updating", "removeu o revisor"},
          {"goal_reparent", "O objetivo superior foi removido"}
        ] do
      {html, _} = render(template, assigns, "pt_BR")
      assert html =~ expected
    end
  end

  defp render(template, assigns, locale) do
    Gettext.with_locale(OperatelyWeb.Gettext, locale, fn ->
      {NotificationMailer.html(template, assigns), NotificationMailer.text(template, assigns)}
    end)
  end

  defp assigns do
    person = %{id: "author", full_name: "<Ana> Silva"}
    resource = %{name: "Launch <script>", title: "Launch <script>"}
    content = Operately.RichContent.Builder.doc([Operately.RichContent.Builder.paragraph([Operately.RichContent.Builder.text("User-written update")])])

    %{
      subject: "Notification",
      author: person,
      person: person,
      goal: resource,
      project: resource,
      milestone: resource,
      goal_name: resource.name,
      project_name: resource.name,
      milestone_name: resource.name,
      task_name: resource.name,
      name: resource.name,
      link: "https://example.com/resource?literal=1",
      cta_url: "https://example.com/resource?literal=1",
      cta_text: "CTA",
      role: "reviewer",
      author_role: "reviewer",
      responsibility: "User responsibility",
      message: content,
      overview: content,
      description: content,
      update: %{message: content},
      check_in: %{description: content},
      retrospective: %{content: content},
      success: "yes",
      checks: [],
      targets: [],
      new_milestones: [resource],
      new_parent_goal: resource,
      champion: person,
      reviewer: person,
      old_champion: person,
      new_champion: person,
      old_reviewer: person,
      new_reviewer: person,
      old_assignee: person,
      new_assignee: person,
      assigned_to_recipient: false,
      removed_from_recipient: false,
      mentioned: false,
      previous_date: "2026-01-01",
      new_date: "2026-02-01",
      due_date: "2026-02-01",
      old_timeframe: %{start_date: ~D[2026-01-01], end_date: ~D[2026-02-01]},
      new_timeframe: %{start_date: ~D[2026-02-01], end_date: ~D[2026-03-01]},
      duration_changed: true,
      old_duration: "1 week",
      new_duration: "2 weeks",
      destination_name: resource.name,
      content: %{
        old_name: "Old name",
        new_name: resource.name,
        old_timeframe: "Q1",
        new_timeframe: "Q2",
        old_champion_id: "old",
        new_champion_id: "new",
        old_reviewer_id: "old",
        new_reviewer_id: "new",
        added_targets: [],
        updated_targets: [],
        deleted_targets: []
      }
    }
  end
end
