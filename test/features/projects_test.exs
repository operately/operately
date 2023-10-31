defmodule Operately.Features.ProjectsTest do
  use Operately.FeatureCase

  import Operately.PeopleFixtures

  alias Operately.Support.Features.ProjectSteps
  alias Operately.Support.Features.NotificationsSteps
  alias Operately.Support.Features.EmailSteps

  setup ctx do
    ctx = ProjectSteps.create_project(ctx, name: "Test Project")
    ctx = ProjectSteps.login(ctx)

    {:ok, ctx}
  end

  @tag login_as: :champion
  feature "listing projects", ctx do
    ctx
    |> visit_index()
    |> UI.assert_has(Query.text(ctx.project.name))
  end

  @tag login_as: :champion
  feature "editing the project description", ctx do
    ctx
    |> visit_show(ctx.project)
    |> click_edit_description()
    |> UI.fill_rich_text(project_description())
    |> click_save()

    # by default only the top of text is visible
    ctx
    |> UI.assert_has(Query.text("TEXT START MARKER"))
    |> UI.refute_has(Query.text("TEXT END MARKER"))

    # the text can be expanded
    ctx
    |> expand_description()
    |> UI.assert_has(Query.text("TEXT END MARKER"))
  end

  @tag login_as: :champion
  feature "listing key resources", ctx do
    add_key_resource(ctx.project, %{title: "Code Repository", link: "https://github.com/operately/operately", type: "github"})
    add_key_resource(ctx.project, %{title: "Website", link: "https://operately.com", type: "generic"})

    ctx
    |> visit_show(ctx.project)
    |> UI.assert_has(Query.text("Code Repository"))
    |> UI.assert_has(Query.text("Website"))
  end

  @tag login_as: :champion
  feature "adding key resources to a project", ctx do
    ctx
    |> visit_show(ctx.project)
    |> UI.click(testid: "add-key-resource")
    |> UI.fill("Title", with: "Code Repository")
    |> UI.fill("URL", with: "https://github.com/operately/operately")
    |> UI.click(testid: "save-key-resource")
    |> UI.assert_has(Query.text("Code Repository"))
  end

  @tag login_as: :champion
  feature "editing key resources on a project", ctx do
    add_key_resource(ctx.project, %{title: "Code Repository", link: "https://github.com/operately/operately", type: "github"})

    ctx
    |> visit_show(ctx.project)
    |> UI.assert_has(Query.text("Code Repository"))
    |> UI.click(testid: "key-resource-options")
    |> UI.click(testid: "edit-key-resource")
    |> UI.fill("Title", with: "Github Repository")
    |> UI.fill("URL", with: "https://github.com/operately/kpiexamples")
    |> UI.refute_has(Query.text("Github Repository"))
  end

  @tag login_as: :champion
  feature "removing key resources from a project", ctx do
    add_key_resource(ctx.project, %{title: "Code Repository", link: "https://github.com/operately/operately", type: "github"})

    ctx
    |> visit_show(ctx.project)
    |> UI.assert_has(Query.text("Code Repository"))
    |> UI.click(testid: "key-resource-options")
    |> UI.click(testid: "remove-key-resource")
    |> UI.refute_has(Query.text("Code Repository"))
  end

  @tag login_as: :champion
  feature "react to a comment", ctx do
    {:ok, update} = add_status_update(ctx.project, "This is a status update.", ctx.champion.id)
    {:ok, comment} = add_comment(update, "This is a comment.", ctx.champion.id)

    ctx
    |> visit_show(ctx.project)
    |> UI.assert_has(Query.text("This is a comment."))
    |> UI.find(testid: "comment-#{comment.id}")
    |> UI.click(testid: "reactions-button")
    |> UI.click(testid: "reaction-thumbs_up-button")
    |> UI.assert_has(testid: "reaction-thumbs_up")
  end

  @tag login_as: :champion
  feature "react to a status update", ctx do
    add_status_update(ctx.project, "This is a status update.", ctx.champion.id)

    ctx
    |> visit_show(ctx.project)
    |> UI.click(testid: "reactions-button")
    |> UI.click(testid: "reaction-thumbs_up-button")
    |> UI.assert_has(testid: "reaction-thumbs_up")
  end

  @tag login_as: :champion
  feature "adding a project contributor", ctx do
    contrib = person_fixture(%{full_name: "Michael Scott", title: "Manager", company_id: ctx.company.id})

    ctx
    |> visit_show(ctx.project)
    |> UI.click(testid: "project-contributors")
    |> UI.click(testid: "add-contributor-button")
    |> UI.select_person(contrib.full_name)
    |> UI.fill(testid: "contributor-responsibility-input", with: "Lead the project")
    |> UI.click(testid: "save-contributor")

    ctx
    |> visit_show(ctx.project)
    |> UI.assert_text(short_name(ctx.champion) <> " added " <> short_name(contrib) <> " to the project.")
  end

  @tag login_as: :champion
  feature "removing a project contributor", ctx do
    contrib = person_fixture(%{full_name: "Michael Scott", title: "Manager", company_id: ctx.company.id})
    add_contributor(ctx.project, contrib, "contributor")

    ctx
    |> visit_show(ctx.project)
    |> UI.click(testid: "project-contributors")
    |> UI.hover(testid: "contributor-#{contrib.id}")
    |> UI.click(testid: "edit-contributor")
    |> UI.click(testid: "remove-contributor")
    |> UI.refute_has(Query.text("Michael Scott"))

    ctx
    |> visit_show(ctx.project)
    |> UI.assert_text(short_name(ctx.champion) <> " removed " <> short_name(contrib) <> " from the project.")
  end

  @tag login_as: :champion
  feature "archive a project", ctx do
    ctx
    |> visit_show(ctx.project)
    |> UI.click(testid: "project-options-button")
    |> UI.click(testid: "archive-project-button")

    ctx
    |> visit_index()
    |> UI.refute_has(Query.text(ctx.project.name))

    ctx
    |> UI.login_as(ctx.reviewer)
    |> NotificationsSteps.assert_project_archived_sent(author: ctx.champion, project: ctx.project)
    |> EmailSteps.assert_project_archived_sent(author: ctx.champion, project: ctx.project, to: ctx.reviewer)
  end

  @tag login_as: :champion
  feature "rename a project", ctx do
    ctx
    |> visit_show(ctx.project)
    |> UI.click(testid: "project-options-button")
    |> UI.click(testid: "edit-project-name-button")
    |> UI.fill(testid: "project-name-input", with: "New Name")
    |> UI.click(testid: "save")

    ctx
    |> visit_show(ctx.project)
    |> UI.assert_text("New Name")
  end

  @tag login_as: :champion
  feature "edit project timeline", ctx do
    ctx
    |> visit_show(ctx.project)
    |> UI.click(testid: "edit-project-timeline")
    |> UI.click(testid: "planning-start")
    |> UI.click(css: ".react-datepicker__day.react-datepicker__day--010")
    |> UI.click(testid: "planning-due")
    |> UI.click(css: ".react-datepicker__day.react-datepicker__day--011")
    |> UI.click(testid: "execution-due")
    |> UI.click(css: ".react-datepicker__day.react-datepicker__day--012")
    |> UI.click(testid: "control-due")
    |> UI.click(css: ".react-datepicker__day.react-datepicker__day--013")
    |> UI.click(testid: "save")

    project = Operately.Projects.get_project!(ctx.project.id)
    phases = Operately.Projects.list_project_phase_history(project)
    planning = Enum.find(phases, fn phase -> phase.phase == :planning end)
    execution = Enum.find(phases, fn phase -> phase.phase == :execution end)
    control = Enum.find(phases, fn phase -> phase.phase == :control end)

    assert project.started_at == day_in_current_month(10)
    assert project.deadline == day_in_current_month(13)

    assert planning.start_time == day_in_current_month(10)
    assert planning.due_time == day_in_current_month(11)
    assert execution.start_time == day_in_current_month(11)
    assert execution.due_time == day_in_current_month(12)
    assert control.start_time == day_in_current_month(12)
    assert control.due_time == day_in_current_month(13)
  end

  # ===========================================================================

  defp visit_index(ctx) do
    UI.visit(ctx, "/projects")
  end

  defp visit_show(ctx, project) do
    UI.visit(ctx, "/projects" <> "/" <> project.id)
  end

  def click_edit_description(ctx) do
    UI.click(ctx, testid: "edit-project-description")
  end

  def expand_description(ctx) do
    UI.click(ctx, testid: "expand-project-description")
  end

  def click_save(ctx) do
    UI.click(ctx, Query.button("Save"))
  end

  def add_key_resource(project, attrs) do
    {:ok, _} = Operately.Projects.create_key_resource(%{project_id: project.id} |> Map.merge(attrs))
  end

  defp project_description() do
    """
    SuperPace is an innovative project designed to track and quantify DevOps
    TEXT START MARKER <- this is the start of the text
    Research and Assessment (DORA) metrics for organizations across the globe. The
    project's primary goal is to empower development and operations teams by
    providing insightful, actionable data to drive performance and productivity
    improvements.

    DORA includes some fancy stuff that is mentioned in this line

    SuperPace will do something called Y, instead of X

    SuperPace utilizes cutting-edge data collection and analytics technologies to
    meticulously gather, measure, and interpret key DORA metrics, including
    deployment frequency, lead time for changes, time to restore service, and
    change failure rate. By translating these metrics into practical insights,
    SuperPace fosters continuous learning, enhances collaboration, and accelerates
    the pace of innovation in the complex, fast-paced world.
    TEXT END MARKER <- this is the end of the text
    """
  end

  def add_status_update(project, text, author_id) do
    {:ok, _} =
      Operately.Updates.create_update(%{
        type: :status_update,
        updatable_type: :project,
        updatable_id: project.id,
        content: %{
          "message" => rich_text_paragraph(text),
          "old_health" => "on_track",
          "new_health" => "on_track",
        },
        author_id: author_id
      })
  end

  def add_comment(update, text, author_id) do
    {:ok, _} =
      Operately.Updates.create_comment(update, %{
        update_id: update.id,
        content: %{
          "message" => Jason.encode!(rich_text_paragraph(text))
        },
        author_id: author_id
      })
  end

  defp short_name(person), do: Operately.People.Person.short_name(person)
  defp rich_text_paragraph(text), do: Operately.UpdatesFixtures.rich_text_fixture(text)

  defp add_contributor(project, person, role, responsibility \\ " ") do
    {:ok, _} = Operately.Projects.create_contributor(%{
      person_id: person.id, 
      role: role, 
      project_id: project.id, 
      responsibility: responsibility
    })
  end

  def day_in_current_month(day) do
    today = Date.utc_today()

    {:ok, date} = Date.from_erl({today.year, today.month, day})
    {:ok, date} = NaiveDateTime.new(date, ~T[00:00:00])

    DateTime.from_naive!(date, "Etc/UTC")
  end

end
