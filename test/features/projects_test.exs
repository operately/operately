defmodule Operately.Features.ProjectsTest do
  use Operately.FeatureCase

  import Operately.PeopleFixtures
  import Operately.GroupsFixtures

  alias Operately.People.Person
  alias Operately.Support.Features.ProjectSteps
  alias Operately.Support.Features.FeedSteps
  alias Operately.Support.Features.NotificationsSteps
  alias Operately.Support.Features.EmailSteps
  alias Operately.Support.Features.FeedSteps

  setup ctx do
    ctx = ProjectSteps.create_project(ctx, name: "Test Project")
    ctx = ProjectSteps.login(ctx)

    {:ok, ctx}
  end

  @tag login_as: :champion
  feature "adding a project contributor", ctx do
    contrib = person_fixture_with_account(%{
      full_name: "Michael Scott", 
      title: "Manager", 
      company_id: ctx.company.id
    })

    ctx
    |> visit_show(ctx.project)
    |> UI.click(testid: "manage-team-button")
    |> UI.click(testid: "add-contributor-button")
    |> UI.select_person_in(id: "people-search", name: contrib.full_name)
    |> UI.fill(testid: "contributor-responsibility-input", with: "Lead the project")
    |> UI.click(testid: "save-contributor")

    ctx
    |> visit_show(ctx.project)
    |> FeedSteps.assert_feed_item_exists(%{
      author: ctx.champion,
      title: "added #{Person.short_name(contrib)} to the project",
    })

    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.project.name,
      to: contrib,
      author: ctx.champion, 
      action: "added you as a contributor"
    })

    ctx
    |> UI.login_as(contrib)
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.champion,
      action: "added you as a contributor"
    })
  end

  @tag login_as: :champion
  feature "removing a project contributor", ctx do
    contrib = person_fixture(%{full_name: "Michael Scott", title: "Manager", company_id: ctx.company.id})
    add_contributor(ctx.project, contrib, "contributor")

    ctx
    |> visit_show(ctx.project)
    |> UI.click(testid: "project-contributors")
    |> UI.click(testid: "edit-contributor-michael-scott")
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
    |> UI.click(testid: "archive-project-link")
    |> UI.assert_text("Archive this project?")
    |> UI.click(testid: "archive-project-button")
    |> UI.assert_text("This project was archived on")
    |> FeedSteps.assert_project_archived(author: ctx.champion)

    ctx
    |> visit_index()
    |> UI.refute_has(Query.text(ctx.project.name))

    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.group.name,
      to: ctx.reviewer, 
      author: ctx.champion, 
      action: "archived the #{ctx.project.name} project"
    })

    ctx
    |> UI.login_as(ctx.reviewer)
    |> NotificationsSteps.assert_project_archived_sent(author: ctx.champion, project: ctx.project)
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
    |> FeedSteps.assert_project_moved(author: ctx.champion, old_space: ctx.group, new_space: new_space)
  end

  #
  # ======== Helper functions ========
  #

  defp visit_index(ctx) do
    UI.visit(ctx, "/spaces" <> "/" <> ctx.group.id)
  end

  defp visit_show(ctx, project) do
    UI.visit(ctx, "/projects" <> "/" <> project.id)
  end

  defp add_contributor(project, person, role, responsibility \\ " ") do
    {:ok, _} = Operately.Projects.create_contributor(%{
      person_id: person.id, 
      role: role, 
      project_id: project.id, 
      responsibility: responsibility
    })
  end

end
