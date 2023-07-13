defmodule OperatelyEmail.Mailer do
  def deliver_now(email) do
    Bamboo.Mailer.deliver_now(adapter(), email, config(), [])
  end

  defp adapter do
    Bamboo.SendGridAdapter
  end

  defp config() do
    %{
      api_key: System.get_env("SENDGRID_API_KEY"),
    }
  end
end
