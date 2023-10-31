defmodule Operately.Schema do
  defmacro __using__(_) do
    quote do
      use Ecto.Schema
      import Ecto.Changeset
      import Operately.SoftDelete.Schema

      @primary_key {:id, :binary_id, autogenerate: true}
      @foreign_key_type :binary_id

      def changeset(attrs) do
        changeset(%__MODULE__{}, attrs)
      end
    end
  end
end
