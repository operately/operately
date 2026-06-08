defmodule Operately.Data.Change044RenameResourceHubs do
  alias Operately.Repo
  alias __MODULE__.ResourceHub

  def run do
    Repo.transaction(fn ->
      {_, nil} = Repo.update_all(ResourceHub, set: [
        name: "Documents & Files",
      ])
    end)
  end

  defmodule ResourceHub do
    use Operately.Schema

    schema "resource_hubs" do
      field :name, :string
    end
  end
end
