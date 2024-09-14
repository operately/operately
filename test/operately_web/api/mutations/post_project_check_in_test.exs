defmodule OperatelyWeb.Api.Mutations.PostProjectCheckInTest do
  use OperatelyWeb.TurboCase

  import Ecto.Query, only: [from: 1]
  import Operately.ProjectsFixtures
  import Operately.GroupsFixtures
  import Operately.PeopleFixtures

  alias Operately.Access.Binding
  alias Operately.Projects.CheckIn
  alias Operately.Support.RichText
  alias Operately.Notifications.SubscriptionList

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :post_project_check_in, %{})
    end
  end

  describe "permissions" do
    @table [
      %{company: :no_access,      space: :no_access,      project: :no_access,      expected: 404},
      %{company: :no_access,      space: :no_access,      project: :view_access,    expected: 403},
      %{company: :no_access,      space: :no_access,      project: :comment_access, expected: 403},
      %{company: :no_access,      space: :no_access,      project: :edit_access,    expected: 200},
      %{company: :no_access,      space: :no_access,      project: :full_access,    expected: 200},

      %{company: :no_access,      space: :view_access,    project: :no_access,      expected: 403},
      %{company: :no_access,      space: :comment_access, project: :no_access,      expected: 403},
      %{company: :no_access,      space: :edit_access,    project: :no_access,      expected: 200},
      %{company: :no_access,      space: :full_access,    project: :no_access,      expected: 200},

      %{company: :view_access,    space: :no_access,      project: :no_access,      expected: 403},
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

        assert {code, res} = mutation(ctx.conn, :post_project_check_in, %{
          project_id: Paths.project_id(project),
          status: "on_track",
          description: RichText.rich_text("Description", :as_string),
        })

        assert code == @test.expected

        case @test.expected do
          200 ->
            check_in = Repo.one!(from(p in CheckIn))
            assert res.check_in == Serializer.serialize(check_in, level: :essential)
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "The requested resource was not found"
        end
      end
    end
  end

  describe "post_project_check_in functionality" do
    setup :register_and_log_in_account

    test "creates project check-in", ctx do
      project = project_fixture(%{company_id: ctx.company.id, creator_id: ctx.person.id, group_id: ctx.company.company_space_id})

      assert Repo.all(from(p in CheckIn)) == []

      assert {200, res} = mutation(ctx.conn, :post_project_check_in, %{
        project_id: Paths.project_id(project),
        status: "on_track",
        description: RichText.rich_text("Description", :as_string),
      })

      check_in = Repo.one!(from(p in CheckIn))
      assert res.check_in == Serializer.serialize(check_in, level: :essential)
    end
  end

  describe "subscriptions to notifications" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      project = project_fixture(%{company_id: ctx.company.id, creator_id: ctx.person.id, group_id: ctx.company.company_space_id})
      people = Enum.map(1..3, fn _ ->
        person_fixture(%{company_id: ctx.company.id})
      end)

      Map.merge(ctx, %{project: project, people: people})
    end

    test "creates subscription list for project check-in", ctx do
      assert {200, res} = mutation(ctx.conn, :post_project_check_in, %{
        project_id: Paths.project_id(ctx.project),
        status: "on_track",
        description: RichText.rich_text("Description", :as_string),
        send_notifications_to_everyone: true,
        subscriber_ids: Enum.map(ctx.people, &(Paths.person_id(&1))),
      })

      {:ok, id} = OperatelyWeb.Api.Helpers.decode_id(res.check_in.id)
      {:ok, list} = SubscriptionList.get(:system, parent_id: id, opts: [preload: :subscriptions])

      assert list.send_to_everyone
      assert length(list.subscriptions) == 4

      Enum.each([ctx.person | ctx.people], fn p ->
        assert Enum.filter(list.subscriptions, &(&1.person_id == p.id))
      end)
    end

    test "adds mentioned people to subscription list", ctx do
      people = ctx.people ++ ctx.people ++ ctx.people
      description = RichText.rich_text(mentioned_people: people)

      assert {200, res} = mutation(ctx.conn, :post_project_check_in, %{
        project_id: Paths.project_id(ctx.project),
        status: "on_track",
        description: description,
        send_notifications_to_everyone: false,
        subscriber_ids: [],
      })

      subscriptions = fetch_subscriptions(res)

      assert length(subscriptions) == 4

      Enum.each([ctx.person | ctx.people], fn p ->
        assert Enum.filter(subscriptions, &(&1.person_id == p.id))
      end)
    end

    test "doesn't create repeated subscription", ctx do
      people = [ctx.person | ctx.people]
      description = RichText.rich_text(mentioned_people: people)

      assert {200, res} = mutation(ctx.conn, :post_project_check_in, %{
        project_id: Paths.project_id(ctx.project),
        status: "on_track",
        description: description,
        send_notifications_to_everyone: true,
        subscriber_ids: Enum.map(ctx.people, &(Paths.person_id(&1))),
      })

      subscriptions = fetch_subscriptions(res)

      assert length(subscriptions) == 4

      Enum.each(people, fn p ->
        assert Enum.filter(subscriptions, &(&1.person_id == p.id))
      end)
    end
  end

  #
  # Helpers
  #

  defp fetch_subscriptions(res) do
    {:ok, id} = OperatelyWeb.Api.Helpers.decode_id(res.check_in.id)
    {:ok, list} = SubscriptionList.get(:system, parent_id: id, opts: [preload: :subscriptions])

    list.subscriptions
  end

  defp create_space(ctx) do
    group_fixture(ctx.creator, %{company_id: ctx.company.id, company_permissions: Binding.no_access()})
  end

  defp create_project(ctx, space, company_members_level, space_members_level, project_member_level) do
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
