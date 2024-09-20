defmodule Operately.Support.Factory.Messages do
  def add_message(ctx, testid, space_name, opts \\ []) do
    creator = Keyword.get(opts, :creator, ctx.creator)

    message = Operately.MessagesFixtures.message_fixture(creator.id, ctx[space_name].id, opts)

    Map.put(ctx, testid, message)
  end
end
