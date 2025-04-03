defmodule Operately.Data.Change005UpdateReactions do
  import Ecto.Query
  import Ecto.Changeset, only: [change: 2]
  alias Operately.Repo
  alias Operately.Updates.Reaction

  def run do
    reactions = Repo.all(from r in Reaction, where: is_nil(r.emoji))
    IO.puts("Updating #{length(reactions)} reactions")

    Enum.each(reactions, fn reaction ->
      update_reaction(reaction)
    end)
  end

  def update_reaction(reaction) do
    emoji = find_emoji(reaction.reaction_type)

    Repo.update(change(reaction, emoji: emoji))
  end

  def find_emoji(reaction_type) do
    case reaction_type do
      :thumbs_up -> "👍"
      :thumbs_down -> "👎"
      :heart -> "❤️"
      :rocket -> "🚀"
      _ -> "👍"
    end
  end
end
