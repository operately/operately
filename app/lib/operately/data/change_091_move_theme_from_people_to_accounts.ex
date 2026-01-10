defmodule Operately.Data.Change091MoveThemeFromPeopleToAccounts do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias __MODULE__.{Account, Person}

  def run do
    Repo.transaction(fn ->
      from(p in Person,
        where: not is_nil(p.theme),
        order_by: [p.account_id, desc: p.updated_at],
        distinct: p.account_id
      )
      |> Repo.all()
      |> Enum.each(fn person ->
        from(a in Account, where: a.id == ^person.account_id)
        |> Repo.update_all(set: [theme: person.theme])
      end)
    end)
  end

  defmodule Account do
    use Operately.Schema

    schema "accounts" do
      field :theme, :string
    end
  end

  defmodule Person do
    use Operately.Schema

    schema "people" do
      field :account_id, :binary_id
      field :theme, :string
      timestamps()
    end
  end
end
