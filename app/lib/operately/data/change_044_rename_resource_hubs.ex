defmodule Operately.Data.Change044RenameResourceHubs do
  alias Operately.Repo
  alias Operately.ResourceHubs.ResourceHub

  def run do
    Repo.transaction(fn ->
      {_, nil} = Repo.update_all(ResourceHub, set: [
        name: "Documents & Files",
      ])
    end)
  end
end
