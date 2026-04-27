defmodule OperatelyWeb.Api.Projects.DeleteCheckInTest do
  use OperatelyWeb.TurboCase

  alias Operately.Access.Binding
  alias Operately.Notifications.SubscriptionList

  import Operately.CommentsFixtures
  import Operately.GroupsFixtures
  import Operately.PeopleFixtures
  import Operately.ProjectsFixtures

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:projects, :delete_check_in], %{})
    end
  end

  describe "permissions" do
    @table [
      %{company: :no_access,      space: :no_access,      project: :no_access,      expected: 404},
      %{company: :no_access,      space: :no_access,      project: :comment_access, expected: 403},
      %{company: :no_access,      space: :no_access,      project: :edit_access,    expected: 403},
      %{company: :no_access,      space: :no_access,      project: :full_access,    expected: 200},

      %{company: :no_access,      space: :comment_access, project: :no_access,      expected: 403},
      %{company: :no_access,      space: :edit_access,    project: :no_access,      expected: 403},
      %{company: :no_access,      space: :full_access,    project: :no_access,      expected: 200},

      %{company: :comment_access, space: :no_access,      project: :no_access,      expected: 403},
      %{company: :edit_access,    space: :no_access,      project: :no_access,      expected: 403},
      %{company: :full_access,    space: :no_access,      project: :no_access,      expected: 200},
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
        check_in = create_check_in(ctx.creator, project)

        assert {code, res} = mutation(ctx.conn, [:projects, :delete_check_in], %{
          check_in_id: Paths.project_check_in_id(check_in),
        })

        assert code == @test.expected

        case @test.expected do
          200 -> assert res == %{success: true}
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "The requested resource was not found"
        end
      end
    end
  end

  describe "delete_project_check_in functionality" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.log_in_person(:creator)
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_check_in(:check_in1, :project, :creator)
      |> Factory.add_project_check_in(:check_in2, :project, :creator)
    end

    test "deletes the check-in and restores project's last check-in to previous", ctx do
      project = Repo.reload(ctx.project)
      assert project.last_check_in_id == ctx.check_in2.id

      assert {200, res} = mutation(ctx.conn, [:projects, :delete_check_in], %{
        check_in_id: Paths.project_check_in_id(ctx.check_in2),
      })

      assert res == %{success: true}
      assert Repo.get(Operately.Projects.CheckIn, ctx.check_in2.id) == nil

      project = Repo.reload(ctx.project)
      assert project.last_check_in_id == ctx.check_in1.id
      assert project.last_check_in_status == ctx.check_in1.status
    end

    test "deletes comments and reactions associated with the check-in", ctx do
      comment = comment_fixture(ctx.creator, %{
        entity_id: ctx.check_in2.id,
        entity_type: :project_check_in,
      })

      {:ok, reaction} = Operately.Updates.create_reaction(%{
        entity_id: ctx.check_in2.id,
        entity_type: :project_check_in,
        person_id: ctx.creator.id,
        emoji: ":thumbs_up:"
      })

      assert {200, _} = mutation(ctx.conn, [:projects, :delete_check_in], %{
        check_in_id: Paths.project_check_in_id(ctx.check_in2),
      })

      assert Repo.get(Operately.Updates.Comment, comment.id) == nil
      assert Repo.get(Operately.Updates.Reaction, reaction.id) == nil
    end

    test "deletes subscription list associated with the check-in", ctx do
      assert {200, _} = mutation(ctx.conn, [:projects, :delete_check_in], %{
        check_in_id: Paths.project_check_in_id(ctx.check_in2),
      })

      assert Repo.get(Operately.Notifications.SubscriptionList, ctx.check_in2.subscription_list_id) == nil
    end

    test "when deleting the only check-in, clears project's last check-in", ctx do
      assert {200, _} = mutation(ctx.conn, [:projects, :delete_check_in], %{
        check_in_id: Paths.project_check_in_id(ctx.check_in2),
      })

      assert {200, _} = mutation(ctx.conn, [:projects, :delete_check_in], %{
        check_in_id: Paths.project_check_in_id(ctx.check_in1),
      })

      project = Repo.reload(ctx.project)
      assert project.last_check_in_id == nil
      assert project.last_check_in_status == nil
    end
  end

  #
  # Helpers
  #

  defp create_space(ctx) do
    group_fixture(ctx.creator, %{company_id: ctx.company.id, company_permissions: Binding.no_access()})
  end

  defp create_project(ctx, space, company_members_level, space_members_level, project_member_level) do
    project = project_fixture(%{
      company_id: ctx.company.id,
      name: "Name",
      creator_id: ctx.creator.id,
      group_id: space.id,
      company_access_level: Binding.from_atom(company_members_level),
      space_access_level: Binding.from_atom(space_members_level),
    })

    if space_members_level != :no_access do
      {:ok, _} = Operately.Groups.add_members(ctx.creator, space.id, [%{
        id: ctx.person.id,
        access_level: Binding.from_atom(space_members_level)
      }])
    end

    if project_member_level != :no_access do
      {:ok, _} = Operately.Projects.create_contributor(ctx.creator, %{
        project_id: project.id,
        person_id: ctx.person.id,
        permissions: Binding.from_atom(project_member_level),
        responsibility: "some responsibility"
      })
    end

    project
  end

  defp create_check_in(creator, project) do
    check_in_fixture(%{author_id: creator.id, project_id: project.id})
  end
end
