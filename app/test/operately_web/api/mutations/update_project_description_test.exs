defmodule OperatelyWeb.Api.Mutations.UpdateProjectDescriptionTest do
  use OperatelyWeb.TurboCase
  use Operately.Support.Notifications

  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.ProjectsFixtures
  import Ecto.Query, only: [from: 2]

  alias Operately.Access.Binding
  alias Operately.Support.RichText
  alias Operately.Repo

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :update_project_description, %{})
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

        assert {code, res} = mutation(ctx.conn, :update_project_description, %{
          project_id: Paths.project_id(project),
          description: RichText.rich_text("Hello", :as_string)
        })

        assert code == @test.expected

        case @test.expected do
          200 -> assert res == %{project: Serializer.serialize(project, level: :essential)}
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "The requested resource was not found"
        end
      end
    end
  end

  describe "notifications" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      space = group_fixture(creator, %{company_id: ctx.company.id, company_permissions: Binding.no_access()})
      project = project_fixture(%{
        company_id: ctx.company.id,
        name: "Test Project",
        creator_id: creator.id,
        group_id: space.id,
        company_access_level: Binding.no_access(),
        space_access_level: Binding.edit_access(),
      })

      {:ok, _} = Operately.Groups.add_members(creator, space.id, [%{
        id: ctx.person.id,
        access_level: Binding.edit_access()
      }])

      Map.merge(ctx, %{creator: creator, space: space, project: project})
    end

    test "it sends notifications to mentioned people", ctx do
      ctx =
        ctx
        |> Factory.setup()
        |> Factory.add_space(:engineering)
        |> Factory.add_project(:project, :engineering)
        |> Factory.add_space_member(:mentioned_person, :engineering)
        |> Factory.log_in_person(:creator)

      description = RichText.rich_text(mentioned_people: [ctx.mentioned_person])

      {200, _} = Oban.Testing.with_testing_mode(:manual, fn ->
        mutation(ctx.conn, :update_project_description, %{
          project_id: Paths.project_id(ctx.project),
          description: description
        })
      end)

      action = "project_description_changed"
      activity = get_activity(ctx.project.id, action)

      assert 0 == notifications_count(action: action)

      perform_job(activity.id)
      notifications = fetch_notifications(activity.id, action: action)

      assert 1 == notifications_count(action: action)
      assert hd(notifications).person_id == ctx.mentioned_person.id
    end

    test "it sends notifications to multiple mentioned people", ctx do
      ctx =
        ctx
        |> Factory.setup()
        |> Factory.add_space(:engineering)
        |> Factory.add_project(:project, :engineering)
        |> Factory.add_space_member(:person1, :engineering)
        |> Factory.add_space_member(:person2, :engineering)
        |> Factory.log_in_person(:creator)

      description = RichText.rich_text(mentioned_people: [ctx.person1, ctx.person2])

      {200, _} = Oban.Testing.with_testing_mode(:manual, fn ->
        mutation(ctx.conn, :update_project_description, %{
          project_id: Paths.project_id(ctx.project),
          description: description
        })
      end)

      action = "project_description_changed"
      activity = get_activity(ctx.project.id, action)

      assert 0 == notifications_count(action: action)

      perform_job(activity.id)
      notifications = fetch_notifications(activity.id, action: action)

      assert 2 == notifications_count(action: action)

      [ctx.person1, ctx.person2]
      |> Enum.each(fn p ->
        assert Enum.find(notifications, &(&1.person_id == p.id))
      end)
    end

    test "it continues to notify subscribed people even when not mentioned", ctx do
      ctx =
        ctx
        |> Factory.setup()
        |> Factory.add_space(:engineering)
        |> Factory.add_project(:project, :engineering)
        |> Factory.add_space_member(:mentioned_person, :engineering)
        |> Factory.log_in_person(:creator)

      # First update: mention the person
      description_with_mention = RichText.rich_text(mentioned_people: [ctx.mentioned_person])

      {200, _} = Oban.Testing.with_testing_mode(:manual, fn ->
        mutation(ctx.conn, :update_project_description, %{
          project_id: Paths.project_id(ctx.project),
          description: description_with_mention
        })
      end)

      action = "project_description_changed"
      activity = get_activity(ctx.project.id, action)

      perform_job(activity.id)
      notifications = fetch_notifications(activity.id, action: action)

      assert 1 == notifications_count(action: action)
      assert hd(notifications).person_id == ctx.mentioned_person.id

      # Second update: don't mention the person, but they should still be notified
      :timer.sleep(25)
      description_without_mention = RichText.rich_text("Updated description without mentions", :as_string)

      {200, _} = Oban.Testing.with_testing_mode(:manual, fn ->
        mutation(ctx.conn, :update_project_description, %{
          project_id: Paths.project_id(ctx.project),
          description: description_without_mention
        })
      end)

      activity = get_activity(ctx.project.id, action)

      perform_job(activity.id)
      notifications = fetch_notifications(activity.id, action: action)

      assert 2 == notifications_count(action: action)
      assert Enum.find(notifications, &(&1.person_id == ctx.mentioned_person.id))
    end

    test "Person without permissions is not notified when mentioned", ctx do
      ctx =
        ctx
        |> Factory.setup()
        |> Factory.log_in_person(:creator)
        |> Factory.add_company_member(:person)
        |> Factory.add_space(:engineering)
        |> Factory.add_project(:project, :engineering, company_access_level: Binding.no_access())

      description = RichText.rich_text(mentioned_people: [ctx.person])

      {200, _} = Oban.Testing.with_testing_mode(:manual, fn ->
        mutation(ctx.conn, :update_project_description, %{
          project_id: Paths.project_id(ctx.project),
          description: description
        })
      end)

      action = "project_description_changed"
      activity = get_activity(ctx.project.id, action)

      perform_job(activity.id)

      assert notifications_count(action: action) == 0
      assert fetch_notifications(activity.id, action: action) == []

      # With permissions
      :timer.sleep(25)
      {:ok, _} = Operately.Groups.add_members(ctx.creator, ctx.engineering.id, [
        %{id: ctx.person.id, access_level: Operately.Access.Binding.view_access()}
      ])

      {200, _} = Oban.Testing.with_testing_mode(:manual, fn ->
        mutation(ctx.conn, :update_project_description, %{
          project_id: Paths.project_id(ctx.project),
          description: description
        })
      end)

      activity = get_activity(ctx.project.id, action)

      perform_job(activity.id)
      notifications = fetch_notifications(activity.id, action: action)

      assert notifications_count(action: action) == 1
      assert hd(notifications).person_id == ctx.person.id
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

  defp get_activity(project_id, action) do
    from(a in Operately.Activities.Activity,
      where: a.action == ^action and a.content["project_id"] == ^project_id,
      order_by: [desc: a.inserted_at],
      limit: 1
    )
    |> Repo.one()
  end
end
