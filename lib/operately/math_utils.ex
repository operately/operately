defmodule Operately.MathUtils do
  def round_up(number, decimals) do
    multiplier = :math.pow(10, decimals)
    Float.ceil(number * multiplier) / multiplier
  end
end