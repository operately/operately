defmodule OperatelyWeb.Api.Mutations.CloseProjectTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.ProjectsFixtures

  alias Operately.{Repo, Projects, Companies}
  alias Operately.Notifications.SubscriptionList
  alias Operately.Projects.Retrospective
  alias Operately.Access.Binding
  alias Operately.Support.RichText

  @retrospective_content %{
    "whatWentWell" => RichText.rich_text("some content"),
    "whatDidYouLearn" => RichText.rich_text("some content"),
    "whatCouldHaveGoneBetter" => RichText.rich_text("some content"),
  }

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :close_project, %{})
    end
  end

  describe "permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      space = group_fixture(creator, %{company_id: ctx.company.id})

      Map.merge(ctx, %{creator: creator, creator_id: creator.id, space_id: space.id})
    end

    test "company members without view access can't see a project", ctx do
      project = create_project(ctx, company_access_level: Binding.no_access())

      assert {404, res} = request(ctx.conn, project)
      assert res.message == "The requested resource was not found"
      assert_project_not_closed(project)
    end

    test "company members without edit access can't close a project", ctx do
      project = create_project(ctx, company_access_level: Binding.comment_access())

      assert {403, res} = request(ctx.conn, project)
      assert res.message == "You don't have permission to perform this action"
      assert_project_not_closed(project)
    end

    test "company members with edit access can close a project", ctx do
      project = create_project(ctx, company_access_level: Binding.full_access())

      assert {200, res} = request(ctx.conn, project)
      assert_project_closed(res, project)
    end

    test "company admins can close a project", ctx do
      project = create_project(ctx, company_access_level: Binding.view_access())

      # Not admin
      assert {403, _} = request(ctx.conn, project)
      assert_project_not_closed(project)

      # Admin
      {:ok, _} = Companies.add_admin(ctx.company_creator, ctx.person.id)

      assert {200, res} = request(ctx.conn, project)
      assert_project_closed(res, project)
    end

    test "space members without view access can't see a project", ctx do
      add_person_to_space(ctx)
      project = create_project(ctx, space_access_level: Binding.no_access())

      assert {404, res} = request(ctx.conn, project)
      assert res.message == "The requested resource was not found"
      assert_project_not_closed(project)
    end

    test "space members without edit access can't close a project", ctx do
      add_person_to_space(ctx)
      project = create_project(ctx, space_access_level: Binding.comment_access())

      assert {403, res} = request(ctx.conn, project)
      assert res.message == "You don't have permission to perform this action"
      assert_project_not_closed(project)
    end

    test "space members with edit access can close a project", ctx do
      add_person_to_space(ctx)
      project = create_project(ctx, space_access_level: Binding.full_access())

      assert {200, res} = request(ctx.conn, project)
      assert_project_closed(res, project)
    end

    test "space managers can close a project", ctx do
      add_person_to_space(ctx)
      project = create_project(ctx, space_access_level: Binding.view_access())

      # Not manager
      assert {403, _} = request(ctx.conn, project)
      assert_project_not_closed(project)

      # Manager
      add_manager_to_space(ctx)
      assert {200, res} = request(ctx.conn, project)
      assert_project_closed(res, project)
    end

    test "contributors without edit access can't close a project", ctx do
      project = create_project(ctx)
      contributor = create_contributor(ctx, project, Binding.comment_access())

      account = Repo.preload(contributor, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {403, res} = request(conn, project)
      assert res.message == "You don't have permission to perform this action"
      assert_project_not_closed(project)
    end

    test "contributors with edit access can close a project", ctx do
      project = create_project(ctx)
      contributor = create_contributor(ctx, project, Binding.full_access())

      account = Repo.preload(contributor, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, res} = request(conn, project)
      assert_project_closed(res, project)
    end

    test "champions can close a project", ctx do
      champion = person_fixture_with_account(%{company_id: ctx.company.id})
      project = create_project(ctx, champion_id: champion.id, company_access_level: Binding.view_access())

      # another user's request
      assert {403, _} = request(ctx.conn, project)
      assert_project_not_closed(project)

      # champion's request
      account = Repo.preload(champion, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, res} = request(conn, project)
      assert_project_closed(res, project)
    end

    test "reviewers can close a project", ctx do
      reviewer = person_fixture_with_account(%{company_id: ctx.company.id})
      project = create_project(ctx, reviewer_id: reviewer.id, company_access_level: Binding.view_access())

      # another user's request
      assert {403, _} = request(ctx.conn, project)
      assert_project_not_closed(project)

      # reviewer's request
      account = Repo.preload(reviewer, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, res} = request(conn, project)
      assert_project_closed(res, project)
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
      retrospective_content = %{
        "whatWentWell" => RichText.rich_text(mentioned_people: [ctx.contrib1]) |> Jason.decode!(),
        "whatDidYouLearn" => RichText.rich_text(mentioned_people: [ctx.contrib2]) |> Jason.decode!(),
        "whatCouldHaveGoneBetter" => RichText.rich_text(mentioned_people: [ctx.contrib3, ctx.contrib4]) |> Jason.decode!(),
      }

      assert {200, res} = mutation(ctx.conn, :close_project, %{
        project_id: Paths.project_id(ctx.project),
        retrospective: Jason.encode!(retrospective_content),
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
      retrospective_content = %{
        "whatWentWell" => RichText.rich_text(mentioned_people: [ctx.contrib1, ctx.contrib1]) |> Jason.decode!(),
        "whatDidYouLearn" => RichText.rich_text(mentioned_people: [ctx.contrib1]) |> Jason.decode!(),
        "whatCouldHaveGoneBetter" => RichText.rich_text(mentioned_people: [ctx.contrib1, ctx.contrib2]) |> Jason.decode!(),
      }
      people = [ctx.creator, ctx.contrib1, ctx.contrib2]

      assert {200, res} = mutation(ctx.conn, :close_project, %{
        project_id: Paths.project_id(ctx.project),
        retrospective: Jason.encode!(retrospective_content),
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

  defp create_contributor(ctx, project, permissions) do
    contributor = person_fixture_with_account(%{company_id: ctx.company.id})
    {:ok, _} = Projects.create_contributor(ctx.creator, %{
      project_id: project.id,
      person_id: contributor.id,
      responsibility: "some responsibility",
      permissions: permissions,
    })
    contributor
  end

  defp add_person_to_space(ctx) do
    Operately.Groups.add_members(ctx.person, ctx.space_id, [%{
      id: ctx.person.id,
      access_level: Binding.edit_access(),
    }])
  end

  defp add_manager_to_space(ctx) do
    Operately.Groups.add_members(ctx.person, ctx.space_id, [%{
      id: ctx.person.id,
      access_level: Binding.full_access(),
    }])
  end
end
