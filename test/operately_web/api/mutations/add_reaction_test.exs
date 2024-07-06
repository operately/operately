defmodule OperatelyWeb.Api.Mutations.AddReactionTest do
  use OperatelyWeb.TurboCase

  import Operately.UpdatesFixtures
  alias Operately.Support.RichText

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :add_reaction, %{})
    end
  end

  describe "mark_all_as_read functionality" do
    setup :register_and_log_in_account

    test "add reaction to a discussion", ctx do
      discussion = create_discussion(ctx)

      assert {200, res} = mutation(ctx.conn, :add_reaction, %{
        entity_id: Paths.discussion_id(discussion),
        entity_type: "update",
        emoji: "👍"
      })

      reaction = hd(Operately.Updates.list_reactions(discussion.id, :update))
      assert reaction.emoji == "👍"
      assert res.reaction == Serializer.serialize(reaction, level: :essential)
    end
  end

  def create_discussion(ctx, title \\ "Hello World", body \\ "How are you doing?") do
    update_fixture(%{
      author_id: ctx.person.id,
      updatable_id: ctx.company.company_space_id,
      updatable_type: :space,
      type: :project_discussion,
      content: %{
        title: title,
        body: RichText.rich_text(body)
      }
    })
  end
end 
