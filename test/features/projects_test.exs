defmodule Operately.Features.ProjectsTest do
  use Operately.FeatureCase

  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.UpdatesFixtures

  alias Operately.Support.Features.ProjectSteps
  alias Operately.Support.Features.ProjectFeedSteps
  alias Operately.Support.Features.NotificationsSteps
  alias Operately.Support.Features.EmailSteps

  setup ctx do
    ctx = ProjectSteps.create_project(ctx, name: "Test Project")
    ctx = ProjectSteps.login(ctx)

    {:ok, ctx}
  end

  # @tag login_as: :champion
  # feature "react to a comment", ctx do
  #   {:ok, update} = add_status_update(ctx.project, "This is a status update.", ctx.champion.id)
  #   {:ok, comment} = add_comment(update, "This is a comment.", ctx.champion.id)

  #   ctx
  #   |> visit_show(ctx.project)
  #   |> UI.assert_has(Query.text("This is a comment."))
  #   |> UI.find(testid: "comment-#{comment.id}")
  #   |> UI.click(testid: "reactions-button")
  #   |> UI.click(testid: "reaction-thumbs_up-button")
  #   |> UI.assert_has(testid: "reaction-thumbs_up")
  # end

  # @tag login_as: :champion
  # feature "react to a status update", ctx do
  #   add_status_update(ctx.project, "This is a status update.", ctx.champion.id)

  #   ctx
  #   |> visit_show(ctx.project)
  #   |> UI.click(testid: "reactions-button")
  #   |> UI.click(testid: "reaction-thumbs_up-button")
  #   |> UI.assert_has(testid: "reaction-thumbs_up")
  # end

  @tag login_as: :champion
  feature "adding a project contributor", ctx do
    contrib = person_fixture(%{full_name: "Michael Scott", title: "Manager", company_id: ctx.company.id})

    ctx
    |> visit_show(ctx.project)
    |> UI.click(testid: "manage-team-button")
    |> UI.click(testid: "add-contributor-button")
    |> UI.select_person(contrib.full_name)
    |> UI.fill(testid: "contributor-responsibility-input", with: "Lead the project")
    |> UI.click(testid: "save-contributor")

    # ctx
    # |> visit_show(ctx.project)
    # |> UI.assert_text(short_name(ctx.champion) <> " added " <> short_name(contrib) <> " to the project.")
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

    ctx
    |> visit_show(ctx.project)
    |> UI.click(testid: "project-contributors")
    |> UI.refute_has(Query.text("Michael Scott"))

    # ctx
    # |> visit_show(ctx.project)
    # |> UI.assert_text(short_name(ctx.champion) <> " removed " <> short_name(contrib) <> " from the project.")
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
  feature "move project to a different space", ctx do
    new_space = group_fixture(ctx.champion, %{name: "New Space", company_id: ctx.company.id})

    ctx
    |> visit_show(ctx.project)
    |> UI.click(testid: "project-options-button")
    |> UI.click(testid: "move-project-link")
    |> UI.click(testid: "space-#{new_space.id}")

    ctx
    |> UI.login_as(ctx.reviewer)
    |> NotificationsSteps.assert_project_moved_sent(author: ctx.champion, old_space: ctx.group, new_space: new_space)
    
    ctx
    |> visit_show(ctx.project)
    |> ProjectFeedSteps.assert_project_moved(author: ctx.champion, old_space: ctx.group, new_space: new_space)
  end

  @tag login_as: :champion
  feature "edit project timeline", ctx do
    ctx
    |> ProjectSteps.add_milestone(%{title: "Contract Signed", deadline_at: day_in_current_month(20)})
    |> ProjectSteps.visit_project_page()
    |> UI.click(testid: "edit-project-timeline")
    |> UI.click(testid: "planning-start")
    |> UI.click(css: ".react-datepicker__day.react-datepicker__day--010")
    |> UI.click(testid: "planning-due")
    |> UI.click(css: ".react-datepicker__day.react-datepicker__day--011")
    |> UI.click(testid: "execution-due")
    |> UI.click(css: ".react-datepicker__day.react-datepicker__day--012")
    |> UI.click(testid: "control-due")
    |> UI.click(css: ".react-datepicker__day.react-datepicker__day--013")
    |> UI.click(testid: "milestone-contract-signed-due")
    |> UI.click(css: ".react-datepicker__day.react-datepicker__day--012")
    |> UI.click(testid: "add-milestone")
    |> UI.fill(testid: "new-milestone-title", with: "Website Launched")
    |> UI.click(testid: "new-milestone-due")
    |> UI.click(css: ".react-datepicker__day.react-datepicker__day--013")
    |> UI.click(testid: "add-milestone-button")
    |> UI.click(testid: "save")

    :timer.sleep(200)

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

    milestones = Operately.Projects.list_project_milestones(project)
    contract = Enum.find(milestones, fn milestone -> milestone.title == "Contract Signed" end)
    website = Enum.find(milestones, fn milestone -> milestone.title == "Website Launched" end)

    assert DateTime.from_naive!(contract.deadline_at, "Etc/UTC") == day_in_current_month(12)
    assert DateTime.from_naive!(website.deadline_at, "Etc/UTC") == day_in_current_month(13)

    ctx
    |> UI.login_as(ctx.reviewer)
    |> NotificationsSteps.assert_project_timeline_edited_sent(author: ctx.champion)
    |> EmailSteps.assert_project_timeline_edited_sent(author: ctx.champion, to: ctx.reviewer)
  end

  # ===========================================================================

  defp visit_index(ctx) do
    UI.visit(ctx, "/spaces" <> "/" <> ctx.group.id)
  end

  defp visit_show(ctx, project) do
    UI.visit(ctx, "/projects" <> "/" <> project.id)
  end

  defp add_key_resource(project, attrs) do
    {:ok, _} = Operately.Projects.create_key_resource(%{project_id: project.id} |> Map.merge(attrs))
  end

  def add_status_update(project, text, author_id) do
    {:ok, _} =
      Operately.Updates.create_update(%{
        type: :status_update,
        updatable_type: :project,
        updatable_id: project.id,
        content: %{
          "message" => rich_text_paragraph(text),
          "health" => update_health_fixture()
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
