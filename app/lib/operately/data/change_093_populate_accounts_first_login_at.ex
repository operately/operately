defmodule Operately.Data.Change093PopulateAccountsFirstLoginAt do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias __MODULE__.{Account, Person}

  def run do
    now = DateTime.utc_now() |> DateTime.truncate(:second)

    from(a in Account,
      join: p in Person, on: p.account_id == a.id,
      where: p.has_open_invitation == false,
      where: is_nil(a.first_login_at)
    )
    |> Repo.update_all(set: [first_login_at: now])
  end

  defmodule Account do
    use Operately.Schema

    schema "accounts" do
      field :first_login_at, :utc_datetime
    end
  end

  defmodule Person do
    use Operately.Schema

    schema "people" do
      field :account_id, :binary_id
      field :has_open_invitation, :boolean
    end
  end
end
