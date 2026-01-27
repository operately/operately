defmodule OperatelyEmail.Mailers.BaseMailer do
  alias OperatelyEmail.Mailers.Config.Db, as: DbConfig
  alias OperatelyEmail.Mailers.Config.Env, as: EnvConfig

  def deliver_now(email) do
    Operately.Mailer.deliver(email, config())
  end

  def email_delivery_configured? do
    case Application.get_env(:operately, :app_env) do
      :prod -> DbConfig.configured?() || EnvConfig.configured?()
      _ -> true
    end
  end

  defp config do
    case Application.get_env(:operately, :app_env) do
      :dev -> EnvConfig.dev_config()
      :test -> EnvConfig.test_config()
      :prod -> prod_config()
    end
  end

  defp prod_config do
    case DbConfig.config() do
      {:ok, config} -> config
      :not_configured -> EnvConfig.prod_config()
    end
  end
end
