defmodule OperatelyEmail.Mailers.BaseMailer do
  def deliver_now(email) do
    Bamboo.Mailer.deliver_now(adapter(), email, config(), [])
  end

  defp adapter do
    cond do
      Application.get_env(:operately, :dev_routes) ->
        IO.inspect("sending to local")
        Bamboo.LocalAdapter
      Application.get_env(:operately, :test_routes) ->
        Bamboo.TestAdapter
      true ->
        Bamboo.SendGridAdapter
    end
  end

  defp config() do
    %{
      api_key: System.get_env("SENDGRID_API_KEY"),
    }
  end
end
