defmodule Operately.Repo do
  use Ecto.Repo,
    otp_app: :operately,
    adapter: Ecto.Adapters.Postgres
end
