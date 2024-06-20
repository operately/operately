defmodule OperatelyWeb.Api.Queries.GetProjectsTest do
  use OperatelyWeb.TurboCase

  import Operately.ProjectsFixtures

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, :get_projects, %{})
    end
  end

  describe "get_projects functionality" do
    setup :register_and_log_in_account

    test "calling with no input filters returns all projects from the company", ctx do
      project1 = project_fixture(company_id: ctx.company.id, name: "Project 1", creator_id: ctx.person.id, group_id: ctx.company.company_space_id)
      project2 = project_fixture(company_id: ctx.company.id, name: "Project 2", creator_id: ctx.person.id, group_id: ctx.company.company_space_id)
      project3 = project_fixture(company_id: ctx.company.id, name: "Project 3", creator_id: ctx.person.id, group_id: ctx.company.company_space_id)

      assert {200, res} = query(ctx.conn, :get_projects, %{})
      assert res.projects == [serialized(project1), serialized(project2), serialized(project3)]
    end

    test "if include_milestones is true, but there are no milestones it returns empty list and next_milestone = nil", ctx do
      project = project_fixture(company_id: ctx.company.id, name: "Project 1", creator_id: ctx.person.id, group_id: ctx.company.company_space_id)

      assert {200, res} = query(ctx.conn, :get_projects, %{include_milestones: true})
      assert res.projects == [serialized(project, milestones: [])]
    end

    test "if include_last_check_in is true, but there is no last check in, it returns nil", ctx do
      project = project_fixture(company_id: ctx.company.id, name: "Project 1", creator_id: ctx.person.id, group_id: ctx.company.company_space_id)

      assert {200, res} = query(ctx.conn, :get_projects, %{include_last_check_in: true})
      assert res.projects == [serialized(project) |> Map.put(:last_check_in, nil)]
    end
  end

  def serialized(project) do
    %{
      id: project.id,
      name: project.name,
      private: project.private,
      updated_at: project.updated_at,
      inserted_at: project.inserted_at,
      started_at: project.started_at,
      closed_at: project.closed_at,
      deadline: project.deadline,
      status: project.status,
      is_archived: project.deleted_at != nil,
      is_outdated: Operately.Projects.outdated?(project),
    }
    |> Jason.encode!()
    |> Jason.decode!(keys: :atoms)
  end

  def serialized(project, [{:milestones, []}]) do
    serialized(project) |> Map.put(:milestones, []) |> Map.put(:next_milestone, nil)
  end
end 
