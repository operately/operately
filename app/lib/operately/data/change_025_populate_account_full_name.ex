defmodule Operately.Data.Change025PopulateAccountFullName do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.People.Account

  def run do
    Repo.transaction(fn ->
      from(a in Account, where: is_nil(a.full_name), preload: :people)
      |> Repo.all()
      |> populate_full_name()
    end)
  end

  defp populate_full_name(accounts) do
    Enum.each(accounts, fn a ->
      if length(a.people) > 0 do
        name = hd(a.people).full_name
        Operately.Repo.update(Ecto.Changeset.change(a, full_name: name))
      end
    end)
  end
end
