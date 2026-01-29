defmodule OperatelyEE.AdminApi.Mutations.SendTestEmail do
  use TurboConnect.Mutation

  alias OperatelyEmail.Mailers.Config.Db, as: DbConfig

  inputs do
    field :recipient, :string
    field :subject, :string
    field :body, :string
  end

  outputs do
    field :success, :boolean
    field? :error, :string
  end

  def call(_conn, inputs) do
    case DbConfig.config() do
      {:ok, config} -> deliver(config, inputs)
      :not_configured -> {:ok, %{success: false, error: "Email settings are not configured"}}
    end
  rescue
    e -> {:ok, %{success: false, error: Exception.message(e)}}
  end

  defp deliver(config, inputs) do
    from_email = OperatelyEmail.notification_email_address()

    if is_nil(from_email) or String.trim(from_email) == "" do
      {:ok, %{success: false, error: "Notification email address is not configured"}}
    else
      email =
        Swoosh.Email.new()
        |> Swoosh.Email.to(inputs.recipient)
        |> Swoosh.Email.from({"Operately", from_email})
        |> Swoosh.Email.subject(inputs.subject)
        |> Swoosh.Email.text_body(inputs.body)

      case Operately.Mailer.deliver(email, config) do
        {:ok, _} -> {:ok, %{success: true}}
        {:error, reason} -> {:ok, %{success: false, error: format_error(reason)}}
      end
    end
  end

  defp format_error(%{message: message}) when is_binary(message), do: message
  defp format_error(reason) when is_binary(reason), do: reason
  defp format_error(reason), do: inspect(reason)
end
