defmodule Operately.Billing.Polar.ProcessWebhookWorker do
  use Oban.Worker, queue: :default

  @impl Oban.Worker
  def perform(_job) do
    :ok
  end
end
