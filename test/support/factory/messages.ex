defmodule Operately.Support.Factory.Messages do
  def add_messages_board(ctx, testid, space_name, opts \\ []) do
    board = Operately.MessagesFixtures.messages_board_fixture(ctx[space_name].id, opts)

    Map.put(ctx, testid, board)
  end

  def add_message(ctx, testid, board_name, opts \\ []) do
    creator = Keyword.get(opts, :creator, ctx.creator)
    board = Map.fetch!(ctx, board_name)

    message = Operately.MessagesFixtures.message_fixture(
      creator.id,
      board.id,
      opts
    )

    Map.put(ctx, testid, message)
  end

  def add_draft_message(ctx, testid, board_name, opts \\ []) do
    creator = Keyword.get(opts, :creator, ctx.creator)
    board = Map.fetch!(ctx, board_name)

    message = Operately.MessagesFixtures.message_fixture(
      creator.id,
      board.id,
      [state: :draft] ++ opts
    )

    Map.put(ctx, testid, message)
  end
end
