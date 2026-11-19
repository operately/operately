defmodule OperatelyWeb.Api.Projects.UpdateContributorTest do
  use OperatelyWeb.TurboCase

  import Operately.Support.Api.ProjectAccessHelpers

  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.ProjectsFixtures

  alias Operately.Projects
  alias Operately.Access.Binding

  describe "company member boundaries" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space, company_permissions: Binding.no_access())
      |> Factory.add_project(:project, :space, company_access_level: Binding.no_access(), space_access_level: Binding.no_access())
      |> Factory.add_project_contributor(:contributor, :project)
      |> Factory.log_in_person(:creator)
    end

    test "rejects a foreign person without changing project access", ctx do
      foreign_person = Factory.setup(%{}).creator
      assert {:error, :not_found} = Operately.Projects.Project.get(foreign_person, id: ctx.project.id)
      before = project_access_snapshot(ctx.project)

      assert {400, _} = mutation(ctx.conn, [:projects, :update_contributor], boundary_inputs(ctx, foreign_person.id))
      assert project_access_snapshot(ctx.project) == before
    end

    test "validates the existing person when no replacement is supplied", ctx do
      foreign_id = Factory.setup(%{}).creator.id
      ctx.contributor |> Ecto.Changeset.change(person_id: foreign_id) |> Repo.update!()
      before = project_access_snapshot(ctx.project)

      for attrs <- [%{}, %{person_id: nil}] do
        inputs = Map.merge(%{contrib_id: ctx.contributor.id, permissions: "edit_access"}, attrs)
        assert {400, _} = mutation(ctx.conn, [:projects, :update_contributor], inputs)
        assert project_access_snapshot(ctx.project) == before
      end
    end
  end

  defp boundary_inputs(ctx, person_id) do
    %{contrib_id: ctx.contributor.id, person_id: person_id, permissions: "edit_access"}
  end

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:projects, :update_contributor], %{})
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
        contributor = create_contributor(ctx, project)

        assert {code, res} =
                 mutation(ctx.conn, [:projects, :update_contributor], %{
                   contrib_id: Paths.project_contributor_id(contributor),
                   responsibility: "New responsibility",
                   permissions: "edit_access"
                 })

        assert code == @test.expected

        case @test.expected do
          200 ->
            assert_result(res, contributor)

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
      contributor = create_contributor(ctx, project)

      assert {200, res} =
               mutation(ctx.conn, [:projects, :update_contributor], %{
                 contrib_id: Paths.project_contributor_id(contributor),
                 responsibility: "New responsibility",
                 permissions: "edit_access"
               })

      assert_result(res, contributor)
    end
  end

  describe "permission level validation" do
    @permission_table [
      %{caller_access: :edit_access,    new_member_access: :full_access,    expected: 403},
      %{caller_access: :edit_access,    new_member_access: :edit_access,    expected: 200},
      %{caller_access: :edit_access,    new_member_access: :comment_access, expected: 200},
      %{caller_access: :edit_access,    new_member_access: :view_access,    expected: 200},

      %{caller_access: :full_access,    new_member_access: :full_access,    expected: 200},
      %{caller_access: :full_access,    new_member_access: :edit_access,    expected: 200},
      %{caller_access: :full_access,    new_member_access: :comment_access, expected: 200},
      %{caller_access: :full_access,    new_member_access: :view_access,    expected: 200},
    ]

    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      Map.merge(ctx, %{creator: creator})
    end

    tabletest @permission_table do
      test "user with #{@test.caller_access} access can update member to #{@test.new_member_access} access, expect code=#{@test.expected}", ctx do
        space = create_space(ctx)
        project = create_project(ctx, space, :no_access, :no_access, :no_access)

        {caller_person, _caller} = create_contributor_with_access(ctx, project, Binding.from_atom(@test.caller_access))
        target = create_contributor(ctx, project)

        account = Repo.preload(caller_person, :account).account
        conn = log_in_account(ctx.conn, account)

        assert {code, res} =
          mutation(conn, [:projects, :update_contributor], %{
            contrib_id: Paths.project_contributor_id(target),
            responsibility: "Updated responsibility",
            permissions: Atom.to_string(@test.new_member_access)
          })

        assert code == @test.expected

        case @test.expected do
          200 -> assert_result(res, target)
          403 -> assert res.message == "You don't have permission to perform this action"
        end
      end
    end

    test "fails if trying to update member to higher access than caller", ctx do
      space = create_space(ctx)
      project = create_project(ctx, space, :no_access, :no_access, :no_access)

      {caller_person, _caller} = create_contributor_with_access(ctx, project, Binding.edit_access())
      target = create_contributor(ctx, project)

      account = Repo.preload(caller_person, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {403, res} =
        mutation(conn, [:projects, :update_contributor], %{
          contrib_id: Paths.project_contributor_id(target),
          responsibility: "Updated responsibility",
          permissions: "full_access"
        })

      assert res.message == "You don't have permission to perform this action"
    end
  end

  describe "can edit permissions validation" do
    @can_edit_table [
      %{caller_access: :edit_access,    contributor_access: :edit_access,    expected: 200},
      %{caller_access: :edit_access,    contributor_access: :comment_access, expected: 200},
      %{caller_access: :edit_access,    contributor_access: :view_access,    expected: 200},
      %{caller_access: :edit_access,    contributor_access: :full_access,    expected: 403},

      %{caller_access: :full_access,    contributor_access: :full_access,    expected: 200},
      %{caller_access: :full_access,    contributor_access: :edit_access,    expected: 200},
      %{caller_access: :full_access,    contributor_access: :comment_access, expected: 200},
      %{caller_access: :full_access,    contributor_access: :view_access,    expected: 200},
    ]

    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      Map.merge(ctx, %{creator: creator})
    end

    tabletest @can_edit_table do
      test "user with #{@test.caller_access} can edit permissions of contributor with #{@test.contributor_access}, expect code=#{@test.expected}", ctx do
        space = create_space(ctx)
        project = create_project(ctx, space, :no_access, :no_access, :no_access)

        {caller_person, _caller} = create_contributor_with_access(ctx, project, Binding.from_atom(@test.caller_access))
        {_target_person, target} = create_contributor_with_access(ctx, project, Binding.from_atom(@test.contributor_access))

        account = Repo.preload(caller_person, :account).account
        conn = log_in_account(ctx.conn, account)

        assert {code, res} =
          mutation(conn, [:projects, :update_contributor], %{
            contrib_id: Paths.project_contributor_id(target),
            responsibility: "Updated responsibility",
            permissions: "view_access"
          })

        assert code == @test.expected

        case @test.expected do
          200 -> assert_result(res, target)
          403 -> assert res.message == "You don't have permission to perform this action"
        end
      end
    end

    test "allows editing other fields without changing permissions", ctx do
      space = create_space(ctx)
      project = create_project(ctx, space, :no_access, :no_access, :no_access)

      {caller_person, _caller} = create_contributor_with_access(ctx, project, Binding.edit_access())
      {_target_person, target} = create_contributor_with_access(ctx, project, Binding.comment_access())

      account = Repo.preload(caller_person, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, res} = mutation(conn, [:projects, :update_contributor], %{
        contrib_id: Paths.project_contributor_id(target),
        responsibility: "New responsibility"
      })

      assert_result(res, target)

      target = Repo.reload(target)
      assert target.responsibility == "New responsibility"
    end
  end

  #
  # Helpers
  #

  defp assert_result(res, contributor) do
    contributor = Repo.reload(contributor) |> Repo.preload(:person)
    assert res.contributor == Serializer.serialize(contributor)
  end

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

    contributor
  end

  defp create_contributor_with_access(ctx, project, permissions) do
    person = person_fixture_with_account(%{company_id: ctx.company.id})

    {:ok, contributor} =
      Projects.create_contributor(ctx[:creator] || ctx.person, %{
        project_id: project.id,
        person_id: person.id,
        responsibility: "some responsibility",
        permissions: permissions
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
