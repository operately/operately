defmodule OperatelyWeb.Api.Mutations.RemoveReactionTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.MessagesFixtures

  alias Operately.Updates

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :remove_reaction, %{})
    end
  end

  describe "remove_reaction functionality" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_company_owner(:owner)
      |> Factory.add_space(:product_space)
      |> Factory.add_messages_board(:messages_board, :product_space)
      |> Factory.add_message(:hello_message, :messages_board)
      |> Factory.log_in_person(:owner)
    end

    test "removes user's own reaction from a message", ctx do
      # First add a reaction
      assert {200, _} =
               mutation(ctx.conn, :add_reaction, %{
                 entity_id: Paths.message_id(ctx.hello_message),
                 entity_type: "message",
                 emoji: "👍"
               })

      # Verify the reaction exists
      reactions = Updates.list_reactions(ctx.hello_message.id, :message)
      assert length(reactions) == 1
      reaction = hd(reactions)
      assert reaction.person_id == ctx.owner.id
      assert reaction.emoji == "👍"

      # Remove the reaction
      assert {200, res} =
               mutation(ctx.conn, :remove_reaction, %{
                 entity_id: Paths.message_id(ctx.hello_message),
                 entity_type: "message",
                 emoji: "👍"
               })

      assert res.success == true

      # Verify the reaction is removed
      reactions_after = Updates.list_reactions(ctx.hello_message.id, :message)
      assert length(reactions_after) == 0
    end

    test "returns error when trying to remove non-existent reaction", ctx do
      # Try to remove a reaction that doesn't exist
      assert {500, _} =
               mutation(ctx.conn, :remove_reaction, %{
                 entity_id: Paths.message_id(ctx.hello_message),
                 entity_type: "message",
                 emoji: "👍"
               })
    end

    test "does not remove other user's reactions", ctx do
      # Create another user
      other_user = person_fixture(%{company_id: ctx.company.id})

      # Other user adds a reaction (we'll simulate this by creating it directly)
      {:ok, _} = Updates.create_reaction(%{
        person_id: other_user.id,
        entity_id: ctx.hello_message.id,
        entity_type: :message,
        emoji: "👍"
      })

      # Current user tries to remove the other user's reaction
      assert {500, _} =
               mutation(ctx.conn, :remove_reaction, %{
                 entity_id: Paths.message_id(ctx.hello_message),
                 entity_type: "message",
                 emoji: "👍"
               })

      # Verify the other user's reaction is still there
      reactions = Updates.list_reactions(ctx.hello_message.id, :message)
      assert length(reactions) == 1
    end

    test "only removes the specific emoji reaction", ctx do
      # Add multiple reactions with different emojis
      assert {200, _} =
               mutation(ctx.conn, :add_reaction, %{
                 entity_id: Paths.message_id(ctx.hello_message),
                 entity_type: "message",
                 emoji: "👍"
               })

      assert {200, _} =
               mutation(ctx.conn, :add_reaction, %{
                 entity_id: Paths.message_id(ctx.hello_message),
                 entity_type: "message",
                 emoji: "❤️"
               })

      # Verify both reactions exist
      reactions = Updates.list_reactions(ctx.hello_message.id, :message)
      assert length(reactions) == 2

      # Remove only the thumbs up reaction
      assert {200, res} =
               mutation(ctx.conn, :remove_reaction, %{
                 entity_id: Paths.message_id(ctx.hello_message),
                 entity_type: "message",
                 emoji: "👍"
               })

      assert res.success == true

      # Verify only the heart reaction remains
      reactions_after = Updates.list_reactions(ctx.hello_message.id, :message)
      assert length(reactions_after) == 1
      remaining_reaction = hd(reactions_after)
      assert remaining_reaction.emoji == "❤️"
    end
  end
end