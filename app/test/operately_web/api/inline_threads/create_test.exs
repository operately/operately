defmodule OperatelyWeb.Api.InlineThreads.CreateTest do
  use OperatelyWeb.TurboCase

  alias Operately.Access.Binding
  alias Operately.Support.Api.InlineThreads, as: Support

  setup ctx, do: Factory.setup(ctx)

  describe "security" do
    test "requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:inline_threads, :create], %{})
    end
  end

  describe "permissions" do
    setup ctx do
      Factory.add_company_member(ctx, :person)
    end

    @table [
      %{company: :no_access, space: :no_access, expected: 404},
      %{company: :no_access, space: :view_access, expected: 403},
      %{company: :no_access, space: :comment_access, expected: 200},
      %{company: :no_access, space: :edit_access, expected: 200},
      %{company: :no_access, space: :full_access, expected: 200},
      %{company: :view_access, space: :no_access, expected: 403},
      %{company: :comment_access, space: :no_access, expected: 200},
      %{company: :edit_access, space: :no_access, expected: 200},
      %{company: :full_access, space: :no_access, expected: 200}
    ]

    tabletest @table do
      test "if caller has levels company=#{@test.company} and space=#{@test.space}, then expect code=#{@test.expected}", ctx do
        ctx =
          ctx
          |> Support.add_document(company_permissions: Binding.from_atom(@test.company))
          |> Support.grant_space_access(:person, @test.space)

        ctx = Factory.log_in_person(ctx, :person)
        assert {code, _} = mutation(ctx.conn, [:inline_threads, :create], Support.inputs(ctx))
        assert code == @test.expected
      end
    end
  end

  describe "functionality" do
    setup ctx, do: ctx |> Support.add_document()

    test "creates a thread and first message without changing document history", ctx do
      before = Repo.reload!(ctx.document)
      activities = Repo.aggregate(Operately.Activities.Activity, :count)
      assert {200, %{thread: thread}} = mutation(ctx.conn, [:inline_threads, :create], Support.inputs(ctx))
      assert thread.anchor.source_from == 1
      assert thread.anchor.quote == "Hello"
      assert length(thread.messages) == 1
      assert thread.resolved_at == nil
      assert Repo.reload!(ctx.document) == before
      assert Repo.aggregate(Operately.Activities.Activity, :count) == activities + 1
    end

    test "rejects stale versions without inserting a thread", ctx do
      assert {400, response} = mutation(ctx.conn, [:inline_threads, :create], %{Support.inputs(ctx) | source_version: 999})
      assert inspect(response) =~ "version_conflict"
      assert Repo.aggregate(Operately.Comments.InlineThread, :count) == 0
    end

    test "rejects incorrect quotes", ctx do
      assert {400, _} = mutation(ctx.conn, [:inline_threads, :create], %{Support.inputs(ctx) | quote: "Wrong"})
      assert Repo.aggregate(Operately.Comments.InlineThread, :count) == 0
    end

    test "rejects unpublished and deleted documents", ctx do
      ctx.document |> Ecto.Changeset.change(state: :draft) |> Repo.update!()
      assert {404, _} = mutation(ctx.conn, [:inline_threads, :create], Support.inputs(ctx))
      ctx.document |> Ecto.Changeset.change(deleted_at: DateTime.utc_now()) |> Repo.update!()
      assert {404, _} = mutation(ctx.conn, [:inline_threads, :create], Support.inputs(ctx))
    end

    test "revoked access prevents creating threads", ctx do
      ctx = Support.as_member(ctx, Binding.comment_access())
      assert {200, _} = mutation(ctx.conn, [:inline_threads, :create], Support.inputs(ctx))
      context = Operately.Access.get_context!(group_id: ctx.space.id)
      Operately.Access.unbind_person(context, ctx.member.id)
      assert {404, _} = mutation(ctx.conn, [:inline_threads, :create], Support.inputs(ctx))
    end

    test "read-only companies cannot create threads", ctx do
      Support.read_only(ctx)
      assert {403, _} = mutation(ctx.conn, [:inline_threads, :create], Support.inputs(ctx))
    end

    test "invalid message rolls back the thread", ctx do
      assert {400, _} = mutation(ctx.conn, [:inline_threads, :create], %{Support.inputs(ctx) | content: "{}"})
      assert Repo.aggregate(Operately.Comments.InlineThread, :count) == 0
    end

    test "supports project and goal document access paths", ctx do
      ctx = ctx |> Factory.add_project(:project, :space) |> Factory.add_goal(:goal, :space)

      for parent <- [:project, :goal] do
        scope = ctx |> Factory.add_resource_hub(:nested_hub, parent, :creator) |> Factory.add_document(:document, :nested_hub, content: Operately.Support.RichText.rich_text("Hello world"))
        assert {200, %{thread: thread}} = mutation(scope.conn, [:inline_threads, :create], Support.inputs(scope))
        assert {200, %{threads: [listed]}} = query(scope.conn, [:inline_threads, :list], Map.take(Support.inputs(scope), [:resource_type, :resource_id]))
        assert listed.id == thread.id
      end
    end

    test "a different company cannot access the document", ctx do
      other = Support.setup(%{conn: Phoenix.ConnTest.build_conn()})
      assert {404, _} = mutation(other.conn, [:inline_threads, :create], Support.inputs(ctx))
    end
  end
end
