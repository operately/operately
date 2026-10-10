defmodule Operately.Operations.CuratedTemplateUpdating do
  import Ecto.Query
  import Ecto.Changeset
  alias Operately.CuratedTemplates.Template
  alias Operately.Repo

  def run(template, account, expected_updated_at, action) do
    Ecto.Multi.new()
    |> Ecto.Multi.run(:locked, fn repo, _ ->
      case repo.one(from t in Template, where: t.id == ^template.id, lock: "FOR UPDATE") do
        nil -> {:error, :not_found}
        current -> if current.updated_at == expected_updated_at, do: {:ok, current}, else: {:error, :conflict}
      end
    end)
    |> Ecto.Multi.run(:template, fn repo, %{locked: current} -> apply_action(repo, current, account, action) end)
    |> Repo.transaction()
    |> case do
      {:ok, %{template: updated}} -> {:ok, updated}
      {:error, _, error, _} -> {:error, error}
    end
  end

  defp apply_action(repo, template, account, :publish) do
    if template.state == :draft do
      %{template | state: :published}
      |> Template.changeset(%{})
      |> force_change(:state, :published)
      |> put_change(:published_at, DateTime.utc_now())
      |> persist(repo, account)
    else
      {:error, :published}
    end
  end

  defp apply_action(repo, template, account, {:update, attrs}) do
    template |> Template.changeset(attrs) |> persist(repo, account)
  end

  defp apply_action(repo, template, account, {:metadata, attrs}) do
    template |> Template.changeset(Map.take(attrs, [:category])) |> persist(repo, account)
  end

  defp persist(cs, repo, account) do
    # Force a new timestamp even for identical submissions, so stale editors cannot overwrite a later action.
    now = DateTime.utc_now()
    timestamp = if DateTime.compare(now, cs.data.updated_at) == :gt, do: now, else: DateTime.add(cs.data.updated_at, 1, :microsecond)
    cs |> put_change(:updater_account_id, account.id) |> force_change(:updated_at, timestamp) |> repo.update()
  end
end
