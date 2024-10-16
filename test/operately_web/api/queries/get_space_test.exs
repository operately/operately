defmodule OperatelyWeb.Api.Queries.GetSpaceTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.NotificationsFixtures
  import Operately.ActivitiesFixtures

  alias Operately.{Repo, Groups}
  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, :get_space, %{id: "1"})
    end
  end

  describe "permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})

      Map.merge(ctx, %{creator: creator})
    end

    test "member has access to company space", ctx do
      space = Groups.get_group!(ctx.company.company_space_id)

      assert {200, %{space: space} = _res} = query(ctx.conn, :get_space, %{id: Paths.space_id(space)})
      assert space.name == "Company"
      assert space.mission == "Organization-wide announcements and resources"
      assert space.is_company_space
    end

    test "member doesn't have access to space they are not part of", ctx do
      space = group_fixture(ctx.creator, company_id: ctx.company.id) |> Repo.preload(:company)

      assert {404, res} = query(ctx.conn, :get_space, %{id: Paths.space_id(space)})
      assert res.message == "The requested resource was not found"
    end

    test "members has access to space they are part of", ctx do
      space = group_fixture(ctx.creator, company_id: ctx.company.id) |> Repo.preload(:company)
      add_person_to_space(ctx, space)
      space = Groups.Group.load_is_member(space, ctx.person)

      assert {200, res} = query(ctx.conn, :get_space, %{id: Paths.space_id(space)})
      assert res.space == Serializer.serialize(space, level: :full)
    end

    test "member has access to space they are NOT part of", ctx do
      space =
        group_fixture(ctx.creator, [
          company_id: ctx.company.id,
          company_permissions: Binding.view_access(),
        ])
        |> Repo.preload(:company)
        |> Groups.Group.load_is_member(ctx.person)
        |> Serializer.serialize(level: :full)

      assert {200, res} = query(ctx.conn, :get_space, %{id: space.id})
      assert res.space == space
      refute res.space.is_member
    end
  end

  describe "get_space functionality" do
    setup :register_and_log_in_account

    test "space does not exist", ctx do
      id = Operately.ShortUuid.encode!(Ecto.UUID.generate())
      assert {404, _} = query(ctx.conn, :get_space, %{id: id})
    end

    test "get_space", ctx do
      space = group_fixture(ctx.person, company_id: ctx.company.id)

      assert {200, res} = query(ctx.conn, :get_space, %{id: Paths.space_id(space)})
      assert res.space == %{
        id: Paths.space_id(space),
        name: space.name,
        mission: space.mission,
        icon: space.icon,
        color: space.color,
        is_company_space: ctx.company.company_space_id == space.id,
        is_member: true,
        members: nil,
        access_levels: nil,
        potential_subscribers: nil,
        notifications: [],
        permissions: nil,
      }
    end

    test "get_space when not a member", ctx do
      creator = person_fixture(company_id: ctx.company.id)
      space = group_fixture(creator, [
        company_id: ctx.company.id,
        company_permissions: Binding.view_access(),
      ])

      assert {200, res} = query(ctx.conn, :get_space, %{id: Paths.space_id(space)})
      assert res.space == %{
        id: Paths.space_id(space),
        name: space.name,
        mission: space.mission,
        icon: space.icon,
        color: space.color,
        is_company_space: ctx.company.company_space_id == space.id,
        is_member: false,
        members: nil,
        access_levels: nil,
        potential_subscribers: nil,
        notifications: [],
        permissions: nil,
      }
    end

    test "include_unread_notifications", ctx do
      space = group_fixture(ctx.person, [company_id: ctx.company.id])
      a = activity_fixture(author_id: ctx.company_creator.id, action: "space_members_added", content: %{space_id: space.id})
      n = notification_fixture(person_id: ctx.person.id, read: false, activity_id: a.id)

      assert {200, res} = query(ctx.conn, :get_space, %{id: Paths.space_id(space)})
      assert res.space.notifications == []

      assert {200, res} = query(ctx.conn, :get_space, %{
        id: Paths.space_id(space),
        include_unread_notifications: true,
      })

      assert length(res.space.notifications) == 1
      assert Serializer.serialize(n) == hd(res.space.notifications)
    end

    test "include_members", ctx do
      space = group_fixture(ctx.person, company_id: ctx.company.id)

      m1 = person_fixture(company_id: ctx.company.id, full_name: "Alice Smith")
      m2 = person_fixture(company_id: ctx.company.id, full_name: "Bob Smith")
      m3 = person_fixture(company_id: ctx.company.id, full_name: "Charlie Smith")

      members = [m1, m2, m3] |> Enum.map(fn person -> %{id: person.id, access_level: Binding.comment_access()} end)
      Operately.Groups.add_members(ctx.person, space.id, members)

      assert {200, res} = query(ctx.conn, :get_space, %{id: Paths.space_id(space), include_members: true})
      assert length(res.space.members) == 4 # 3 members + current user

      [m1, m2, m3, ctx.person]
      |> Enum.sort_by(fn m -> m.full_name end)
      |> Enum.with_index()
      |> Enum.map(fn {m, i} -> {m, Enum.at(res.space.members, i)} end)
      |> Enum.each(fn {m, res} ->
        assert res == %{id: Paths.person_id(m), full_name: m.full_name, avatar_url: m.avatar_url, title: m.title, has_open_invitation: false}
      end)
    end

    test "include_access_levels", ctx do
      space = group_fixture(ctx.person, company_id: ctx.company.id, company_permissions: Binding.comment_access(), public_permissions: Binding.view_access())

      assert {200, res} = query(ctx.conn, :get_space, %{id: Paths.space_id(space)})

      refute res.space.access_levels

      assert {200, res} = query(ctx.conn, :get_space, %{id: Paths.space_id(space), include_access_levels: true})

      assert res.space.access_levels.public == Binding.view_access()
      assert res.space.access_levels.company == Binding.comment_access()
    end

    test "include_potential_subscribers", ctx do
      ctx = Factory.add_company_member(ctx, :creator)
        |> Factory.log_in_person(:creator)
        |> Factory.add_space(:space)
        |> Factory.add_space_member(:member1, :space)
        |> Factory.add_space_member(:member2, :space)
        |> Factory.add_space_member(:member3, :space)

      assert {200, res} = query(ctx.conn, :get_space, %{id: Paths.space_id(ctx.space)})

      refute res.space.potential_subscribers

      assert {200, res} = query(ctx.conn, :get_space, %{
        id: Paths.space_id(ctx.space),
        include_potential_subscribers: true,
      })

      assert length(res.space.potential_subscribers) == 4

      [ctx.creator, ctx.member1, ctx.member2, ctx.member3]
      |> Enum.each(fn member ->
        sub = Enum.find(res.space.potential_subscribers, &(&1.person.id == Paths.person_id(member)))
        refute sub.priority
        refute sub.is_subscribed
      end)
    end
  end

  #
  # Helpers
  #

  defp add_person_to_space(ctx, space) do
    Operately.Groups.add_members(ctx.person, space.id, [%{
      id: ctx.person.id,
      access_level: Binding.view_access(),
    }])
  end
end
