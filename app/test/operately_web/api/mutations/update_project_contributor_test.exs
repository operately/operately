defmodule OperatelyWeb.Api.Mutations.UpdateProjectContributorTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.ProjectsFixtures

  alias Operately.Projects
  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :update_project_contributor, %{})
    end
  end

  describe "permissions" do
    @table [
      %{company: :no_access, space: :no_access, project: :no_access, expected: 404},
      %{company: :no_access, space: :no_access, project: :view_access, expected: 403},
      %{company: :no_access, space: :no_access, project: :comment_access, expected: 403},
      %{company: :no_access, space: :no_access, project: :edit_access, expected: 200},
      %{company: :no_access, space: :no_access, project: :full_access, expected: 200},
      %{company: :no_access, space: :view_access, project: :no_access, expected: 403},
      %{company: :no_access, space: :comment_access, project: :no_access, expected: 403},
      %{company: :no_access, space: :edit_access, project: :no_access, expected: 200},
      %{company: :no_access, space: :full_access, project: :no_access, expected: 200},
      %{company: :view_access, space: :no_access, project: :no_access, expected: 403},
      %{company: :comment_access, space: :no_access, project: :no_access, expected: 403},
      %{company: :edit_access, space: :no_access, project: :no_access, expected: 200},
      %{company: :full_access, space: :no_access, project: :no_access, expected: 200}
    ]

    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      Map.merge(ctx, %{creator: creator})
    end

    tabletest @table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space}, project=#{@test.project} on the project, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx)
        project = create_project(ctx, space, @test.company, @test.space, @test.project)
        {person, contributor} = create_contributor(ctx, project)

        assert {code, res} =
                 mutation(ctx.conn, :update_project_contributor, %{
                   contrib_id: contributor.id,
                   person_id: Paths.person_id(person),
                   responsibility: "New responsibility",
                   permissions: Binding.edit_access()
                 })

        assert code == @test.expected

        case @test.expected do
          200 ->
            contributor = Repo.reload(contributor)
            assert res.contributor == Serializer.serialize(contributor)

          403 ->
            assert res.message == "You don't have permission to perform this action"

          404 ->
            assert res.message == "The requested resource was not found"
        end
      end
    end
  end

  describe "update_project_contributor functionality" do
    setup :register_and_log_in_account

    test "updates project contributor", ctx do
      project = project_fixture(%{company_id: ctx.company.id, creator_id: ctx.person.id, group_id: ctx.company.company_space_id})
      {person, contributor} = create_contributor(ctx, project)

      assert {200, res} =
               mutation(ctx.conn, :update_project_contributor, %{
                 contrib_id: contributor.id,
                 person_id: Paths.person_id(person),
                 responsibility: "New responsibility",
                 permissions: Binding.edit_access()
               })

      contributor = Repo.reload(contributor)
      assert res.contributor == Serializer.serialize(contributor)
    end
  end

  #
  # Helpers
  #

  defp create_space(ctx) do
    group_fixture(ctx.creator, %{company_id: ctx.company.id, company_permissions: Binding.no_access()})
  end

  defp create_contributor(ctx, project) do
    person = person_fixture_with_account(%{company_id: ctx.company.id})

    {:ok, contributor} =
      Projects.create_contributor(ctx[:creator] || ctx.person, %{
        project_id: project.id,
        person_id: person.id,
        responsibility: "some responsibility",
        permissions: Binding.edit_access()
      })

    {person, contributor}
  end

  defp create_project(ctx, space, company_members_level, space_members_level, project_member_level) do
    project =
      project_fixture(%{
        company_id: ctx.company.id,
        creator_id: ctx.creator.id,
        group_id: space.id,
        company_access_level: Binding.from_atom(company_members_level),
        space_access_level: Binding.from_atom(space_members_level)
      })

    if space_members_level != :no_access do
      {:ok, _} =
        Operately.Groups.add_members(ctx.creator, space.id, [
          %{
            id: ctx.person.id,
            access_level: Binding.from_atom(space_members_level)
          }
        ])
    end

    if project_member_level != :no_access do
      {:ok, _} =
        Projects.create_contributor(ctx.creator, %{
          project_id: project.id,
          person_id: ctx.person.id,
          permissions: Binding.from_atom(project_member_level),
          responsibility: "some responsibility"
        })
    end

    project
  end
end
