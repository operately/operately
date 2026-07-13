defmodule OperatelyWeb.Api.Projects.ListCheckInsTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures
  import Operately.ProjectsFixtures
  import Operately.GroupsFixtures

  alias Operately.Repo
  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, [:projects, :list_check_ins], %{})
    end
  end

  describe "permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      space = group_fixture(creator, %{company_id: ctx.company.id})
      space_id = Paths.space_id(space)

      Map.merge(ctx, %{space: space, space_id: space_id, creator: creator})
    end

    test "company members have no access", ctx do
      {project_id, _} = create_project_and_check_ins(ctx, company_access: Binding.no_access())

      assert {200, res} = query(ctx.conn, [:projects, :list_check_ins], %{project_id: project_id})
      assert length(res.project_check_ins) == 0
    end

    test "company members have access", ctx do
      {project_id, check_ins} = create_project_and_check_ins(ctx, company_access: Binding.view_access())

      assert {200, res} = query(ctx.conn, [:projects, :list_check_ins], %{project_id: project_id})
      assert_check_ins(res, check_ins)
    end

    test "space members have no access", ctx do
      add_person_to_space(ctx)
      {project_id, _} = create_project_and_check_ins(ctx, space_access: Binding.no_access())

      assert {200, res} = query(ctx.conn, [:projects, :list_check_ins], %{project_id: project_id})
      assert length(res.project_check_ins) == 0
    end

    test "space members have access", ctx do
      add_person_to_space(ctx)
      {project_id, check_ins} = create_project_and_check_ins(ctx, space_access: Binding.view_access())

      assert {200, res} = query(ctx.conn, [:projects, :list_check_ins], %{project_id: project_id})
      assert_check_ins(res, check_ins)
    end

    test "champions have access", ctx do
      champion = person_fixture_with_account(%{company_id: ctx.company.id})
      {project_id, check_ins} = create_project_and_check_ins(ctx, champion_id: champion.id)

      account = Repo.preload(champion, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, res} = query(conn, [:projects, :list_check_ins], %{project_id: project_id})
      assert assert_check_ins(res, check_ins)

      assert {200, res} = query(ctx.conn, [:projects, :list_check_ins], %{project_id: project_id})
      assert length(res.project_check_ins) == 0
    end

    test "reviewers have access", ctx do
      reviewer = person_fixture_with_account(%{company_id: ctx.company.id})
      {project_id, check_ins} = create_project_and_check_ins(ctx, reviewer_id: reviewer.id)

      account = Repo.preload(reviewer, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, res} = query(conn, [:projects, :list_check_ins], %{project_id: project_id})
      assert assert_check_ins(res, check_ins)

      assert {200, res} = query(ctx.conn, [:projects, :list_check_ins], %{project_id: project_id})
      assert length(res.project_check_ins) == 0
    end

    test "drafts are visible only to their author", ctx do
      viewer = person_fixture_with_account(%{company_id: ctx.company.id})
      {project_id, [published_check_in | _]} = create_project_and_check_ins(ctx, company_access: Binding.view_access())
      draft = check_in_fixture(%{author_id: ctx.person.id, project_id: published_check_in.project_id, state: :draft})

      assert {200, res} = query(ctx.conn, [:projects, :list_check_ins], %{project_id: project_id})
      assert Enum.map(res.project_check_ins, & &1.id) |> Enum.member?(Paths.project_check_in_id(draft))

      viewer_conn = log_in_account(ctx.conn, Repo.preload(viewer, :account).account)
      assert {200, res} = query(viewer_conn, [:projects, :list_check_ins], %{project_id: project_id})
      refute Enum.map(res.project_check_ins, & &1.id) |> Enum.member?(Paths.project_check_in_id(draft))
    end

    test "authors can see their own drafts when normal project access hides the history", ctx do
      {project_id, [published_check_in | _]} = create_project_and_check_ins(ctx, [])
      draft = check_in_fixture(%{author_id: ctx.person.id, project_id: published_check_in.project_id, state: :draft})

      assert {200, res} = query(ctx.conn, [:projects, :list_check_ins], %{project_id: project_id})
      assert Enum.map(res.project_check_ins, & &1.id) == [Paths.project_check_in_id(draft)]
    end

    test "authors see their own drafts alongside published check-ins when they have view access", ctx do
      {project_id, [published_check_in | _]} = create_project_and_check_ins(ctx, company_access: Binding.view_access())
      draft = check_in_fixture(%{author_id: ctx.person.id, project_id: published_check_in.project_id, state: :draft})

      assert {200, res} = query(ctx.conn, [:projects, :list_check_ins], %{project_id: project_id})

      ids = Enum.map(res.project_check_ins, & &1.id)
      assert Paths.project_check_in_id(draft) in ids
      assert Paths.project_check_in_id(published_check_in) in ids
      assert length(ids) == 4
    end

    test "scheduled check-ins are visible only to their author", ctx do
      viewer = person_fixture_with_account(%{company_id: ctx.company.id})
      {project_id, [published_check_in | _]} = create_project_and_check_ins(ctx, company_access: Binding.view_access())

      scheduled =
        check_in_fixture(%{
          author_id: ctx.person.id,
          project_id: published_check_in.project_id,
          state: :scheduled,
          scheduled_at: Operately.Time.days_from_now(1)
        })

      assert {200, res} = query(ctx.conn, [:projects, :list_check_ins], %{project_id: project_id})
      assert Enum.map(res.project_check_ins, & &1.id) |> Enum.member?(Paths.project_check_in_id(scheduled))

      viewer_conn = log_in_account(ctx.conn, Repo.preload(viewer, :account).account)
      assert {200, res} = query(viewer_conn, [:projects, :list_check_ins], %{project_id: project_id})
      refute Enum.map(res.project_check_ins, & &1.id) |> Enum.member?(Paths.project_check_in_id(scheduled))
    end

    test "published check-ins are sorted by published_at desc", ctx do
      {project_id, [older_check_in, middle_check_in, newer_check_in]} =
        create_project_and_check_ins(ctx, company_access: Binding.view_access())

      older_published_at = Operately.Time.days_ago(5)
      middle_published_at = Operately.Time.days_ago(2)
      newer_published_at = Operately.Time.utc_datetime_now()
      old_inserted_at = NaiveDateTime.utc_now() |> NaiveDateTime.add(-10, :day) |> NaiveDateTime.truncate(:second)

      {:ok, older_check_in} =
        Ecto.Changeset.change(older_check_in, %{
          inserted_at: old_inserted_at,
          published_at: older_published_at
        })
        |> Repo.update()

      {:ok, middle_check_in} =
        Ecto.Changeset.change(middle_check_in, %{
          inserted_at: old_inserted_at,
          published_at: middle_published_at
        })
        |> Repo.update()

      {:ok, newer_check_in} =
        Ecto.Changeset.change(newer_check_in, %{
          inserted_at: old_inserted_at,
          published_at: newer_published_at
        })
        |> Repo.update()

      assert {200, res} = query(ctx.conn, [:projects, :list_check_ins], %{project_id: project_id})

      published_ids =
        res.project_check_ins
        |> Enum.reject(fn check_in -> check_in.state == "draft" end)
        |> Enum.map(& &1.id)

      assert published_ids == [
               Paths.project_check_in_id(newer_check_in),
               Paths.project_check_in_id(middle_check_in),
               Paths.project_check_in_id(older_check_in)
             ]
    end
  end

  #
  # Helpers
  #

  defp create_project_and_check_ins(ctx, opts) do
    project =
      project_fixture(%{
        company_id: ctx.company.id,
        group_id: ctx.space.id,
        creator_id: ctx.creator.id,
        champion_id: Keyword.get(opts, :champion_id, ctx.creator.id),
        reviewer_id: Keyword.get(opts, :reviewer_id, ctx.creator.id),
        company_access_level: Keyword.get(opts, :company_access, Binding.no_access()),
        space_access_level: Keyword.get(opts, :space_access, Binding.no_access())
      })

    check_ins =
      Enum.map(1..3, fn _ ->
        check_in_fixture(%{author_id: ctx.creator.id, project_id: project.id})
      end)

    {Paths.project_id(project), check_ins}
  end

  defp add_person_to_space(ctx) do
    {:ok, _} =
      Operately.Groups.add_members(ctx.creator, ctx.space.id, [
        %{
          id: ctx.person.id,
          access_level: Binding.edit_access()
        }
      ])
  end

  defp assert_check_ins(res, check_ins) do
    assert length(res.project_check_ins) == length(check_ins)

    Enum.each(check_ins, fn check_in ->
      assert Enum.find(res.project_check_ins, fn c ->
               c.id == Paths.project_check_in_id(check_in)
             end)
    end)
  end
end
