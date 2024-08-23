defmodule OperatelyWeb.Api.Mutations.CreateCommentTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.ProjectsFixtures

  alias Operately.Updates
  alias Operately.Access.Binding
  alias Operately.Support.RichText

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :create_comment, %{})
    end
  end

  describe "permissions" do
    @table [
      %{company: :no_access,      space: :no_access,      project: :no_access,      expected: 404},
      %{company: :no_access,      space: :no_access,      project: :view_access,    expected: 403},
      %{company: :no_access,      space: :no_access,      project: :comment_access, expected: 200},
      %{company: :no_access,      space: :no_access,      project: :edit_access,    expected: 200},
      %{company: :no_access,      space: :no_access,      project: :full_access,    expected: 200},

      %{company: :no_access,      space: :view_access,    project: :no_access,      expected: 403},
      %{company: :no_access,      space: :comment_access, project: :no_access,      expected: 200},
      %{company: :no_access,      space: :edit_access,    project: :no_access,      expected: 200},
      %{company: :no_access,      space: :full_access,    project: :no_access,      expected: 200},

      %{company: :view_access,    space: :no_access,      project: :no_access,      expected: 403},
      %{company: :comment_access, space: :no_access,      project: :no_access,      expected: 200},
      %{company: :edit_access,    space: :no_access,      project: :no_access,      expected: 200},
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

        assert {code, res} = mutation(ctx.conn, :create_comment, %{
          entity_id: Paths.project_check_in_id(check_in),
          entity_type: "project_check_in",
          content: RichText.rich_text("Content", :as_string)
        })

        assert code == @test.expected

        case @test.expected do
          200 -> assert Updates.count_comments(check_in.id, :project_check_in) == 1
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "The requested resource was not found"
        end
      end
    end
  end

  describe "create_comment functionality" do
    setup :register_and_log_in_account

    test "creates comment", ctx do
      project = project_fixture(%{company_id: ctx.company.id, creator_id: ctx.person.id, group_id: ctx.company.company_space_id})
      check_in = create_check_in(ctx.person, project)

      assert Updates.count_comments(check_in.id, :project_check_in) == 0

      assert {200, res} = mutation(ctx.conn, :create_comment, %{
        entity_id: Paths.project_check_in_id(check_in),
        entity_type: "project_check_in",
        content: RichText.rich_text("Content", :as_string)
      })

      assert Updates.count_comments(check_in.id, :project_check_in) == 1
      comment = hd(Updates.list_comments(check_in.id, :project_check_in))
      assert res.comment == Serializer.serialize(comment, level: :essential)
    end

  end

  #
  # Helpers
  #

  def create_space(ctx) do
    group_fixture(ctx.creator, %{company_id: ctx.company.id, company_permissions: Binding.no_access()})
  end

  def create_project(ctx, space, company_members_level, space_members_level, project_member_level) do
    project = project_fixture(%{
      company_id: ctx.company.id,
      creator_id: ctx.creator.id,
      group_id: space.id,
      company_access_level: Binding.from_atom(company_members_level),
      space_access_level: Binding.from_atom(space_members_level),
    })

    if space_members_level != :no_access do
      {:ok, _} = Operately.Groups.add_members(ctx.creator, space.id, [%{
        id: ctx.person.id,
        permissions: Binding.from_atom(space_members_level)
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

  def create_check_in(author, project) do
    check_in_fixture(%{author_id: author.id, project_id: project.id})
  end
end
