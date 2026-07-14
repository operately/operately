defmodule Operately.Scheduling do
  @invalid_schedule_error :scheduled_at_must_be_in_the_future

  def validate_scheduled_at(nil), do: :ok

  def validate_scheduled_at(scheduled_at) do
    if DateTime.compare(scheduled_at, DateTime.utc_now()) == :gt do
      :ok
    else
      {:error, @invalid_schedule_error}
    end
  end
end
