defmodule OperatelyWeb.Api.Mutations.CloseProjectTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.ProjectsFixtures

  alias Operately.{Repo, Projects}
  alias Operately.Notifications.SubscriptionList
  alias Operately.Projects.Retrospective
  alias Operately.Access.Binding
  alias Operately.Support.RichText

  @retrospective_content RichText.rich_text("some content")

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :close_project, %{})
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
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      Map.merge(ctx, %{creator: creator})
    end

    tabletest @table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space}, project=#{@test.project} on the project, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx)
        project = create_project(ctx, space, @test.company, @test.space, @test.project)

        assert {code, res} = request(ctx.conn, project)
        assert code == @test.expected

        case @test.expected do
          200 -> assert_project_closed(res, project)
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "The requested resource was not found"
        end
      end
    end
  end

  describe "close_project functionality" do
    setup :register_and_log_in_account

    test "closes project", ctx do
      project = create_project(ctx)

      assert_project_not_closed(project)

      assert {200, res} = request(ctx.conn, project)

      assert_project_closed(res, project)
    end
  end

  describe "subscriptions to notifications" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.log_in_person(:creator)
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_contributor(:contrib1, :project, :as_person)
      |> Factory.add_project_contributor(:contrib2, :project, :as_person)
      |> Factory.add_project_contributor(:contrib3, :project, :as_person)
      |> Factory.add_project_contributor(:contrib4, :project, :as_person)
    end

    test "creates subscription list for project retrospective", ctx do
      people = [ctx.contrib1, ctx.contrib2, ctx.contrib3, ctx.contrib4]

      assert {200, res} = mutation(ctx.conn, :close_project, %{
        project_id: Paths.project_id(ctx.project),
        retrospective: Jason.encode!(@retrospective_content),
        success_status: "achieved",
        send_notifications_to_everyone: true,
        subscriber_ids: Enum.map(people, &(Paths.person_id(&1))),
      })

      {:ok, id} = OperatelyWeb.Api.Helpers.decode_id(res.retrospective.id)
      {:ok, list} = SubscriptionList.get(:system, parent_id: id, opts: [preload: :subscriptions])

      assert list.send_to_everyone
      assert length(list.subscriptions) == 5

      Enum.each([ctx.creator | people], fn p ->
        assert Enum.filter(list.subscriptions, &(&1.person_id == p.id))
      end)

      {:ok, message} = Retrospective.get(:system, id: id)

      assert message.subscription_list_id == list.id
    end

    test "adds mentioned people to subscription list", ctx do
      retrospective_content =
        RichText.rich_text(mentioned_people: [ctx.contrib1, ctx.contrib2, ctx.contrib3, ctx.contrib4])
        |> Jason.decode!()

      assert {200, res} = mutation(ctx.conn, :close_project, %{
        project_id: Paths.project_id(ctx.project),
        retrospective: Jason.encode!(retrospective_content),
        success_status: "achieved",
        send_notifications_to_everyone: false,
        subscriber_ids: [],
      })

      subscriptions = fetch_subscriptions(res)

      assert length(subscriptions) == 5

      Enum.each([ctx.contrib1, ctx.contrib2, ctx.contrib3, ctx.contrib4], fn p ->
        sub = Enum.find(subscriptions, &(&1.person_id == p.id))
        assert sub.type == :mentioned
      end)

      sub = Enum.find(subscriptions, &(&1.person_id == ctx.creator.id))
      assert sub.type == :invited
    end

    test "doesn't create repeated subscription", ctx do
      people = [ctx.creator, ctx.contrib1, ctx.contrib2]
      retrospective_content =
        RichText.rich_text(mentioned_people: [ctx.contrib1, ctx.contrib1, ctx.contrib2])
        |> Jason.decode!()

      assert {200, res} = mutation(ctx.conn, :close_project, %{
        project_id: Paths.project_id(ctx.project),
        retrospective: Jason.encode!(retrospective_content),
        success_status: "achieved",
        send_notifications_to_everyone: false,
        subscriber_ids: Enum.map(people, &(Paths.person_id(&1))),
      })

      subscriptions = fetch_subscriptions(res)

      assert length(subscriptions) == 3

      Enum.each(people, fn p ->
        assert Enum.filter(subscriptions, &(&1.person_id == p.id))
      end)
    end
  end

  #
  # Steps
  #

  defp request(conn, project) do
    mutation(conn, :close_project, %{
      project_id: Paths.project_id(project),
      retrospective: RichText.rich_text("some content", :as_string),
      success_status: "achieved",
    })
  end

  defp assert_project_not_closed(project) do
    project = Repo.reload(project)

    assert project.status == "active"
    assert {:error, :not_found} = Retrospective.get(:system, project_id: project.id)
  end

  defp assert_project_closed(res, project) do
    project = Repo.reload(project)

    assert project.status == "closed"
    assert {:ok, retrospective} = Retrospective.get(:system, project_id: project.id)
    assert res.retrospective == Serializer.serialize(retrospective)
  end

  #
  # Helpers
  #

  defp fetch_subscriptions(res) do
    {:ok, id} = OperatelyWeb.Api.Helpers.decode_id(res.retrospective.id)
    {:ok, list} = SubscriptionList.get(:system, parent_id: id, opts: [preload: :subscriptions])

    list.subscriptions
  end

  defp create_space(ctx) do
    group_fixture(ctx.creator, %{company_id: ctx.company.id, company_permissions: Binding.no_access()})
  end

  defp create_project(ctx, space, company_level, space_level, project_level) do
    project = project_fixture(%{
      company_id: ctx.company.id,
      name: "Project 1",
      creator_id: ctx.creator.id,
      group_id: space.id,
      company_access_level: Binding.from_atom(company_level),
      space_access_level: Binding.from_atom(space_level),
    })

    if space_level != :no_access do
      {:ok, _} = Operately.Groups.add_members(ctx.creator, space.id, [%{
        id: ctx.person.id,
        access_level: Binding.from_atom(space_level)
      }])
    end

    if project_level != :no_access do
      {:ok, _} = Projects.create_contributor(ctx.creator, %{
        project_id: project.id,
        person_id: ctx.person.id,
        permissions: Binding.from_atom(project_level),
        responsibility: "some responsibility"
      })
    end

    project
  end

  defp create_project(ctx, attrs \\ %{}) do
    project_fixture(Map.merge(%{
      company_id: ctx.company.id,
      name: "Project 1",
      creator_id: ctx[:creator_id] || ctx.person.id,
      group_id: ctx[:space_id] || ctx.company.company_space_id,
      company_access_level: Binding.no_access(),
      space_access_level: Binding.no_access(),
    }, Enum.into(attrs, %{})))
  end
end
