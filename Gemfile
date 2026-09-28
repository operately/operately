source 'https://rubygems.org'

# The latest release (7.2.1) requires rubyzip < 3. Pin upstream's Rubyzip 3 support
# until a compatible release is published: https://github.com/pivotal/LicenseFinder/pull/1072
gem 'license_finder', :group => :development,
  :git => 'https://github.com/pivotal/LicenseFinder.git',
  :ref => '1eb0c77f12f0bd43b9bd8353f748760057d69c18'
# Require the path traversal fix for the transitive dependency (Dependabot #48).
gem 'rubyzip', '>= 3.4.0', '< 4', :group => :development
gem 'racc', :group => :development
gem 'csv', :group => :development
