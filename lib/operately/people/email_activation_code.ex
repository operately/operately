defmodule Operately.People.EmailActivationCode do
  use Operately.Schema

  schema "email_activation_codes" do
    field :email, :string
    field :code, :string
    field :expires_at, :utc_datetime

    timestamps()
  end

  def create(email) do
    {:ok, code} = create_unique_code(email, attempts_left: 10)

    OperatelyEmail.Emails.EmailActivationCodeEmail.send(code)

    {:ok, code}
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
      expires_at = DateTime.utc_now() |> DateTime.add(24, :hour)
      cs = changeset(%{email: email, code: code, expires_at: expires_at})

      case Repo.insert(cs) do
        {:ok, _} -> {:ok, code}
        {:error, _} -> create_unique_code(email, attempts_left: n - 1)
      end
    end
  end

  defp generate_code() do
    :crypto.strong_rand_bytes(10)
    |> Base.url_encode64
    |> binary_part(0, 6)
    |> String.upcase()
  end

  def format_code(code) do
    <<c1::8, c2::8, c3::8, c4::8, c5::8, c6::8>> = code
    "#{c1}#{c2}#{c3}-#{c4}#{c5}#{c6}"
  end
end
