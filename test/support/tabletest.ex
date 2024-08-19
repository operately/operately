defmodule Operately.Support.Tabletest do
  defmacro tabletest(table, do: block) do
    quote do
      for testrow <- unquote(table) do
        @test testrow
        unquote(block)
      end
    end
  end
end
