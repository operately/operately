defmodule OperatelyWeb.Api.InlineThreads.UpdateMessageTest do
  use OperatelyWeb.TurboCase

  alias Operately.Access.Binding
  alias Operately.Support.Api.InlineThreads, as: Support
  alias Operately.Support.RichText

  setup ctx, do: Factory.setup(ctx)

  describe "security" do
    test "requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:inline_threads, :update_message], %{})
    end
  end

  describe "permissions" do
    setup ctx do
      Factory.add_company_member(ctx, :person)
    end

    @table [
      %{company: :no_access, space: :no_access, author: :person, expected: 404},
      %{company: :no_access, space: :view_access, author: :person, expected: 403},
      %{company: :no_access, space: :comment_access, author: :person, expected: 200},
      %{company: :no_access, space: :edit_access, author: :person, expected: 200},
      %{company: :no_access, space: :full_access, author: :person, expected: 200},
      %{company: :view_access, space: :no_access, author: :person, expected: 403},
      %{company: :comment_access, space: :no_access, author: :person, expected: 200},
      %{company: :edit_access, space: :no_access, author: :person, expected: 200},
      %{company: :full_access, space: :no_access, author: :person, expected: 200},
      %{company: :no_access, space: :no_access, author: :creator, expected: 404},
      %{company: :no_access, space: :view_access, author: :creator, expected: 403},
      %{company: :no_access, space: :comment_access, author: :creator, expected: 403},
      %{company: :no_access, space: :edit_access, author: :creator, expected: 403},
      %{company: :no_access, space: :full_access, author: :creator, expected: 403},
      %{company: :view_access, space: :no_access, author: :creator, expected: 403},
      %{company: :comment_access, space: :no_access, author: :creator, expected: 403},
      %{company: :edit_access, space: :no_access, author: :creator, expected: 403},
      %{company: :full_access, space: :no_access, author: :creator, expected: 403}
    ]

    tabletest @table do
      test "if caller has levels company=#{@test.company} and space=#{@test.space}, author=#{@test.author}, then expect code=#{@test.expected}", ctx do
        ctx =
          ctx
          |> Support.add_document(company_permissions: Binding.from_atom(@test.company))
          |> Support.grant_space_access(:person, @test.space)

        ctx = Support.create(ctx)
        message_id = Operately.ShortUuid.decode!(hd(ctx.thread.messages).id)
        message = Repo.get!(Operately.Updates.Comment, message_id)
        message |> Ecto.Changeset.change(author_id: ctx[@test.author].id) |> Repo.update!()

        ctx = Factory.log_in_person(ctx, :person)
        assert {code, _} = mutation(ctx.conn, [:inline_threads, :update_message], inputs(ctx))
        assert code == @test.expected
      end
    end
  end

  describe "functionality" do
    setup ctx, do: ctx |> Support.add_document() |> Support.create()

    test "rejects other comment types even when the entity ID matches a thread", ctx do
      comment =
        Operately.Updates.Comment.changeset(%{
          entity_id: Operately.ShortUuid.decode!(ctx.thread.id),
          entity_type: :resource_hub_document,
          author_id: ctx.creator.id,
          content: Operately.Support.RichText.rich_text("General comment")
        })
        |> Repo.insert!()

      assert {404, _} = mutation(ctx.conn, [:inline_threads, :update_message], %{inputs(ctx) | message_id: Paths.comment_id(comment)})
      assert Repo.reload!(comment) == comment
    end

    test "rejects messages on unpublished documents", ctx do
      ctx.document |> Ecto.Changeset.change(state: :draft) |> Repo.update!()
      assert {404, _} = mutation(ctx.conn, [:inline_threads, :update_message], inputs(ctx))
    end

    test "denies people in another company", ctx do
      other = Support.setup(%{conn: Phoenix.ConnTest.build_conn()})
      assert {404, _} = mutation(other.conn, [:inline_threads, :update_message], inputs(ctx))
    end

    test "inherits project and goal document access", ctx do
      ctx = ctx |> Factory.add_project(:project, :space) |> Factory.add_goal(:goal, :space)

      for parent <- [:project, :goal] do
        scope =
          ctx
          |> Factory.add_resource_hub(:nested_hub, parent, :creator)
          |> Factory.add_document(:document, :nested_hub, content: Operately.Support.RichText.rich_text("Hello world"))
          |> Support.create()

        assert {200, _} = mutation(scope.conn, [:inline_threads, :update_message], inputs(scope))
      end
    end

    test "rejects deleted documents", ctx do
      ctx.document |> Ecto.Changeset.change(deleted_at: DateTime.utc_now()) |> Repo.update!()
      assert {404, _} = mutation(ctx.conn, [:inline_threads, :update_message], inputs(ctx))
    end

    test "read-only companies cannot mutate threads", ctx do
      Support.read_only(ctx)
      assert {403, _} = mutation(ctx.conn, [:inline_threads, :update_message], inputs(ctx))
    end

    test "authors can edit their message", ctx do
      assert {200, %{thread: thread}} = mutation(ctx.conn, [:inline_threads, :update_message], inputs(ctx))
      assert Jason.decode!(hd(thread.messages).content) == RichText.rich_text("Edited")
      assert hd(thread.messages).id == hd(ctx.thread.messages).id
    end

    test "authors must reopen resolved threads before editing messages", ctx do
      assert {200, _} = mutation(ctx.conn, [:inline_threads, :resolve], %{thread_id: ctx.thread.id})
      assert {400, _} = mutation(ctx.conn, [:inline_threads, :update_message], inputs(ctx))
      message = Repo.get!(Operately.Updates.Comment, Operately.ShortUuid.decode!(hd(ctx.thread.messages).id))
      assert message.content == Jason.decode!(hd(ctx.thread.messages).content)

      assert {200, _} = mutation(ctx.conn, [:inline_threads, :reopen], %{thread_id: ctx.thread.id})
      assert {200, %{thread: thread}} = mutation(ctx.conn, [:inline_threads, :update_message], inputs(ctx))
      assert Jason.decode!(hd(thread.messages).content) == RichText.rich_text("Edited")
    end
  end

  defp inputs(ctx), do: %{message_id: hd(ctx.thread.messages).id, content: Jason.encode!(RichText.rich_text("Edited"))}
end
