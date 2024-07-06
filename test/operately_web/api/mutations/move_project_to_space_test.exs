defmodule OperatelyWeb.Api.Mutations.MoveProjectToSpaceTest do
  use OperatelyWeb.TurboCase

  import Operately.ProjectsFixtures
  import Operately.GroupsFixtures

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :move_project_to_space, %{})
    end
  end

  describe "move_project_to_space functionality" do
    setup :register_and_log_in_account

    test "it moves a project to a space", ctx do
      person = ctx.person
      project = project_fixture(%{
        company_id: ctx.company.id,
        group_id: ctx.company.company_space_id,
        creator_id: person.id
      })

      space = group_fixture(person, %{company_id: ctx.company.id})

      assert {200, %{}} = mutation(ctx.conn, :move_project_to_space, %{
        project_id: project.id,
        space_id: Paths.space_id(space)
      })

      project = Operately.Projects.get_project!(project.id)
      assert project.group_id == space.id
    end
  end
end 
