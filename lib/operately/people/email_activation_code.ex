defmodule Operately.People.EmailActivationCode do
  use Operately.Schema

  schema "email_activation_codes" do
    field :email, :string
    field :code, :string
    field :expires_at, :utc_datetime

    timestamps()
  end

  def create(email) do
    with(
      {:ok, code} <- create_unique_code(email, attempts_left: 10),
      {:ok, _} <- OperatelyEmail.Emails.EmailActivationCodeEmail.send(code)
    ) do
      {:ok, code}
    end
  end

  defp changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  defp changeset(email_activation_code, attrs) do
    email_activation_code
    |> cast(attrs, [:email, :code, :expires_at])
    |> validate_required([:email, :code, :expires_at])
    |> validate_length(:code, min: 6, max: 6)
    |> validate_format(:email, ~r/@/)
    |> unique_constraint(:code, name: :unique_email_activation_code)
  end

  defp create_unique_code(email, attempts_left: n) do
    if n == 0 do
      {:error, :failed}
    else
      code = generate_code()
      expires_at = DateTime.utc_now() |> DateTime.add(30, :minute)

      cs = changeset(%{
        email: email, 
        code: code, 
        expires_at: expires_at
      })

      case Repo.insert(cs) do
        {:ok, record} -> {:ok, record}
        {:error, _} -> create_unique_code(email, attempts_left: n - 1)
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
