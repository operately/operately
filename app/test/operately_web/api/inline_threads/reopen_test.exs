defmodule OperatelyWeb.Api.InlineThreads.ReopenTest do
  use OperatelyWeb.TurboCase

  alias Operately.Access.Binding
  alias Operately.Support.Api.InlineThreads, as: Support

  setup ctx, do: Factory.setup(ctx)

  describe "security" do
    test "requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:inline_threads, :reopen], %{})
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

        ctx = Support.create(ctx)
        assert {200, _} = mutation(ctx.conn, [:inline_threads, :resolve], inputs(ctx))

        ctx = Factory.log_in_person(ctx, :person)
        assert {code, _} = mutation(ctx.conn, [:inline_threads, :reopen], inputs(ctx))
        assert code == @test.expected
      end
    end
  end

  describe "functionality" do
    setup ctx, do: ctx |> Support.add_document() |> Support.create()

    test "rejects deleted documents", ctx do
      ctx.document |> Ecto.Changeset.change(deleted_at: DateTime.utc_now()) |> Repo.update!()
      assert {404, _} = mutation(ctx.conn, [:inline_threads, :reopen], inputs(ctx))
    end

    test "read-only companies cannot mutate threads", ctx do
      Support.read_only(ctx)
      assert {403, _} = mutation(ctx.conn, [:inline_threads, :reopen], inputs(ctx))
    end

    test "commenters can reopen idempotently", ctx do
      assert {200, _} = mutation(ctx.conn, [:inline_threads, :resolve], inputs(ctx))
      ctx = Support.as_member(ctx, Operately.Access.Binding.comment_access())
      assert {200, %{thread: first}} = mutation(ctx.conn, [:inline_threads, :reopen], inputs(ctx))
      assert first.resolved_by == nil
      assert first.resolved_at == nil
      assert {200, %{thread: second}} = mutation(ctx.conn, [:inline_threads, :reopen], inputs(ctx))
      assert first == second
    end
  end

  defp inputs(ctx), do: %{thread_id: ctx.thread.id}
end
