defmodule OperatelyWeb.Api.InlineThreads.ReplyTest do
  use OperatelyWeb.TurboCase

  alias Operately.Access.Binding
  alias Operately.Support.Api.InlineThreads, as: Support
  alias Operately.Support.RichText

  setup ctx, do: Factory.setup(ctx)

  describe "security" do
    test "requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:inline_threads, :reply], %{})
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

        ctx = Factory.log_in_person(ctx, :person)
        assert {code, _} = mutation(ctx.conn, [:inline_threads, :reply], inputs(ctx))
        assert code == @test.expected
      end
    end
  end

  describe "functionality" do
    setup ctx, do: ctx |> Support.add_document() |> Support.create()

    test "rejects deleted documents", ctx do
      ctx.document |> Ecto.Changeset.change(deleted_at: DateTime.utc_now()) |> Repo.update!()
      assert {404, _} = mutation(ctx.conn, [:inline_threads, :reply], inputs(ctx))
    end

    test "read-only companies cannot mutate threads", ctx do
      Support.read_only(ctx)
      assert {403, _} = mutation(ctx.conn, [:inline_threads, :reply], inputs(ctx))
    end

    test "commenters must reopen resolved threads before replying", ctx do
      assert {200, _} = mutation(ctx.conn, [:inline_threads, :resolve], %{thread_id: ctx.thread.id})
      ctx = Support.as_member(ctx, Operately.Access.Binding.comment_access())
      assert {400, _} = mutation(ctx.conn, [:inline_threads, :reply], inputs(ctx))
      assert Repo.aggregate(Operately.Updates.Comment, :count) == 1

      assert {200, _} = mutation(ctx.conn, [:inline_threads, :reopen], %{thread_id: ctx.thread.id})
      assert {200, %{thread: thread}} = mutation(ctx.conn, [:inline_threads, :reply], inputs(ctx))
      assert thread.resolved_at == nil
      assert length(thread.messages) == 2
      assert Enum.any?(thread.messages, &(&1.author.id == Paths.person_id(ctx.member)))
    end

    test "invalid content does not insert a reply", ctx do
      assert {400, _} = mutation(ctx.conn, [:inline_threads, :reply], %{inputs(ctx) | content: "{}"})
      assert Repo.aggregate(Operately.Updates.Comment, :count) == 1
    end
  end

  defp inputs(ctx), do: %{thread_id: ctx.thread.id, content: Jason.encode!(RichText.rich_text("Reply"))}
end
