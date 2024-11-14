defmodule Operately.Support.Factory.Messages do
  def add_message(ctx, testid, space_name, opts \\ []) do
    creator = Keyword.get(opts, :creator, ctx.creator)
    space = Map.fetch!(ctx, space_name)

    message = Operately.MessagesFixtures.message_fixture(
      creator.id, 
      space.id, 
      opts
    )

    Map.put(ctx, testid, message)
  end
end
