defmodule Operately.Operations.PasswordChanging do
  import Ecto.Query
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Invitations.InvitationToken

  def run(attrs) do
    Multi.new()
    |> change_password(attrs)
    |> Repo.transaction()
  end

  defp change_password(multi, attrs) do
    hashed_token = InvitationToken.hash_token(attrs.token)

    query = from t in InvitationToken,
      where: t.hashed_token == ^hashed_token,
      join: inv in assoc(t, :invitation),
      join: member in assoc(inv, :member),
      join: account in assoc(member, :account),
      select: account

    account = Repo.one(query)
    changeset = Operately.People.Account.password_changeset(account, attrs)

    Multi.update(multi, :password, changeset)
  end
end
