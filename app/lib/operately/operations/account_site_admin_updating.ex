defmodule Operately.Operations.AccountSiteAdminUpdating do
  import Ecto.Query

  alias Operately.People.Account
  alias Operately.Repo

  def promote(%Account{} = account) do
    with :ok <- ensure_not_deleted(account) do
      Account.promote_to_admin(account)
    end
  end

  def demote(%Account{} = account) do
    with :ok <- ensure_can_remove_site_admin(account) do
      Account.demote_from_admin(account)
    end
  end

  def ensure_can_remove_site_admin(%Account{} = account) do
    with :ok <- ensure_not_deleted(account),
         :ok <- ensure_not_last_site_admin(account) do
      :ok
    end
  end

  defp ensure_not_deleted(account) do
    if Account.deleted?(account), do: {:error, :not_found}, else: :ok
  end

  defp ensure_not_last_site_admin(%Account{site_admin: false}), do: :ok

  defp ensure_not_last_site_admin(%Account{} = account) do
    site_admin_count =
      Repo.aggregate(
        from(a in Account, where: a.site_admin == true and a.id != ^account.id),
        :count,
        :id
      )

    if site_admin_count == 0 do
      {:error, :last_site_admin}
    else
      :ok
    end
  end
end
