defmodule Operately.Activities.Content do
  defmacro __using__(_) do
    quote do
      use Ecto.Schema
      import Ecto.Changeset

      @primary_key false
      @derive Jason.Encoder
    end
  end
end
