defmodule TurboConnect.Query do

  defmacro __using__(_) do
    quote do
      import TurboConnect.Query
      require TurboConnect.Query

      Module.register_attribute(__MODULE__, :input_fields, accumulate: true)
      Module.register_attribute(__MODULE__, :output_fields, accumulate: true)

      @before_compile unquote(__MODULE__)
    end
  end

  defmacro inputs(do: block) do
    quote do
      @segment :inputs
      unquote(block)
      @segment nil
    end
  end

  defmacro outputs(do: block) do
    quote do
      @segment :outputs
      unquote(block)
      @segment nil
    end
  end

  defmacro field(name, type, opts \\ []) do
    quote do
      segment = @segment

      unless segment do
        raise "field/2 must be called inside an inputs or outputs block"
      end

      case segment do
        :inputs ->
          @input_fields {unquote(name), unquote(type), unquote(opts)}
        :outputs ->
          @output_fields {unquote(name), unquote(type), unquote(opts)}
      end
    end
  end

  defmacro __before_compile__(_) do
    quote do
      def get_specs() do
        %{inputs: @input_fields, outputs: @output_fields}
      end
    end
  end
end
