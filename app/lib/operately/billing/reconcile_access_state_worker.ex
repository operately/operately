defmodule Operately.Billing.ReconcileAccessStateWorker do
  use Oban.Worker, queue: :default

  alias Operately.Billing

  @impl Oban.Worker
  def perform(_job) do
    case Billing.promote_expired_access_states() do
      {:ok, _count} -> :ok
      {:error, changeset} -> {:error, inspect(changeset.errors)}
    end
  end
end
