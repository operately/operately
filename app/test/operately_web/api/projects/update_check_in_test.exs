defmodule OperatelyWeb.Api.Projects.UpdateCheckInTest do
  use OperatelyWeb.TurboCase

  alias Operately.Support.RichText
  alias Operately.Access.Binding
  alias Operately.Notifications.SubscriptionList

  import Operately.GroupsFixtures
  import Operately.PeopleFixtures
  import Operately.ProjectsFixtures

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:projects, :update_check_in], %{})
    end
  end

  describe "permissions" do
    @table [
      %{company: :no_access, space: :no_access, project: :no_access, expected: 404},
      %{company: :no_access, space: :no_access, project: :comment_access, expected: 403},
      %{company: :no_access, space: :no_access, project: :edit_access, expected: 200},
      %{company: :no_access, space: :no_access, project: :full_access, expected: 200},
      %{company: :no_access, space: :comment_access, project: :no_access, expected: 403},
      %{company: :no_access, space: :edit_access, project: :no_access, expected: 200},
      %{company: :no_access, space: :full_access, project: :no_access, expected: 200},
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
        check_in = create_check_in(ctx.creator, project)

        assert {code, res} =
                 mutation(ctx.conn, [:projects, :update_check_in], %{
                   check_in_id: Paths.project_check_in_id(check_in),
                   status: "on_track",
                   description: RichText.rich_text("New description", :as_string)
                 })

        assert code == @test.expected

        case @test.expected do
          200 ->
            check_in = Repo.reload(check_in)
            assert res == %{check_in: Serializer.serialize(check_in, level: :essential)}

          403 ->
            assert res.message == "You don't have permission to perform this action"

          404 ->
            assert res.message == "The requested resource was not found"
        end
      end
    end
  end

  describe "edit_project_check_in functionality" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.log_in_person(:creator)
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_check_in(:check_in, :project, :creator)
    end

    test "edits project check-in", ctx do
      assert {200, res} =
               mutation(ctx.conn, [:projects, :update_check_in], %{
                 check_in_id: Paths.project_check_in_id(ctx.check_in),
                 status: "on_track",
                 description: RichText.rich_text("New description", :as_string)
               })

      check_in = Repo.reload(ctx.check_in)

      assert res.check_in == Serializer.serialize(check_in)
    end

    test "publishes a draft project check-in", ctx do
      {:ok, draft} =
        Ecto.Changeset.change(ctx.check_in, %{
          state: :draft,
          published_at: nil
        })
        |> Repo.update()

      assert {200, res} =
               mutation(ctx.conn, [:projects, :update_check_in], %{
                 check_in_id: Paths.project_check_in_id(draft),
                 status: "off_track",
                 description: RichText.rich_text("Ready to publish", :as_string),
                 state: "published"
               })

      check_in = Repo.reload(draft)
      project = Repo.reload(ctx.project)

      assert res.check_in.state == "published"
      assert check_in.state == :published
      assert check_in.published_at
      assert project.last_check_in_id == check_in.id
      assert project.last_check_in_status == check_in.status
    end

    test "rejects rescheduling a project check-in for now or earlier", ctx do
      {:ok, draft} =
        Ecto.Changeset.change(ctx.check_in, %{state: :draft, published_at: nil})
        |> Repo.update()

      for scheduled_at <- [DateTime.utc_now(), DateTime.add(DateTime.utc_now(), -1, :second)] do
        assert {400, res} =
                 mutation(ctx.conn, [:projects, :update_check_in], %{
                   check_in_id: Paths.project_check_in_id(draft),
                   status: "on_track",
                   description: RichText.rich_text("Invalid schedule", :as_string),
                   scheduled_at: DateTime.to_iso8601(scheduled_at)
                 })

        assert res.message == "Scheduled time must be in the future"
      end
    end

    test "mentioned people are added to subscriptions list", ctx do
      ctx =
        ctx
        |> Factory.add_project_contributor(:contrib1, :project, :as_person)
        |> Factory.add_project_contributor(:contrib2, :project, :as_person)
        |> Factory.add_project_contributor(:contrib3, :project, :as_person)

      people = [ctx.contrib1, ctx.contrib2, ctx.contrib3]

      {:ok, list} =
        SubscriptionList.get(:system,
          parent_id: ctx.check_in.id,
          opts: [
            preload: :subscriptions
          ]
        )

      assert list.subscriptions == []

      description = RichText.rich_text(mentioned_people: people)

      assert {200, _} =
               mutation(ctx.conn, [:projects, :update_check_in], %{
                 check_in_id: Paths.project_check_in_id(ctx.check_in),
                 status: "on_track",
                 description: description
               })

      {:ok, list} =
        SubscriptionList.get(:system,
          parent_id: ctx.check_in.id,
          opts: [
            preload: :subscriptions
          ]
        )

      assert length(list.subscriptions) == 3

      Enum.each(people, fn p ->
        assert Enum.find(list.subscriptions, &(&1.person_id == p.id))
      end)
    end
  end

  describe "full edit window after publish" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.log_in_person(:creator)
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_check_in(:check_in, :project, :creator)
    end

    test "allows status edits within 3 days of published_at for a late-published check-in", ctx do
      check_in =
        ctx.check_in
        |> set_check_in_dates(
          inserted_at: days_ago_naive(10),
          published_at: Operately.Time.utc_datetime_now()
        )

      {:ok, project} =
        Operately.Projects.update_project(ctx.project, %{
          last_check_in_id: check_in.id,
          last_check_in_status: check_in.status
        })

      assert {200, _} =
               mutation(ctx.conn, [:projects, :update_check_in], %{
                 check_in_id: Paths.project_check_in_id(check_in),
                 status: "off_track",
                 description: RichText.rich_text("Edited description", :as_string)
               })

      check_in = Repo.reload(check_in)
      project = Repo.reload(project)

      assert check_in.status == :off_track
      assert project.last_check_in_status == :off_track
    end

    test "limits edits to description only outside the 3-day window from published_at", ctx do
      check_in =
        ctx.check_in
        |> set_check_in_dates(
          inserted_at: days_ago_naive(1),
          published_at: Operately.Time.days_ago(4)
        )

      {:ok, project} =
        Operately.Projects.update_project(ctx.project, %{
          last_check_in_id: check_in.id,
          last_check_in_status: check_in.status
        })

      assert {200, _} =
               mutation(ctx.conn, [:projects, :update_check_in], %{
                 check_in_id: Paths.project_check_in_id(check_in),
                 status: "off_track",
                 description: RichText.rich_text("Edited description", :as_string)
               })

      check_in = Repo.reload(check_in)
      project = Repo.reload(project)

      assert check_in.status == :on_track
      assert check_in.description == RichText.rich_text("Edited description")
      assert project.last_check_in_status == :on_track
    end
  end

  #
  # Helpers
  #

  defp create_space(ctx) do
    group_fixture(ctx.creator, %{company_id: ctx.company.id, company_permissions: Binding.no_access()})
  end

  defp create_project(ctx, space, company_members_level, space_members_level, project_member_level) do
    project =
      project_fixture(%{
        company_id: ctx.company.id,
        name: "Name",
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
        Operately.Projects.create_contributor(ctx.creator, %{
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

  defp set_check_in_dates(check_in, dates) do
    {:ok, check_in} =
      Ecto.Changeset.change(check_in, %{
        inserted_at: dates[:inserted_at],
        published_at: dates[:published_at]
      })
      |> Repo.update()

    check_in
  end

  defp days_ago_naive(days) do
    NaiveDateTime.utc_now() |> NaiveDateTime.add(-days, :day) |> NaiveDateTime.truncate(:second)
  end
end
