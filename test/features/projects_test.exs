defmodule Operately.Features.ProjectsTest do
  use Operately.FeatureCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  alias Operately.Support.Features.ProjectSteps
  alias Operately.Support.Features.NotificationsSteps

  setup ctx do
    ctx = ProjectSteps.create_project(ctx, name: "Test Project")
    ctx = ProjectSteps.login(ctx)

    {:ok, ctx}
  end

  @tag login_as: :champion
  feature "add project", ctx do
    ctx
    |> visit_index()
    |> UI.click(testid: "add-project")
    |> UI.fill(testid: "project-name-input", with: "Website Redesign")
    |> UI.select_person(ctx.reviewer.full_name)
    |> UI.click(testid: "save")
    |> UI.assert_text("Website Redesign")

    ctx
    |> UI.login_as(ctx.reviewer)
    |> NotificationsSteps.visit_notifications_page()
    |> NotificationsSteps.assert_notification_exists(
      author: ctx.champion, 
      subject: "#{Person.first_name(ctx.champion)} created a new project and assigned you as the Champion"
    )

    ctx
    |> ProjectSteps.assert_email_sent_to_all_contributors(
      subject: "#{Person.short_name(ctx.champion)} created a new project and assigned you as the Champion",
      except: [ctx.champion.email]
    )
  end

  feature "add a private project", state do
    champion = person_fixture(%{full_name: "Mary Poppins", title: "Head of Operations", company_id: state.company.id})

    state
    |> visit_index()
    |> UI.click(testid: "add-project")
    |> UI.fill(testid: "project-name-input", with: "Website Redesign")
    |> UI.select_person(champion.full_name)
    |> UI.select(testid: "your-role-input", option: "Reviewer")
    |> UI.click(testid: "invite-only")
    |> UI.click(testid: "save")
    |> UI.assert_text("Website Redesign")
    |> UI.assert_text(short_name(state.champion) <> " created this project with Mary P. as the champion and themselves as a Reviewer")
    |> UI.assert_has(testid: "private-project-indicator")
  end

  feature "listing projects", state do
    state
    |> visit_index()
    |> assert_has(Query.text(state.project.name))
  end

  feature "editing the project description", state do
    state
    |> visit_show(state.project)
    |> click_edit_description()
    |> UI.fill_rich_text(project_description())
    |> click_save()

    # by default only the top of text is visible
    state.session
    |> assert_has(Query.text("TEXT START MARKER"))
    |> refute_has(Query.text("TEXT END MARKER"))

    # the text can be expanded
    state.session
    |> expand_description()
    |> assert_has(Query.text("TEXT END MARKER"))
  end

  feature "listing key resources", state do
    add_key_resource(state.project, %{title: "Code Repository", link: "https://github.com/operately/operately", type: "github"})
    add_key_resource(state.project, %{title: "Website", link: "https://operately.com", type: "generic"})

    state
    |> visit_show(state.project)
    |> assert_has(Query.text("Code Repository"))
    |> assert_has(Query.text("Website"))
  end

  feature "adding key resources to a project", state do
    state
    |> visit_show(state.project)
    |> UI.click(testid: "add-key-resource")
    |> UI.fill("Title", with: "Code Repository")
    |> UI.fill("URL", with: "https://github.com/operately/operately")
    |> UI.click(testid: "save-key-resource")
    |> assert_has(Query.text("Code Repository"))
  end

  feature "editing key resources on a project", state do
    add_key_resource(state.project, %{title: "Code Repository", link: "https://github.com/operately/operately", type: "github"})

    state
    |> visit_show(state.project)
    |> assert_has(Query.text("Code Repository"))
    |> UI.click(testid: "key-resource-options")
    |> UI.click(testid: "edit-key-resource")
    |> UI.fill("Title", with: "Github Repository")
    |> UI.fill("URL", with: "https://github.com/operately/kpiexamples")
    |> refute_has(Query.text("Github Repository"))
  end

  feature "removing key resources from a project", state do
    add_key_resource(state.project, %{title: "Code Repository", link: "https://github.com/operately/operately", type: "github"})

    state
    |> visit_show(state.project)
    |> assert_has(Query.text("Code Repository"))
    |> UI.click(testid: "key-resource-options")
    |> UI.click(testid: "remove-key-resource")
    |> refute_has(Query.text("Code Repository"))
  end

  feature "react to a comment", state do
    {:ok, update} = add_status_update(state.project, "This is a status update.", state.champion.id)
    {:ok, comment} = add_comment(update, "This is a comment.", state.champion.id)

    state
    |> visit_show(state.project)
    |> assert_has(Query.text("This is a comment."))
    |> UI.find(testid: "comment-#{comment.id}")
    |> UI.click(testid: "reactions-button")
    |> UI.click(testid: "reaction-thumbs_up-button")
    |> UI.assert_has(testid: "reaction-thumbs_up")
  end

  feature "react to a status update", state do
    add_status_update(state.project, "This is a status update.", state.champion.id)

    state
    |> visit_show(state.project)
    |> UI.click(testid: "reactions-button")
    |> UI.click(testid: "reaction-thumbs_up-button")
    |> UI.assert_has(testid: "reaction-thumbs_up")
  end

  feature "adding a project contributor", state do
    contrib = person_fixture(%{full_name: "Michael Scott", title: "Manager", company_id: state.company.id})

    state
    |> visit_show(state.project)
    |> UI.click(testid: "project-contributors")
    |> UI.click(testid: "add-contributor-button")
    |> UI.select_person(contrib.full_name)
    |> UI.fill(testid: "contributor-responsibility-input", with: "Lead the project")
    |> UI.click(testid: "save-contributor")

    state
    |> visit_show(state.project)
    |> UI.assert_text(short_name(state.champion) <> " added " <> short_name(contrib) <> " to the project.")
  end

  feature "removing a project contributor", state do
    contrib = person_fixture(%{full_name: "Michael Scott", title: "Manager", company_id: state.company.id})
    add_contributor(state.project, contrib, "contributor")

    state
    |> visit_show(state.project)
    |> UI.click(testid: "project-contributors")
    |> UI.hover(testid: "contributor-#{contrib.id}")
    |> UI.click(testid: "edit-contributor")
    |> UI.click(testid: "remove-contributor")
    |> refute_has(Query.text("Michael Scott"))

    state
    |> visit_show(state.project)
    |> UI.assert_text(short_name(state.champion) <> " removed " <> short_name(contrib) <> " from the project.")
  end

  feature "archive a project", state do
    state
    |> visit_show(state.project)
    |> UI.click(testid: "project-options-button")
    |> UI.click(testid: "archive-project-button")

    :timer.sleep(200)

    state
    |> visit_index()
    |> refute_has(Query.text(state.project.name))
  end

  feature "rename a project", state do
    state
    |> visit_show(state.project)
    |> UI.click(testid: "project-options-button")
    |> UI.click(testid: "edit-project-name-button")
    |> UI.fill(testid: "project-name-input", with: "New Name")
    |> UI.click(testid: "save")

    state
    |> visit_show(state.project)
    |> UI.assert_text("New Name")
  end

  feature "edit project timeline", state do
    state
    |> visit_show(state.project)
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
  end

  # ===========================================================================

  defp visit_index(state) do
    UI.visit(state, "/projects")
  end

  defp visit_show(state, project) do
    UI.visit(state, "/projects" <> "/" <> project.id)
  end

  def click_edit_description(state) do
    UI.click(state, testid: "edit-project-description")
  end

  def expand_description(state) do
    UI.click(state, testid: "expand-project-description")
  end

  def click_save(state) do
    click(state, Query.button("Save"))
  end

  def add_key_resource(project, attrs) do
    {:ok, _} = Operately.Projects.create_key_resource(%{project_id: project.id} |> Map.merge(attrs))
  end

  defp create_project(company, champion) do
    params = %Operately.Projects.ProjectCreation{
      company_id: company.id,
      name: "Live support",
      champion_id: champion.id,
      creator_id: champion.id,
      creator_role: nil,
      visibility: "everyone",
    }

    {:ok, project} = Operately.Projects.create_project(params)

    project
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

  defp change_champion(project, champion) do
    delete_contributors_with_role(project, "champion")
    add_contributor(project, champion, "champion")
  end

  defp change_reviewer(project, reviewer) do
    delete_contributors_with_role(project, "reviewer")
    add_contributor(project, reviewer, "reviewer")
  end

  defp delete_contributors_with_role(project, role) do
    Operately.Projects.list_project_contributors(project)
    |> Enum.filter(fn contributor -> contributor.role == role end)
    |> Enum.map(&Operately.Projects.delete_contributor(&1))
  end

end
