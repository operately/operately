defmodule OperatelyWeb.Api.Mutations.EditProjectRetrospectiveTest do
  use OperatelyWeb.TurboCase

  import Operately.GroupsFixtures
  import Operately.ProjectsFixtures

  alias Operately.Access.Binding
  alias Operately.Support.RichText
  alias Operately.Projects.Retrospective
  alias Operately.Notifications.SubscriptionList

  @new_content %{
    "whatWentWell" => RichText.rich_text("Everything went well"),
    "whatDidYouLearn" => RichText.rich_text("I learned many things"),
    "whatCouldHaveGoneBetter" => RichText.rich_text("Some things could have gone better"),
  }

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :edit_project_retrospective, %{})
    end
  end

  describe "permissions" do
    @table [
      %{company: :no_access,      space: :no_access,      project: :no_access,      expected: 404},
      %{company: :no_access,      space: :no_access,      project: :comment_access, expected: 403},
      %{company: :no_access,      space: :no_access,      project: :edit_access,    expected: 200},
      %{company: :no_access,      space: :no_access,      project: :full_access,    expected: 200},

      %{company: :no_access,      space: :comment_access, project: :no_access,      expected: 403},
      %{company: :no_access,      space: :edit_access,    project: :no_access,      expected: 200},
      %{company: :no_access,      space: :full_access,    project: :no_access,      expected: 200},

      %{company: :comment_access, space: :no_access,      project: :no_access,      expected: 403},
      %{company: :edit_access,    space: :no_access,      project: :no_access,      expected: 200},
      %{company: :full_access,    space: :no_access,      project: :no_access,      expected: 200},
    ]

    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_company_member(:person)
      |> Factory.log_in_person(:person)
    end

    tabletest @table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space}, project=#{@test.project} on the project, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx)
        project = create_project(ctx, space, @test.company, @test.space, @test.project)
        retrospective = retrospective_fixture(%{project_id: project.id, author_id: ctx.creator.id})

        assert {code, res} = mutation(ctx.conn, :edit_project_retrospective, %{
          id: Paths.project_retrospective_id(retrospective),
          content: Jason.encode!(@new_content)
        })

        assert code == @test.expected

        case @test.expected do
          200 ->
            {:ok, retrospective} = Retrospective.get(:system, id: retrospective.id, opts: [
              preload: :project,
            ])
            assert res.retrospective == Serializer.serialize(retrospective)

          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "The requested resource was not found"
        end
      end
    end
  end

  describe "edit_project_retrospective functionality" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_company_member(:person)
      |> Factory.log_in_person(:person)
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_retrospective(:retrospective, :project, :person)
    end

    test "edits project retrospective", ctx do
      refute ctx.retrospective.content == @new_content

      assert {200, res} = mutation(ctx.conn, :edit_project_retrospective, %{
        id: Paths.project_retrospective_id(ctx.retrospective),
        content: Jason.encode!(@new_content)
      })

      {:ok, retrospective} = Retrospective.get(:system, id: ctx.retrospective.id, opts: [
        preload: :project,
      ])

      assert res.retrospective == Serializer.serialize(retrospective)
      assert retrospective.content == @new_content
    end

    test "doesn't edit retrospective if content doesn't have the correct keys", ctx do
      assert {400, _} = mutation(ctx.conn, :edit_project_retrospective, %{
        id: Paths.project_retrospective_id(ctx.retrospective),
        content: RichText.rich_text("some content", :as_string)
      })
    end

    test "mentioned people are added to subscriptions list", ctx do
      ctx =
        ctx
        |> Factory.add_project_contributor(:contrib1, :project, :as_person)
        |> Factory.add_project_contributor(:contrib2, :project, :as_person)
        |> Factory.add_project_contributor(:contrib3, :project, :as_person)

      content = %{
        "whatWentWell" => RichText.rich_text(mentioned_people: [ctx.contrib1]) |> Jason.decode!(),
        "whatDidYouLearn" => RichText.rich_text(mentioned_people: [ctx.contrib2]) |> Jason.decode!(),
        "whatCouldHaveGoneBetter" => RichText.rich_text(mentioned_people: [ctx.contrib3]) |> Jason.decode!(),
      }

      {:ok, list} = SubscriptionList.get(:system, parent_id: ctx.retrospective.id, opts: [
        preload: :subscriptions
      ])

      assert list.subscriptions == []

      assert {200, _} = mutation(ctx.conn, :edit_project_retrospective, %{
        id: Paths.project_retrospective_id(ctx.retrospective),
        content: Jason.encode!(content)
      })

      {:ok, list} = SubscriptionList.get(:system, parent_id: ctx.retrospective.id, opts: [
        preload: :subscriptions
      ])

      assert length(list.subscriptions) == 3

      [ctx.contrib1, ctx.contrib2, ctx.contrib3]
      |> Enum.each(fn person ->
        sub = Enum.find(list.subscriptions, &(&1.person_id == person.id))
        assert sub.type == :mentioned
      end)
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
end
