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
      assert {200, add_res} =
               mutation(ctx.conn, :add_reaction, %{
                 entity_id: Paths.message_id(ctx.hello_message),
                 entity_type: "message",
                 emoji: "👍"
               })

      reaction_id = add_res.reaction.id

      # Verify the reaction exists
      reactions = Updates.list_reactions(ctx.hello_message.id, :message)
      assert length(reactions) == 1
      reaction = hd(reactions)
      assert reaction.person_id == ctx.owner.id
      assert reaction.emoji == "👍"

      # Remove the reaction using its ID
      assert {200, res} =
               mutation(ctx.conn, :remove_reaction, %{
                 reaction_id: reaction_id
               })

      assert res.success == true

      # Verify the reaction is removed
      reactions_after = Updates.list_reactions(ctx.hello_message.id, :message)
      assert length(reactions_after) == 0
    end

    test "returns error when trying to remove non-existent reaction", ctx do
      # Try to remove a reaction that doesn't exist
      fake_id = Ecto.UUID.generate()

      assert {500, _} =
               mutation(ctx.conn, :remove_reaction, %{
                 reaction_id: fake_id
               })
    end

    test "does not remove other user's reactions", ctx do
      # Create another user
      other_user = person_fixture(%{company_id: ctx.company.id})

      # Other user adds a reaction (we'll simulate this by creating it directly)
      {:ok, reaction} = Updates.create_reaction(%{
        person_id: other_user.id,
        entity_id: ctx.hello_message.id,
        entity_type: :message,
        emoji: "👍"
      })

      # Current user tries to remove the other user's reaction
      assert {500, _} =
               mutation(ctx.conn, :remove_reaction, %{
                 reaction_id: reaction.id
               })

      # Verify the other user's reaction is still there
      reactions = Updates.list_reactions(ctx.hello_message.id, :message)
      assert length(reactions) == 1
    end

    test "only removes the specific reaction by ID", ctx do
      # Add multiple reactions with different emojis
      assert {200, add_res1} =
               mutation(ctx.conn, :add_reaction, %{
                 entity_id: Paths.message_id(ctx.hello_message),
                 entity_type: "message",
                 emoji: "👍"
               })

      assert {200, add_res2} =
               mutation(ctx.conn, :add_reaction, %{
                 entity_id: Paths.message_id(ctx.hello_message),
                 entity_type: "message",
                 emoji: "❤️"
               })

      thumbs_up_id = add_res1.reaction.id
      heart_id = add_res2.reaction.id

      # Verify both reactions exist
      reactions = Updates.list_reactions(ctx.hello_message.id, :message)
      assert length(reactions) == 2

      # Remove only the thumbs up reaction by its specific ID
      assert {200, res} =
               mutation(ctx.conn, :remove_reaction, %{
                 reaction_id: thumbs_up_id
               })

      assert res.success == true

      # Verify only the heart reaction remains
      reactions_after = Updates.list_reactions(ctx.hello_message.id, :message)
      assert length(reactions_after) == 1
      remaining_reaction = hd(reactions_after)
      assert remaining_reaction.emoji == "❤️"
      assert remaining_reaction.id == heart_id
    end

    test "handles multiple identical reactions - removes specific one by ID", ctx do
      # Add the same reaction multiple times directly (simulating the bug scenario)
      {:ok, reaction1} = Updates.create_reaction(%{
        person_id: ctx.owner.id,
        entity_id: ctx.hello_message.id,
        entity_type: :message,
        emoji: "😮"
      })

      {:ok, reaction2} = Updates.create_reaction(%{
        person_id: ctx.owner.id,
        entity_id: ctx.hello_message.id,
        entity_type: :message,
        emoji: "😮"
      })

      # Verify both identical reactions exist
      reactions = Updates.list_reactions(ctx.hello_message.id, :message)
      assert length(reactions) == 2
      assert Enum.all?(reactions, fn r -> r.emoji == "😮" and r.person_id == ctx.owner.id end)

      # Remove the first reaction specifically by its ID
      assert {200, res} =
               mutation(ctx.conn, :remove_reaction, %{
                 reaction_id: reaction1.id
               })

      assert res.success == true

      # Verify only the second reaction remains
      reactions_after = Updates.list_reactions(ctx.hello_message.id, :message)
      assert length(reactions_after) == 1
      remaining_reaction = hd(reactions_after)
      assert remaining_reaction.emoji == "😮"
      assert remaining_reaction.person_id == ctx.owner.id
      assert remaining_reaction.id == reaction2.id

      # Verify the specific reaction was removed
      assert remaining_reaction.id != reaction1.id
    end

    test "preserves insertion order when removing specific reactions", ctx do
      # Add reactions in a specific order
      {:ok, reaction1} = Updates.create_reaction(%{
        person_id: ctx.owner.id,
        entity_id: ctx.hello_message.id,
        entity_type: :message,
        emoji: "👍"
      })

      {:ok, reaction2} = Updates.create_reaction(%{
        person_id: ctx.owner.id,
        entity_id: ctx.hello_message.id,
        entity_type: :message,
        emoji: "👍"  # Same emoji
      })

      {:ok, reaction3} = Updates.create_reaction(%{
        person_id: ctx.owner.id,
        entity_id: ctx.hello_message.id,
        entity_type: :message,
        emoji: "❤️"
      })

      # Remove the middle reaction (reaction2)
      assert {200, res} =
               mutation(ctx.conn, :remove_reaction, %{
                 reaction_id: reaction2.id
               })

      assert res.success == true

      # Verify correct reactions remain in correct order
      reactions_after = Updates.list_reactions(ctx.hello_message.id, :message)
      assert length(reactions_after) == 2

      [first_remaining, second_remaining] = reactions_after
      assert first_remaining.id == reaction1.id
      assert second_remaining.id == reaction3.id
    end
  end
end