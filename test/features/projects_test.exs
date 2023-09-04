defmodule Operately.Features.ProjectsTest do
  use Operately.FeatureCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  setup session do
    company = company_fixture(%{name: "Test Org"})
    session = session |> UI.login()
    champion = UI.get_account().person
    project = create_project(company, champion)

    {:ok, %{session: session, company: company, champion: champion, project: project}}
  end

  feature "add project", state do
    state
    |> visit_index()
    |> UI.click(testid: "add-project")
    |> UI.fill(testid: "project-name-input", with: "Website Redesign")
    |> UI.select_person(state.champion.full_name)
    |> UI.click(testid: "save")
    |> UI.assert_text("Website Redesign")
    |> UI.assert_text(short_name(state.champion) <> " created this project and assigned themselves as the Champion")
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

  feature "writing a message to the team", state do
    state
    |> visit_show(state.project)
    |> UI.click(testid: "write-message")
    |> UI.fill_rich_text("Hello team!")
    |> UI.click(testid: "post-message")
    |> assert_has(Query.text("Hello team!"))
  end

  feature "submitting a status update", state do
    state
    |> visit_show(state.project)
    |> UI.click(testid: "add-status-update")
    |> UI.fill_rich_text("This is a status update.")
    |> UI.click(testid: "post-status-update")
    |> assert_has(Query.text("This is a status update."))
  end

  feature "leave a comment on an update", state do
    add_status_update(state.project, "This is a status update.", state.champion.id)

    state
    |> visit_show(state.project)
    |> UI.click(testid: "add-comment")
    |> UI.fill_rich_text("This is a comment.")
    |> UI.click(testid: "post-comment")
    |> assert_has(Query.text("This is a comment."))
  end

  feature "acknowledge a status update", state do
    new_champion = person_fixture(%{full_name: "John Wick", title: "Head of Operations", company_id: state.company.id})

    change_champion(state.project, new_champion)
    change_reviewer(state.project, state.champion)
    add_status_update(state.project, "This is a status update.", new_champion.id)

    :timer.sleep(100) # give some time for the update to be created

    state
    |> visit_show(state.project)
    |> UI.assert_text("Waiting for your acknowledgement")
    |> UI.click(testid: "acknowledge-update")
    |> UI.refute_text("Waiting for your acknowledgement")
    |> UI.assert_text(state.champion.full_name <> " acknowledged this update")
    |> assert_has(Query.css("[data-test-id='acknowledged-marker']"))
  end

  feature "changing phase from pending -> execution and filling in the review", state do
    state
    |> visit_show(state.project)
    |> UI.click(testid: "phase-selector")
    |> UI.click(testid: "phase-execution")

    state
    |> UI.find(testid: "section-schedule")
    |> UI.click(testid: "schedule-yes")
    |> UI.fill(testid: "schedule-comments", with: "The project was not completed on schedule because of X, Y, and Z.")

    state
    |> UI.find(testid: "section-costs")
    |> UI.click(testid: "costs-yes")
    |> UI.fill(testid: "costs-comments", with: "Yes, the planning phase was completed within budget.")

    state
    |> UI.find(testid: "section-deliverables")
    |> UI.fill(testid: "deliverables-answer", with: "- Deliverable 1\n- Deliverable 2\n- Deliverable 3")

    state
    |> UI.find(testid: "section-team")
    |> UI.click(testid: "team-yes")
    |> UI.fill(testid: "team-comments", with: "The team was not staffed with suitable roles because of X, Y, and Z.")

    state
    |> UI.find(testid: "section-risks")
    |> UI.click(testid: "risks-yes")
    |> UI.fill(testid: "risks-comments", with: "The project was not completed on schedule because of X, Y, and Z.")

    state
    |> UI.scroll_to(testid: "submit")
    |> UI.click(testid: "submit")

    state
    |> UI.assert_text("The project has moved to the execution phase")
  end

  feature "changing phase from execution -> control and filling in the review", state do
    change_phase(state.project, :execution)

    state
    |> visit_show(state.project)
    |> UI.click(testid: "phase-selector")
    |> UI.click(testid: "phase-control")

    state
    |> UI.find(testid: "section-schedule")
    |> UI.click(testid: "schedule-yes")
    |> UI.fill(testid: "schedule-comments", with: "The project was not completed on schedule because of X, Y, and Z.")

    state
    |> UI.find(testid: "section-costs")
    |> UI.click(testid: "costs-yes")
    |> UI.fill(testid: "costs-comments", with: "Yes, the execution phase was completed within budget.")

    state
    |> UI.find(testid: "section-deliverables")
    |> UI.fill(testid: "deliverables-answer", with: "- Deliverable 1\n- Deliverable 2\n- Deliverable 3")

    state
    |> UI.find(testid: "section-team")
    |> UI.click(testid: "team-yes")
    |> UI.fill(testid: "team-comments", with: "The team was not staffed with suitable roles because of X, Y, and Z.")

    state
    |> UI.find(testid: "section-risks")
    |> UI.click(testid: "risks-yes")
    |> UI.fill(testid: "risks-comments", with: "The project was not completed on schedule because of X, Y, and Z.")

    state
    |> UI.scroll_to(testid: "submit")
    |> UI.click(testid: "submit")

    state
    |> UI.assert_text("The project has moved to the control phase")
  end

  feature "changing phase from control -> completed and filling in a retrospective", state do
    change_phase(state.project, :control)

    state
    |> visit_show(state.project)
    |> UI.click(testid: "phase-selector")
    |> UI.click(testid: "phase-completed")

    state
    |> UI.find(testid: "section-what-went-well")
    |> UI.fill(testid: "what-went-well-answer", with: "The project was completed on schedule.")

    state
    |> UI.find(testid: "section-what-could-be-better")
    |> UI.fill(testid: "what-could-be-better-answer", with: "The project could have been completed on budget.")

    state
    |> UI.find(testid: "section-what-we-learned")
    |> UI.fill(testid: "what-we-learned-answer", with: "We learned that we need to improve our budgeting process.")

    state
    |> UI.scroll_to(testid: "submit")
    |> UI.click(testid: "submit")

    state
    |> UI.assert_text("Project Completed")
  end

  feature "changing phase from control -> canceled and filling in a retrospective", state do
    change_phase(state.project, :control)

    state
    |> visit_show(state.project)
    |> UI.click(testid: "phase-selector")
    |> UI.click(testid: "phase-canceled")

    state
    |> UI.find(testid: "section-what-went-well")
    |> UI.fill(testid: "what-went-well-answer", with: "The project was completed on schedule.")

    state
    |> UI.find(testid: "section-what-could-be-better")
    |> UI.fill(testid: "what-could-be-better-answer", with: "The project could have been completed on budget.")

    state
    |> UI.find(testid: "section-what-we-learned")
    |> UI.fill(testid: "what-we-learned-answer", with: "We learned that we need to improve our budgeting process.")

    state
    |> UI.scroll_to(testid: "submit")
    |> UI.click(testid: "submit")

    state
    |> UI.assert_text("Project Canceled")
  end

  feature "pausing a project", state do
    state
    |> visit_show(state.project)
    |> UI.click(testid: "phase-selector")
    |> UI.click(testid: "phase-paused")

    state
    |> UI.find(testid: "section-why-are-you-pausing")
    |> UI.fill(testid: "why-are-you-pausing-answer", with: "We are pausing the project because of X, Y, and Z.")

    state
    |> UI.find(testid: "section-when-will-you-resume")
    |> UI.fill(testid: "when-will-you-resume-answer", with: "We will resume the project on X date.")

    state
    |> UI.scroll_to(testid: "submit")
    |> UI.click(testid: "submit")

    state
    |> UI.assert_text("Project is being paused")
  end

  feature "changing phase from control -> planning and filling in a the questions", state do
    change_phase(state.project, :control)

    state
    |> visit_show(state.project)
    |> UI.click(testid: "phase-selector")
    |> UI.click(testid: "phase-planning")

    state
    |> UI.find(testid: "section-why-are-you-switching-back")
    |> UI.fill(testid: "why-are-you-switching-back-answer", with: "We are switching back to the pending phase because of X, Y, and Z.")

    state
    |> UI.scroll_to(testid: "submit")
    |> UI.click(testid: "submit")

    # placeholdes while we wait for the page to load
    # when we have the reload feature, we can remove this
    # and verify if the page has reloaded and contains the answers
    :timer.sleep(1000) 
  end

  feature "changing phase from completed -> planning and filling in a the questions", state do
    change_phase(state.project, :completed)

    state
    |> visit_show(state.project)
    |> UI.click(testid: "phase-selector")
    |> UI.click(testid: "phase-planning")

    state
    |> UI.find(testid: "section-why-are-you-restarting")
    |> UI.fill(testid: "why-are-you-restarting-answer", with: "We are restarting the project because of X, Y, and Z.")

    state
    |> UI.scroll_to(testid: "submit")
    |> UI.click(testid: "submit")

    # placeholdes while we wait for the page to load
    # when we have the reload feature, we can remove this
    # and verify if the page has reloaded and contains the answers
    :timer.sleep(1000) 
  end

  feature "changing the project's start date", state do
    state
    |> visit_show(state.project)
    |> UI.click(testid: "edit-project-start-date")
    |> UI.click(css: ".react-datepicker__day.react-datepicker__day--016")
    |> UI.assert_text(short_name(state.champion) <> " changed the project's start date to")
  end

  feature "changing the project's end date", state do
    state
    |> visit_show(state.project)
    |> UI.click(testid: "edit-project-due-date")
    |> UI.click(css: ".react-datepicker__day.react-datepicker__day--014")
    |> UI.assert_text(short_name(state.champion) <> " changed the project's due date to")
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
    |> visit_show(state.project)
    |> UI.assert_text(short_name(state.champion) <> " added " <> short_name(contrib) <> " to the project.")
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
          "old_health" => "on-track",
          "new_health" => "on-track",
        },
        author_id: author_id
      })
  end

  def rich_text_paragraph(text) do
    %{
      "type" => "doc",
      "content" => [
        %{
          "type" => "paragraph",
          "content" => [
            %{
              "text" => text,
              "type" => "text"
            }
          ]
        }
      ]
    }
  end

  defp change_phase(project, phase) do
    {:ok, _} = Operately.Projects.update_project(project, %{phase: phase})
  end

  defp short_name(person) do
    parts = String.split(person.full_name, " ")

    Enum.at(parts, 0) <> " " <> String.first(Enum.at(parts, 1)) <> "."
  end

  defp change_champion(project, champion) do
    delete_contributors_with_role(project, "champion")

    {:ok, _} = Operately.Projects.create_contributor(%{person_id: champion.id, role: "champion", project_id: project.id})
  end

  defp change_reviewer(project, reviewer) do
    delete_contributors_with_role(project, "reviewer")

    {:ok, _} = Operately.Projects.create_contributor(%{person_id: reviewer.id, role: "reviewer", project_id: project.id})
  end

  defp delete_contributors_with_role(project, role) do
    Operately.Projects.list_project_contributors(project)
    |> Enum.filter(fn contributor -> contributor.role == role end)
    |> Enum.map(&Operately.Projects.delete_contributor(&1))
  end

end
