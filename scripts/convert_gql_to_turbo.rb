spec = File.read("tmp/schema.graphql")

$lines = spec.lines
$index = 0

def to_snake_case(camel_cased_word)
  camel_cased_word.to_s.gsub(/::/, '/').
    gsub(/([A-Z]+)([A-Z][a-z])/,'\1_\2').
    gsub(/([a-z\d])([A-Z])/,'\1_\2').
    tr("-", "_").
    downcase
end

def convert_field_type(type)
  is_list = type.include?("[")
  type = type.gsub("[", "").gsub("]", "")

  type = case type
         when "String" then "string"
         when "Int" then "integer"
         when "Float" then "float"
         when "Boolean" then "boolean"
         when "ID" then "string"
         when "NaiveDateTime" then "datetime"
         when "DateTime" then "datetime"
         else type
         end

  if is_list
    "list_of(:#{to_snake_case(type)})"
  else
    ":#{to_snake_case(type)}"
  end
end

def convert_field(field)
  name = field.split(":")[0].strip
  type = field.split(":")[1].strip.gsub("!", "")

  "    field :#{to_snake_case(name)}, #{convert_field_type(type)}"
end

def convert_type
  line = $lines[$index]
  type = line.split(" ")[1]
  $index += 1

  puts "  object :#{to_snake_case(type)} do"

  while !$lines[$index].include?("}")
    puts convert_field($lines[$index].strip)
    $index += 1
  end

  puts "  end"
  puts ""
end

def convert_union
  line = $lines[$index]
  name = line.split(" ")[1]
  types = line.split(" = ")[1].split("|").map(&:strip)

  puts "  union :#{to_snake_case(name)}, types: ["
  types.each.with_index do |type, index|
    puts "    :#{to_snake_case(type)}" + (index == types.size - 1 ? "" : ",")
  end
  puts "  ]"
  puts ""

  $index += 1
end

def convert_spec
  while $index < $lines.size
    line = $lines[$index]

    if line.start_with?("type") && line.include?("{") && !line.include?("!") && !line.include?("Root")
      convert_type()
    end

    if line.include?("union")
      convert_union()
    end

    $index += 1
  end
end

puts "defmodule OperatelyWeb.Api.Types do"
puts "  use TurboConnect.Specs"
puts ""
convert_spec
puts "end"
