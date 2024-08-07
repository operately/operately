defmodule Operately.Data.Change026AddPlaceholderToGoalCheckInsTagetUpdate do
  import Ecto.Query, only: [from: 2]

  alias Operately.{Repo, Updates}
  alias Operately.Updates.Update

  def run do
    Repo.transaction(fn ->
      from(u in Update, where: u.type == :goal_check_in)
      |> Repo.all()
      |> add_placeholder()
    end)
  end

  defp add_placeholder(check_ins) when is_list(check_ins) do
    Enum.each(check_ins, fn c ->
      add_placeholder(c)
    end)
  end

  defp add_placeholder(check_in) do
    unless Map.has_key?(check_in.content, "targets") do
      content = Map.put_new(check_in.content, "targets", [])
      Updates.update_update(check_in, %{content: content})
    end
  end
end
