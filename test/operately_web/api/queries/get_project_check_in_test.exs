defmodule OperatelyWeb.Api.Queries.GetProjectCheckInTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures
  import Operately.ProjectsFixtures
  import Operately.GroupsFixtures
  import Operately.NotificationsFixtures
  import Operately.ActivitiesFixtures

  alias Operately.Repo
  alias Operately.Access.Binding
  alias Operately.Notifications.SubscriptionList

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, :get_project_check_in, %{})
    end
  end

  describe "permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      space = group_fixture(creator, %{company_id: ctx.company.id})

      Map.merge(ctx, %{space: space, creator: creator})
    end

    test "company members have no access", ctx do
      check_in = create_check_in(ctx, company_access: Binding.no_access())

      assert {404, res} = query(ctx.conn, :get_project_check_in, %{id: check_in.id})
      assert res.message == "The requested resource was not found"
    end

    test "company members have access", ctx do
      check_in = create_check_in(ctx, company_access: Binding.view_access())

      assert {200, res} = query(ctx.conn, :get_project_check_in, %{id: check_in.id})
      assert res.project_check_in == check_in
    end

    test "space members have no access", ctx do
      add_person_to_space(ctx)
      check_in = create_check_in(ctx, space_access: Binding.no_access())

      assert {404, res} = query(ctx.conn, :get_project_check_in, %{id: check_in.id})
      assert res.message == "The requested resource was not found"
    end

    test "space members have access", ctx do
      add_person_to_space(ctx)
      check_in = create_check_in(ctx, space_access: Binding.view_access())

      assert {200, res} = query(ctx.conn, :get_project_check_in, %{id: check_in.id})
      assert res.project_check_in == check_in
    end

    test "champions have access", ctx do
      champion = person_fixture_with_account(%{company_id: ctx.company.id})
      check_in = create_check_in(ctx, champion_id: champion.id)

      account = Repo.preload(champion, :account).account
      conn = log_in_account(ctx.conn, account)

      # champion's request
      assert {200, res} = query(conn, :get_project_check_in, %{id: check_in.id})
      assert res.project_check_in == check_in

      # another user's request
      assert {404, res} = query(ctx.conn, :get_project_check_in, %{id: check_in.id})
      assert res.message == "The requested resource was not found"
    end

    test "reviewers have access", ctx do
      reviewer = person_fixture_with_account(%{company_id: ctx.company.id})
      check_in = create_check_in(ctx, reviewer_id: reviewer.id)

      account = Repo.preload(reviewer, :account).account
      conn = log_in_account(ctx.conn, account)

      # reviewer's request
      assert {200, res} = query(conn, :get_project_check_in, %{id: check_in.id})
      assert res.project_check_in == check_in

      # another user's request
      assert {404, res} = query(ctx.conn, :get_project_check_in, %{id: check_in.id})
      assert res.message == "The requested resource was not found"
    end
  end

  describe "get_project_check_in functionality" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.log_in_person(:creator)
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_check_in(:check_in, :project, :creator)
    end

    test "include_unread_notifications", ctx do
      a = activity_fixture(author_id: ctx.creator.id, action: "project_check_in_submitted", content: %{check_in_id: ctx.check_in.id})
      n = notification_fixture(person_id: ctx.creator.id, read: false, activity_id: a.id)

      assert {200, res} = query(ctx.conn, :get_project_check_in, %{id: Paths.project_check_in_id(ctx.check_in)})
      assert res.project_check_in.notifications == []

      assert {200, res} = query(ctx.conn, :get_project_check_in, %{
        id: Paths.project_check_in_id(ctx.check_in),
        include_unread_notifications: true,
      })

      assert length(res.project_check_in.notifications) == 1
      assert Serializer.serialize(n) == hd(res.project_check_in.notifications)
    end

    test "include_author", ctx do
      assert {200, res} = query(ctx.conn, :get_project_check_in, %{
        id: Paths.project_check_in_id(ctx.check_in),
      })

      refute res.project_check_in.author

      assert {200, res} = query(ctx.conn, :get_project_check_in, %{
        id: Paths.project_check_in_id(ctx.check_in),
        include_author: true,
      })

      assert res.project_check_in.author == Serializer.serialize(ctx.creator)
    end

    test "include_reactions", ctx do
      {:ok, reaction} = Operately.Updates.create_reaction(%{
        person_id: ctx.creator.id,
        entity_id: ctx.check_in.id,
        entity_type: :project_check_in,
        emoji: "👍",
      })
      reaction = Repo.preload(reaction, :person)

      assert {200, res} = query(ctx.conn, :get_project_check_in, %{
        id: Paths.project_check_in_id(ctx.check_in),
      })

      refute res.project_check_in.reactions

      assert {200, res} = query(ctx.conn, :get_project_check_in, %{
        id: Paths.project_check_in_id(ctx.check_in),
        include_reactions: true,
      })

      assert res.project_check_in.reactions == [Serializer.serialize(reaction)]
    end

    test "include_project", ctx do
      assert {200, res} = query(ctx.conn, :get_project_check_in, %{
        id: Paths.project_check_in_id(ctx.check_in),
      })

      refute res.project_check_in.project

      assert {200, res} = query(ctx.conn, :get_project_check_in, %{
        id: Paths.project_check_in_id(ctx.check_in),
        include_project: true,
      })

      assert res.project_check_in.project
      assert res.project_check_in.project.permissions
    end

    test "include_subscriptions_list", ctx do
      assert {200, res} = query(ctx.conn, :get_project_check_in, %{id: Paths.project_check_in_id(ctx.check_in)})

      refute res.project_check_in.subscription_list

      assert {200, res} = query(ctx.conn, :get_project_check_in, %{
        id: Paths.project_check_in_id(ctx.check_in),
        include_subscriptions_list: true,
      })

      assert res.project_check_in.subscription_list
    end

    test "include_potential_subscribers", ctx do
      ctx =
        ctx
        |> Factory.add_company_member(:person)
        |> Factory.add_project_contributor(:contrib1, :project)
        |> Factory.add_project_contributor(:contrib2, :project)

      {:ok, list} = SubscriptionList.get(:system, parent_id: ctx.check_in.id)
      subscription_fixture(%{subscription_list_id: list.id, person_id: ctx.person.id})
      subscription_fixture(%{subscription_list_id: list.id, person_id: ctx.contrib1.person_id})

      assert {200, res} = query(ctx.conn, :get_project_check_in, %{
        id: Paths.project_check_in_id(ctx.check_in),
      })

      refute res.project_check_in.potential_subscribers

      assert {200, res} = query(ctx.conn, :get_project_check_in, %{
        id: Paths.project_check_in_id(ctx.check_in),
        include_potential_subscribers: true,
      })
      subs = res.project_check_in.potential_subscribers

      # person is not contrib, but has subscription
      person = Enum.find(subs, &(&1.person.id == Paths.person_id(ctx.person)))
      assert person.is_subscribed

      # contrib1 has subscription
      contrib1 = Enum.find(subs, &(equal_ids?(&1.person.id, ctx.contrib1.person_id)))
      assert contrib1.is_subscribed

      # contrib2 doesn't have subscription, but is potential subscriber
      contrib2 = Enum.find(subs, &(equal_ids?(&1.person.id, ctx.contrib2.person_id)))
      refute contrib2.is_subscribed
    end
  end

  #
  # Helpers
  #

  defp create_check_in(ctx, opts) do
    project = project_fixture(%{
      company_id: ctx.company.id,
      group_id: ctx.space.id,
      creator_id: ctx.creator.id,
      champion_id: Keyword.get(opts, :champion_id, ctx.creator.id),
      reviewer_id: Keyword.get(opts, :reviewer_id, ctx.creator.id),
      company_access_level: Keyword.get(opts, :company_access, Binding.no_access()),
      space_access_level: Keyword.get(opts, :space_access, Binding.no_access()),
    })

    check_in_fixture(%{author_id: ctx.creator.id, project_id: project.id})
    |> Serializer.serialize(level: :full)
  end

  defp add_person_to_space(ctx) do
    Operately.Groups.add_members(ctx.person, ctx.space.id, [%{
      id: ctx.person.id,
      access_level: Binding.edit_access(),
    }])
  end

  def equal_ids?(short_id, id) do
    {:ok, decoded_id} = OperatelyWeb.Api.Helpers.decode_id(short_id)

    decoded_id == id
  end
end
