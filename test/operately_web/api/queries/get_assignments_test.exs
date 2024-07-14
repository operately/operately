defmodule OperatelyWeb.Api.Queries.GetAssignmentsTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures
  import Operately.ProjectsFixtures

  alias Operately.Repo
  alias Operately.Projects.Project

  describe "get_due_assignments" do
    setup :register_and_log_in_account

    test "get_due_projects", ctx do
      # Projects for one person
      today_project = create_project(ctx, DateTime.utc_now())
      due_project = create_project(ctx, past_date())
      create_project(ctx, upcoming_date())

      # Projects for one person
      another_person = person_fixture_with_account(%{company_id: ctx.company.id})

      another_due_project = create_project(ctx, past_date(), %{creator_id: another_person.id})
      create_project(ctx, upcoming_date(), %{creator_id: another_person.id})

      assert [today_project, due_project] == OperatelyWeb.Api.Queries.GetAssignments.get_due_projects(ctx.person)

      assert [another_due_project] == OperatelyWeb.Api.Queries.GetAssignments.get_due_projects(another_person)
    end

    test "get_due_projects ignores closed projects", ctx do
      create_project(ctx, upcoming_date())
      create_project(ctx, past_date()) |> close_project()
      due_project = create_project(ctx, past_date())

      assert [due_project] == OperatelyWeb.Api.Queries.GetAssignments.get_due_projects(ctx.person)
    end
  end

  #
  # Helpers
  #

  defp upcoming_date do
    Date.utc_today()
    |> Date.add(3)
    |> Operately.Time.as_datetime()
  end

  defp past_date do
    Date.utc_today()
    |> Date.add(-3)
    |> Operately.Time.as_datetime()
  end

  defp create_project(ctx, date, attrs \\ %{}) do
    {:ok, project} =
      project_fixture(Map.merge(%{
        creator_id: ctx.person.id,
        company_id: ctx.company.id,
        group_id: ctx.company.company_space_id,
      }, attrs))
      |> Project.changeset(%{next_check_in_scheduled_at: date})
      |> Repo.update()

    project
  end

  defp close_project(project) do
    {:ok, project} =
      Project.changeset(project, %{
        status: "closed",
        closed_at: DateTime.utc_now(),
        closed_by_id: project.creator_id,
      })
      |> Repo.update()

    project
  end
end
