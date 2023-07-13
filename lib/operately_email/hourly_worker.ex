defmodule OperatelyEmail.HourlyWorker do
  use Oban.Worker, queue: :mailer

  @impl Oban.Worker
  def perform(_) do
    IO.inspect "Hello from OperatelyEmail.HourlyWorker"

    :ok
  end
end
