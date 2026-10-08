defmodule Operately.People.EmailActivationCode do
  use Operately.Schema
  use Operately.Repo.Getter

  alias Operately.Operations.EmailActivationCodeConsuming
  alias OperatelyEmail.Mailers.BaseMailer

  schema "email_activation_codes" do
    field :email, :string
    field :code, :string
    field :expires_at, :utc_datetime

    # Captured by OperatelyWeb.Analytics.context/1 from the browser's shared analytics cookie and privacy signals.
    # Preserves visitor identity, attribution, and preferences through email verification to signup.
    field :analytics_context, :map, default: %{}

    request_info()
    timestamps()
  end

  def create(email, analytics_context \\ %{}) do
    with(
      {:ok, :configured} <- ensure_email_delivery_configured(),
      {:ok, code} <- create_unique_code(email, analytics_context, attempts_left: 10),
      {:ok, _} <- OperatelyEmail.Emails.EmailActivationCodeEmail.send(code)
    ) do
      {:ok, code}
    end
  end

  def consume(email, code), do: EmailActivationCodeConsuming.run(email, code)

  defp changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  defp ensure_email_delivery_configured do
    if BaseMailer.email_delivery_configured?() do
      {:ok, :configured}
    else
      {:error, :email_delivery_not_configured}
    end
  end

  defp changeset(email_activation_code, attrs) do
    email_activation_code
    |> cast(attrs, [:email, :code, :expires_at, :analytics_context])
    |> validate_required([:email, :code, :expires_at, :analytics_context])
    |> validate_length(:code, min: 6, max: 6)
    |> validate_format(:email, ~r/@/)
    |> unique_constraint(:code, name: :unique_email_activation_code)
  end

  defp create_unique_code(email, analytics_context, attempts_left: n) do
    if n == 0 do
      {:error, :failed}
    else
      code = generate_code()
      expires_at = DateTime.utc_now() |> DateTime.add(5, :minute)

      cs = changeset(%{
        email: email,
        code: code,
        expires_at: expires_at,
        analytics_context: analytics_context
      })

      case Repo.insert(cs) do
        {:ok, record} -> {:ok, record}
        {:error, _} -> create_unique_code(email, analytics_context, attempts_left: n - 1)
      end
    end
  end

  @allowed_chars "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

  defp generate_code() do
    alpabet = String.split(@allowed_chars, "", trim: true)

    Enum.map(1..6, fn _ -> Enum.random(alpabet) end)
    |> Enum.join()
  end
end
