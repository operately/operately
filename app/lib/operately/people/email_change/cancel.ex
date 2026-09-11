defmodule Operately.People.EmailChange.Cancel do
  alias Operately.People.EmailChange.Shared
  alias Operately.Repo

  def run(account, request_id) do
    Shared.with_account_lock(account, fn account ->
      with {:ok, request} <- Shared.find_pending(account, request_id) do
        request |> Ecto.Changeset.change(invalidated_at: Shared.now()) |> Repo.update!()
        :ok
      end
    end)
  end
end
