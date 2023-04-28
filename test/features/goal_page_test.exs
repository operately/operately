defmodule MyApp.Features.GoalPageTests do
  use Operately.FeatureCase

  alias Operately.OkrsFixtures
  alias Operately.ProjectsFixtures

  setup session do
    session = UI.login(session)

    objective = create_a_goal("Maintain support happiness")

    {:ok, %{session: session, objective: objective}}
  end

  feature "viewing the goal title", state do
    state |> visit_page() |> UI.assert_text("Maintain support happiness")
  end

  feature "viewing targets", state do
    target1 = create_target(state.objective, "Increase support happiness by 10%")
    target2 = create_target(state.objective, "Decrease waiting time by 20%")

    state
    |> visit_page()
    |> UI.assert_text(target1.name)
    |> UI.assert_text(target2.name)
  end

  feature "viewing ongoing projects on the goal page", state do
    project1 = create_project(state.objective, "Install Zendesk")
    project2 = create_project(state.objective, "Live chat for the website")

    state
    |> visit_page()
    |> UI.assert_text(project1.name)
    |> UI.assert_text(project2.name)
  end

  feature "posting updates", state do
    message = """
    We are currently working on a live support chat feature. We hope
    to have it ready by the end of the quarter.
    """

    state
    |> visit_page()
    |> UI.click_button("Write an update")
    |> UI.fill_rich_text(message)
    |> UI.click_button("Post")
    |> UI.assert_text(message)
  end

  # ===========================================================================

  defp visit_page(state) do
    UI.visit(state, "/objectives/#{state.objective.id}")
  end

  defp create_a_goal(name) do
    OkrsFixtures.objective_fixture(%{name: name})
  end

  defp create_target(objective, name) do
    OkrsFixtures.key_result_fixture(%{name: name, objective_id: objective.id})
  end

  defp create_project(objective, name) do
    project = ProjectsFixtures.project_fixture(%{name: name})

    Operately.Alignments.create_alignment(%{
      child: project.id,
      child_type: :project,
      parent: objective.id,
      parent_type: :objective
    })

    project
  end
end
