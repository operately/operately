defmodule OperatelyWeb.Api.InlineThreads.ListTest do
  use OperatelyWeb.TurboCase

  alias Operately.Access.Binding
  alias Operately.Support.Api.InlineThreads, as: Support
  alias Operately.Support.RichText

  setup ctx, do: Factory.setup(ctx)

  describe "security" do
    test "requires authentication", ctx do
      assert {401, _} = query(ctx.conn, [:inline_threads, :list], %{})
    end
  end

  describe "permissions" do
    setup ctx do
      Factory.add_company_member(ctx, :person)
    end

    @table [
      %{company: :no_access, space: :no_access, expected: 404},
      %{company: :no_access, space: :view_access, expected: 200},
      %{company: :no_access, space: :comment_access, expected: 200},
      %{company: :no_access, space: :edit_access, expected: 200},
      %{company: :no_access, space: :full_access, expected: 200},
      %{company: :view_access, space: :no_access, expected: 200},
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
        assert {code, _} = query(ctx.conn, [:inline_threads, :list], inputs(ctx))
        assert code == @test.expected
      end
    end
  end

  describe "functionality" do
    setup ctx, do: ctx |> Support.add_document() |> Support.create()

    test "rejects deleted documents", ctx do
      ctx.document |> Ecto.Changeset.change(deleted_at: DateTime.utc_now()) |> Repo.update!()
      assert {404, _} = query(ctx.conn, [:inline_threads, :list], inputs(ctx))
    end

    test "viewers can list threads in read-only companies", ctx do
      ctx = Support.as_member(ctx, Operately.Access.Binding.view_access()) |> Support.read_only()
      assert {200, %{threads: [thread]}} = query(ctx.conn, [:inline_threads, :list], inputs(ctx))
      assert thread.id == ctx.thread.id
    end

    test "outdated anchors are unattached without changing their source", ctx do
      ctx.document |> Ecto.Changeset.change(current_version: ctx.document.current_version + 1) |> Repo.update!()
      assert {200, %{threads: [thread]}} = query(ctx.conn, [:inline_threads, :list], inputs(ctx))
      assert thread.anchor.status == "unattached"
      assert thread.anchor.current_from == nil
      assert thread.anchor.current_to == nil
      assert thread.anchor.source_from == 1
      assert thread.anchor.quote == "Hello"
    end

    test "includes resolved threads and excludes whole-document comments", ctx do
      assert {200, _} = mutation(ctx.conn, [:inline_threads, :resolve], %{thread_id: ctx.thread.id})
      assert {200, _} = mutation(ctx.conn, [:comments, :create], %{entity_id: ctx.document.id, entity_type: "resource_hub_document", content: Jason.encode!(RichText.rich_text("General"))})
      assert {200, %{threads: [thread]}} = query(ctx.conn, [:inline_threads, :list], inputs(ctx))
      assert thread.resolved_at != nil
      assert length(thread.messages) == 1
      assert {200, %{comments: [comment]}} = query(ctx.conn, [:comments, :list], %{entity_id: ctx.document.id, entity_type: "resource_hub_document"})
      refute comment.id == hd(thread.messages).id
    end

    test "inline endpoints are internal only" do
      refute Map.has_key?(OperatelyWeb.Api.External.__queries__(), "inline_threads/list")

      for action <- ~w(create reply update_message delete_message resolve reopen) do
        refute Map.has_key?(OperatelyWeb.Api.External.__mutations__(), "inline_threads/" <> action)
      end
    end
  end

  defp inputs(ctx), do: Map.take(Support.inputs(ctx), [:resource_type, :resource_id])
end
