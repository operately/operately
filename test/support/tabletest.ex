defmodule Operately.Support.Tabletest do
  defmacro tabletest(description, table, ctx, block) do
    quote do
      ExUnit.CaseTemplate.test "tabletest: #{unquote(description)}", unquote(ctx) do
        quote do
          for t <- table do
            block.(ctx, t)
          end
        end
      end
    end
  end
end
