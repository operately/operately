defmodule OperatelyWeb.Api.Queries.ListProjectSubscribersCandidatesTest do
  use OperatelyWeb.TurboCase

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, :list_project_subscribers_candidates, %{})
    end
  end

  describe "permissions" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_company_member(:company_member)
      |> Factory.add_space(:space)
      |> Factory.add_space_member(:space_member, :space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_contributor(:developer, :project)
    end

    test "company members", ctx do
      ctx = log_in_account(ctx, ctx.company_member)

      ctx = Factory.edit_project_company_members_access(ctx, :project, :no_access)
      assert {404, _} = query(ctx.conn, :list_project_subscribers_candidates, %{project_id: Paths.project_id(ctx.project)})

      ctx = Factory.edit_project_company_members_access(ctx, :project, :view_access)
      assert {200, _} = query(ctx.conn, :list_project_subscribers_candidates, %{project_id: Paths.project_id(ctx.project)})

      ctx = Factory.edit_project_company_members_access(ctx, :project, :edit_access)
      assert {200, _} = query(ctx.conn, :list_project_subscribers_candidates, %{project_id: Paths.project_id(ctx.project)})

      ctx = Factory.edit_project_company_members_access(ctx, :project, :full_access)
      assert {200, _} = query(ctx.conn, :list_project_subscribers_candidates, %{project_id: Paths.project_id(ctx.project)})
    end

    test "space members", ctx do
      ctx = log_in_account(ctx, ctx.space_member)

      ctx = Factory.edit_project_company_members_access(ctx, :project, :no_access)

      ctx = Factory.edit_project_space_members_access(ctx, :project, :no_access)
      assert {404, _} = query(ctx.conn, :list_project_subscribers_candidates, %{project_id: Paths.project_id(ctx.project)})

      ctx = Factory.edit_project_space_members_access(ctx, :project, :view_access)
      assert {200, _} = query(ctx.conn, :list_project_subscribers_candidates, %{project_id: Paths.project_id(ctx.project)})

      ctx = Factory.edit_project_space_members_access(ctx, :project, :edit_access)
      assert {200, _} = query(ctx.conn, :list_project_subscribers_candidates, %{project_id: Paths.project_id(ctx.project)})

      ctx = Factory.edit_project_space_members_access(ctx, :project, :full_access)
      assert {200, _} = query(ctx.conn, :list_project_subscribers_candidates, %{project_id: Paths.project_id(ctx.project)})
    end

    test "project contributors", ctx do
      ctx = log_in_account(ctx, Operately.People.get_person!(ctx.developer.person_id))

      ctx = Factory.edit_project_company_members_access(ctx, :project, :no_access)
      ctx = Factory.edit_project_space_members_access(ctx, :project, :no_access)

      assert {200, _} = query(ctx.conn, :list_project_subscribers_candidates, %{project_id: Paths.project_id(ctx.project)})
    end
  end

  describe "list_project_subscribers_candidates functionality" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_contributor(:champion, :project, role: :champion)
      |> Factory.add_project_contributor(:reviewer, :project, role: :reviewer)
      |> Factory.add_project_contributor(:contrib1, :project)
      |> Factory.add_project_contributor(:contrib2, :project)
      |> Factory.add_project_contributor(:contrib3, :project)
      |> Factory.log_in_contributor(:champion)
    end

    test "lists subscribers candidates", ctx do
      assert {200, res} = query(ctx.conn, :list_project_subscribers_candidates, %{project_id: Paths.project_id(ctx.project)})

      [ctx.reviewer, ctx.champion]
      |> Enum.each(fn contrib ->
        candidate = Enum.find(res.candidates, &(equal_ids?(&1.person.id, contrib.person_id)))
        assert candidate.priority
      end)

      [ctx.contrib1, ctx.contrib2, ctx.contrib3]
      |> Enum.each(fn contrib ->
        candidate = Enum.find(res.candidates, &(equal_ids?(&1.person.id, contrib.person_id)))
        refute candidate.priority
      end)
    end
  end

  #
  # Helpers
  #

  def equal_ids?(short_id, id) do
    {:ok, decoded_id} = OperatelyWeb.Api.Helpers.decode_id(short_id)

    decoded_id == id
  end
end
