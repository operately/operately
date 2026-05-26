defmodule Operately.Billing.Polar.ProcessWebhookWorker do
  use Oban.Worker, queue: :default

  alias Operately.Billing.Polar.Operations.WebhookProcessing

  @impl Oban.Worker
  def perform(job) do
    WebhookProcessing.run(job.args["billing_webhook_event_id"])
  end
end
